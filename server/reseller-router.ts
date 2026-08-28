import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { createRouter, publicQuery, resellerQuery } from "./middleware";
import { getDb } from "./queries/connection";
import {
  appClients,
  resellers,
  activations,
  resellerCreditLedger,
} from "@db/schema";
import type { Reseller } from "@db/schema";
import { ResellerSession } from "@contracts/constants";
import { hashSecret, verifySecret } from "./lib/crypto";
import {
  sessionVersionForCredential,
  signResellerSession,
} from "./lib/app-sessions";
import { appendSessionCookie, clearSessionCookie } from "./lib/cookies";
import {
  revokeSession,
  schedulePurgeAfterRevocation,
} from "./lib/session-revocation";
import {
  licenseTypeSchema,
  creditCost,
  computeRenewalExpiry,
  macAddressSchema,
  macLookupVariants,
  autoEmail,
  licenseStatus,
} from "./lib/app-license";
import { createClaimCredential } from "./lib/claim-code";
import { isDuplicateKeyError } from "./lib/db-errors";

// Public shape — never leaks passwordHash.
function resellerProfile(r: Reseller) {
  return {
    id: r.id,
    name: r.name,
    contact: r.contact,
    username: r.username,
    credits: r.credits,
    createdAt: r.createdAt,
  };
}

