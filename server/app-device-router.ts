import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { appClients } from "@db/schema";
import { hashSecret, verifySecret } from "./lib/crypto";
import {
  claimCodeSchema,
  macAddressSchema,
  macLookupVariants,
} from "./lib/app-license";
import { isDuplicateKeyError } from "./lib/db-errors";

const pinSchema = z
  .string()
  .regex(/^\d{6}$/, "Le PIN doit contenir exactement 6 chiffres.");

// PUBLIC entry point called by the client application (TV/box) on first launch.
export const appDeviceRouter = createRouter({
  registerDevice: publicQuery
    .input(
      z.object({
        mac: macAddressSchema,
        pin: pinSchema,
        claimCode: claimCodeSchema.optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const mac = input.mac;
      let existing = (
        await db
          .select()
          .from(appClients)
          .where(inArray(appClients.mac, macLookupVariants(mac)))
          .limit(1)
      ).at(0);

      // New MAC → create the client (not yet activated).
      if (!existing) {
        try {
          await db.insert(appClients).values({
            mac,
            pinHash: hashSecret(input.pin),
            claimedAt: null,
          });
          return {
            registered: true,
            activated: false,
            alreadyKnown: false,
            verificationRequired: true,
          };
        } catch (error) {
          if (!isDuplicateKeyError(error)) throw error;
          // A concurrent registration won the unique-MAC insert. Reload that
          // row and apply the normal PIN/claim checks instead of returning 500.
          existing = (
            await db
              .select()
              .from(appClients)
              .where(inArray(appClients.mac, macLookupVariants(mac)))
              .limit(1)
          ).at(0);
          if (!existing) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "Enregistrement concurrent détecté. Veuillez réessayer.",
            });
          }
        }
      }

      // Known MAC that was pre-activated (admin/reseller) but never registered:
      // possession must be proven with the one-time code displayed to the
      // activator. Knowing a MAC address alone is never sufficient.
      if (!existing.pinHash) {
        const claimExpired =
          !existing.claimCodeExpiresAt ||
          existing.claimCodeExpiresAt.getTime() <= Date.now();
        if (
          !input.claimCode ||
          !existing.claimCodeHash ||
          claimExpired ||
          !verifySecret(input.claimCode, existing.claimCodeHash)
        ) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Code d'activation invalide ou expiré.",
          });
        }

        const updateResult = await db
          .update(appClients)
          .set({
            pinHash: hashSecret(input.pin),
            claimCodeHash: null,
            claimCodeExpiresAt: null,
            claimedAt: new Date(),
          })
          .where(
            and(
              eq(appClients.id, existing.id),
              isNull(appClients.pinHash),
              eq(appClients.claimCodeHash, existing.claimCodeHash)
            )
          );
        const affectedRows =
          (updateResult as unknown as [{ affectedRows?: number }])[0]
            ?.affectedRows ?? 0;

        // A concurrent request may have claimed the device between the SELECT
        // and UPDATE. Never overwrite that winner's PIN.
        if (affectedRows < 1) {
          const current = (
            await db
              .select()
              .from(appClients)
              .where(eq(appClients.id, existing.id))
              .limit(1)
          ).at(0);
          if (!current?.pinHash || !verifySecret(input.pin, current.pinHash)) {
            throw new TRPCError({
              code: "CONFLICT",
              message:
                "Cet appareil vient d'être enregistré avec un autre PIN.",
            });
          }
        }
        return {
          registered: true,
          activated: existing.licenseType != null,
          alreadyKnown: true,
          verificationRequired: false,
        };
      }

      // Known MAC with a PIN → the PIN must match; nothing is mutated.
      if (!verifySecret(input.pin, existing.pinHash)) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "PIN incorrect pour cette adresse MAC.",
        });
      }

      // Idempotent: same MAC + correct PIN, no side effects.
      return {
        registered: true,
        activated: existing.licenseType != null,
        alreadyKnown: true,
        verificationRequired: existing.claimedAt == null,
      };
    }),
});
