import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { appClients } from "@db/schema";
import { hashSecret, verifySecret } from "./lib/crypto";
import { normalizeMac } from "./lib/app-license";

const macSchema = z.string().trim().min(3).max(64);
const pinSchema = z.string().min(4).max(64);

// PUBLIC entry point called by the client application (TV/box) on first launch.
export const appDeviceRouter = createRouter({
  registerDevice: publicQuery
    .input(z.object({ mac: macSchema, pin: pinSchema }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const mac = normalizeMac(input.mac);
      const existing = (
        await db.select().from(appClients).where(eq(appClients.mac, mac)).limit(1)
      ).at(0);

      // New MAC → create the client (not yet activated).
      if (!existing) {
        await db.insert(appClients).values({ mac, pinHash: hashSecret(input.pin) });
        return { registered: true, activated: false, alreadyKnown: false };
      }

      // Known MAC that was pre-activated (admin/reseller) but never registered:
      // let the device claim its PIN now.
      if (!existing.pinHash) {
        await db
          .update(appClients)
          .set({ pinHash: hashSecret(input.pin) })
          .where(eq(appClients.id, existing.id));
        return {
          registered: true,
          activated: existing.licenseType != null,
          alreadyKnown: true,
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
      };
    }),
});