export const resellerRouter = createRouter({
  // Reseller login — separate session system from admin AND client auth.
  login: publicQuery
    .input(
      z.object({
        username: z.string().trim().min(1),
        password: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const reseller = (
        await getDb()
          .select()
          .from(resellers)
          .where(eq(resellers.username, input.username))
          .limit(1)
      ).at(0);

      if (!reseller || !verifySecret(input.password, reseller.passwordHash)) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Identifiant ou mot de passe incorrect.",
        });
      }

      const token = await signResellerSession(
        reseller.id,
        sessionVersionForCredential(reseller.passwordHash)
      );
      appendSessionCookie(
        ctx.resHeaders,
        ctx.req.headers,
        ResellerSession.cookieName,
        token,
        ResellerSession.maxAgeMs
      );
      return { success: true };
    }),

  logout: resellerQuery.mutation(async ({ ctx }) => {
    // resellerQuery guarantees ctx.reseller, which in turn guarantees
    // ctx.resellerSession was populated by createContext().
    const session = ctx.resellerSession;
    if (session) {
      await revokeSession(session.jti, "reseller", session.expiresAt);
      clearSessionCookie(
        ctx.resHeaders,
        ctx.req.headers,
        ResellerSession.cookieName
      );
      // Deterministic, bounded, best-effort — only after a revocation this
      // request actually recorded.
      schedulePurgeAfterRevocation();
    }
    return { success: true };
  }),

  me: resellerQuery.query(({ ctx }) => resellerProfile(ctx.reseller)),

  // Activate a device against the reseller's credit balance.
  activate: resellerQuery
    .input(
      z.object({
        mac: macAddressSchema,
        name: z.string().trim().min(1).max(255).optional(),
        email: z.string().email().optional(),
        licenseType: licenseTypeSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const resellerId = ctx.reseller.id;
      const cost = creditCost(input.licenseType);
      const mac = input.mac;
      const now = new Date();
      const email = input.email?.trim() || autoEmail(input.name, mac);

      const outcome = await getDb()
        .transaction(async tx => {
          const existing = (
            await tx
              .select()
              .from(appClients)
              .where(inArray(appClients.mac, macLookupVariants(mac)))
              .limit(1)
              .for("update")
          ).at(0);

          if (
            existing?.licenseType &&
            (existing.activatedByType !== "reseller" ||
              existing.activatedByResellerId !== resellerId)
          ) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message:
                "Cette licence est gérée par un autre compte. Contactez l'administrateur.",
            });
          }

          if (
            existing?.licenseType === "unlimited" &&
            licenseStatus(existing) === "active"
          ) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Cet appareil possède déjà une licence illimitée.",
            });
          }

          // Atomic, race-safe deduction: the WHERE clause only matches when the
          // balance still covers the cost, so two concurrent activations can never
          // drive credits negative (the second blocks on the row lock, then
          // re-evaluates the guard).
          const dec = await tx
            .update(resellers)
            .set({ credits: sql`${resellers.credits} - ${cost}` })
            .where(
              and(eq(resellers.id, resellerId), gte(resellers.credits, cost))
            );
          const affected =
            (dec as unknown as [{ affectedRows: number }])[0]?.affectedRows ??
            0;
          if (affected < 1) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Crédits insuffisants pour cette activation.",
            });
          }

          const balance = (
            await tx
              .select({ credits: resellers.credits })
              .from(resellers)
              .where(eq(resellers.id, resellerId))
              .limit(1)
          ).at(0);
          if (!balance) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Revendeur introuvable.",
            });
          }

          const expiresAt = computeRenewalExpiry(
            input.licenseType,
            now,
            existing?.expiresAt ?? null
          );
          const claim = existing?.claimedAt ? null : createClaimCredential(now);

          let appClientId: number;
          if (!existing) {
            const ins = await tx
              .insert(appClients)
              .values({
                mac,
                name: input.name ?? null,
                email,
                licenseType: input.licenseType,
                activatedByType: "reseller",
                activatedByResellerId: resellerId,
                activatedAt: now,
                expiresAt,
                claimCodeHash: claim?.claimCodeHash ?? null,
                claimCodeExpiresAt: claim?.claimCodeExpiresAt ?? null,
              })
              .$returningId();
            appClientId = ins[0].id;
          } else {
            appClientId = existing.id;
            await tx
              .update(appClients)
              .set({
                name: input.name ?? existing.name,
                email: existing.email ?? email,
                licenseType: input.licenseType,
                activatedByType: "reseller",
                activatedByResellerId: resellerId,
                activatedAt: now,
                expiresAt,
                ...(claim
                  ? {
                      pinHash: null,
                      claimedAt: null,
                      claimCodeHash: claim.claimCodeHash,
                      claimCodeExpiresAt: claim.claimCodeExpiresAt,
                    }
                  : {}),
              })
              .where(eq(appClients.id, existing.id));
          }

          const activationResult = await tx
            .insert(activations)
            .values({
              appClientId,
              mac,
              licenseType: input.licenseType,
              creditsCharged: cost,
              activatedByType: "reseller",
              activatedByResellerId: resellerId,
            })
            .$returningId();
          const activationId = activationResult[0].id;

          await tx.insert(resellerCreditLedger).values({
            resellerId,
            delta: -cost,
            balanceAfter: balance.credits,
            entryType: "activation",
            activationId,
            actorType: "reseller",
            reason: `${existing?.licenseType ? "Renouvellement" : "Activation"} ${input.licenseType} — ${mac}`,
          });

          return {
            appClientId,
            activationId,
            remainingCredits: balance.credits,
            expiresAt,
            claim,
            action: existing?.licenseType ? "renewed" : "activated",
          } as const;
        })
        .catch((error: unknown) => {
          if (isDuplicateKeyError(error)) {
            throw new TRPCError({
              code: "CONFLICT",
              message:
                "Une fiche existe déjà avec cette MAC ou cette adresse e-mail.",
            });
          }
          throw error;
        });

      return {
        success: true,
        appClientId: outcome.appClientId,
        mac,
        licenseType: input.licenseType,
        creditsCharged: cost,
        remainingCredits: outcome.remainingCredits,
        expiresAt: outcome.expiresAt,
        action: outcome.action,
        claimCode: outcome.claim?.claimCode ?? null,
        claimCodeExpiresAt: outcome.claim?.claimCodeExpiresAt ?? null,
      };
    }),

  issueClaimCode: resellerQuery
    .input(z.object({ appClientId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const claim = createClaimCredential();
      await getDb().transaction(async tx => {
        const client = (
          await tx
            .select()
            .from(appClients)
            .where(
              and(
                eq(appClients.id, input.appClientId),
                eq(appClients.activatedByResellerId, ctx.reseller.id)
              )
            )
            .limit(1)
            .for("update")
        ).at(0);
        if (!client) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Client introuvable.",
          });
        }
        if (client.pinHash && client.claimedAt) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Cet appareil est déjà enregistré avec son PIN.",
          });
        }
        await tx
          .update(appClients)
          .set({
            pinHash: null,
            claimedAt: null,
            claimCodeHash: claim.claimCodeHash,
            claimCodeExpiresAt: claim.claimCodeExpiresAt,
          })
          .where(eq(appClients.id, client.id));
      });
      return {
        appClientId: input.appClientId,
        claimCode: claim.claimCode,
        claimCodeExpiresAt: claim.claimCodeExpiresAt,
      };
    }),

  // Personal history only — never another reseller's. Joins the client so the
  // portal can search/display by name & email (activations only store the MAC).
  myActivations: resellerQuery.query(async ({ ctx }) => {
    const rows = await getDb()
      .select({
        id: activations.id,
        appClientId: activations.appClientId,
        mac: activations.mac,
        licenseType: activations.licenseType,
        creditsCharged: activations.creditsCharged,
        activatedByResellerId: activations.activatedByResellerId,
        createdAt: activations.createdAt,
        clientName: appClients.name,
        clientEmail: appClients.email,
        clientPinHash: appClients.pinHash,
        clientClaimedAt: appClients.claimedAt,
        claimCodeExpiresAt: appClients.claimCodeExpiresAt,
      })
      .from(activations)
      .leftJoin(appClients, eq(activations.appClientId, appClients.id))
      .where(eq(activations.activatedByResellerId, ctx.reseller.id))
      .orderBy(desc(activations.createdAt));
    return rows.map(({ clientPinHash, clientClaimedAt, ...row }) => ({
      ...row,
      clientRegistered: clientPinHash != null && clientClaimedAt != null,
      claimCodePending:
        clientClaimedAt == null &&
        row.claimCodeExpiresAt != null &&
        row.claimCodeExpiresAt.getTime() > Date.now(),
    }));
  }),

  creditHistory: resellerQuery
    .input(
      z
        .object({ limit: z.number().int().min(1).max(500).default(200) })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      return getDb()
        .select()
        .from(resellerCreditLedger)
        .where(eq(resellerCreditLedger.resellerId, ctx.reseller.id))
        .orderBy(desc(resellerCreditLedger.createdAt))
        .limit(input?.limit ?? 200);
    }),

  changePassword: resellerQuery
    .input(
      z.object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(8).max(255),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!verifySecret(input.currentPassword, ctx.reseller.passwordHash)) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Mot de passe actuel incorrect.",
        });
      }
      await getDb()
        .update(resellers)
        .set({ passwordHash: hashSecret(input.newPassword) })
        .where(eq(resellers.id, ctx.reseller.id));
      clearSessionCookie(
        ctx.resHeaders,
        ctx.req.headers,
        ResellerSession.cookieName
      );
      return { success: true };
    }),
});
