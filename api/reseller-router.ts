import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { createRouter, publicQuery, resellerQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { appClients, resellers, activations } from "@db/schema";
import type { Reseller } from "@db/schema";
import { ResellerSession } from "@contracts/constants";
import { hashSecret, verifySecret } from "./lib/crypto";
import { signResellerSession } from "./lib/app-sessions";
import { appendSessionCookie, clearSessionCookie } from "./lib/cookies";
import {
  licenseTypeSchema,
  creditCost,
  computeExpiry,
  normalizeMac,
  autoEmail,
} from "./lib/app-license";

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
    .input(z.object({ username: z.string().trim().min(1), password: z.string().min(1) }))
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

      const token = await signResellerSession(reseller.id);
      appendSessionCookie(
        ctx.resHeaders,
        ctx.req.headers,
        ResellerSession.cookieName,
        token,
        ResellerSession.maxAgeMs,
      );
      return { success: true };
    }),

  logout: resellerQuery.mutation(({ ctx }) => {
    clearSessionCookie(ctx.resHeaders, ctx.req.headers, ResellerSession.cookieName);
    return { success: true };
  }),

  me: resellerQuery.query(({ ctx }) => resellerProfile(ctx.reseller)),

  // Activate a device against the reseller's credit balance.
  activate: resellerQuery
    .input(
      z.object({
        mac: z.string().trim().min(3).max(64),
        name: z.string().trim().min(1).max(255).optional(),
        email: z.string().email().optional(),
        licenseType: licenseTypeSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const resellerId = ctx.reseller.id;
      const cost = creditCost(input.licenseType);
      const mac = normalizeMac(input.mac);
      const now = new Date();
      const expiresAt = computeExpiry(input.licenseType, now);
      const email = input.email?.trim() || autoEmail(input.name, mac);

      const outcome = await getDb().transaction(async (tx) => {
        // Atomic, race-safe deduction: the WHERE clause only matches when the
        // balance still covers the cost, so two concurrent activations can never
        // drive credits negative (the second blocks on the row lock, then
        // re-evaluates the guard).
        const dec = await tx
          .update(resellers)
          .set({ credits: sql`${resellers.credits} - ${cost}` })
          .where(and(eq(resellers.id, resellerId), gte(resellers.credits, cost)));
        const affected = (dec as unknown as [{ affectedRows: number }])[0]?.affectedRows ?? 0;
        if (affected < 1) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Crédits insuffisants pour cette activation.",
          });
        }

        const existing = (
          await tx.select().from(appClients).where(eq(appClients.mac, mac)).limit(1)
        ).at(0);

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
            })
            .where(eq(appClients.id, existing.id));
        }

        await tx.insert(activations).values({
          appClientId,
          mac,
          licenseType: input.licenseType,
          creditsCharged: cost,
          activatedByType: "reseller",
          activatedByResellerId: resellerId,
        });

        return { appClientId };
      });

      const updated = (
        await getDb()
          .select({ credits: resellers.credits })
          .from(resellers)
          .where(eq(resellers.id, resellerId))
          .limit(1)
      ).at(0);

      return {
        success: true,
        appClientId: outcome.appClientId,
        mac,
        licenseType: input.licenseType,
        creditsCharged: cost,
        remainingCredits: updated?.credits ?? null,
      };
    }),

  // Personal history only — never another reseller's. Joins the client so the
  // portal can search/display by name & email (activations only store the MAC).
  myActivations: resellerQuery.query(async ({ ctx }) => {
    return getDb()
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
      })
      .from(activations)
      .leftJoin(appClients, eq(activations.appClientId, appClients.id))
      .where(eq(activations.activatedByResellerId, ctx.reseller.id))
      .orderBy(desc(activations.createdAt));
  }),

  changePassword: resellerQuery
    .input(
      z.object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(8).max(255),
      }),
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
      return { success: true };
    }),
});
