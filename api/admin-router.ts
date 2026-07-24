import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { orders, customers, appClients, resellers, activations } from "@db/schema";
import type { Reseller } from "@db/schema";
import { eq, desc, count } from "drizzle-orm";
import { hashSecret } from "./lib/crypto";
import {
  licenseTypeSchema,
  computeExpiry,
  normalizeMac,
  autoEmail,
  licenseStatus,
} from "./lib/app-license";

// Public reseller shape for admin responses — never leaks passwordHash.
function resellerAdminView(r: Reseller) {
  return {
    id: r.id,
    name: r.name,
    contact: r.contact,
    username: r.username,
    credits: r.credits,
    createdAt: r.createdAt,
  };
}

// Generate a random activation code: CINE + 6 alphanumeric chars
function generateActivationCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "CINE";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const adminRouter = createRouter({
  // Orders
  orderList: adminQuery.query(async () => {
    return getDb().query.orders.findMany({
      orderBy: [desc(orders.createdAt)],
    });
  }),

  orderCreate: adminQuery
    .input(
      z.object({
        customerName: z.string().min(1),
        customerEmail: z.string().email(),
        customerPhone: z.string().min(1),
        planId: z.string(),
        planName: z.string(),
        planType: z.enum(["client", "reseller"]),
        price: z.string(),
        device: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const activationCode = generateActivationCode();
      const result = await getDb()
        .insert(orders)
        .values({
          ...input,
          device: input.device || null,
          status: "pending",
          activationCode,
        })
        .$returningId();
      return { id: result[0].id, activationCode };
    }),

  orderUpdateStatus: adminQuery
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["pending", "active", "expired", "cancelled"]),
      })
    )
    .mutation(async ({ input }) => {
      await getDb()
        .update(orders)
        .set({ status: input.status })
        .where(eq(orders.id, input.id));
      return { success: true };
    }),

  orderDelete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await getDb().delete(orders).where(eq(orders.id, input.id));
      return { success: true };
    }),

  orderStats: adminQuery.query(async () => {
    const db = getDb();
    const allOrders = await db.select({ count: count() }).from(orders);
    const pendingOrders = await db
      .select({ count: count() })
      .from(orders)
      .where(eq(orders.status, "pending"));
    const activeOrders = await db
      .select({ count: count() })
      .from(orders)
      .where(eq(orders.status, "active"));
    return {
      total: allOrders[0].count,
      pending: pendingOrders[0].count,
      active: activeOrders[0].count,
    };
  }),

  // Customers
  customerList: adminQuery.query(async () => {
    return getDb().query.customers.findMany({
      orderBy: [desc(customers.createdAt)],
    });
  }),

  customerCreate: adminQuery
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
        phone: z.string().min(1),
        device: z.string().optional(),
        planId: z.string(),
        planName: z.string(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await getDb()
        .insert(customers)
        .values({
          ...input,
          device: input.device || null,
          notes: input.notes || null,
          status: "active",
        })
        .$returningId();
      return result[0];
    }),

  customerUpdateStatus: adminQuery
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["active", "expired", "suspended"]),
      })
    )
    .mutation(async ({ input }) => {
      await getDb()
        .update(customers)
        .set({ status: input.status })
        .where(eq(customers.id, input.id));
      return { success: true };
    }),

  customerDelete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await getDb().delete(customers).where(eq(customers.id, input.id));
      return { success: true };
    }),

  customerStats: adminQuery.query(async () => {
    const db = getDb();
    const allCustomers = await db.select({ count: count() }).from(customers);
    const activeCustomers = await db
      .select({ count: count() })
      .from(customers)
      .where(eq(customers.status, "active"));
    return {
      total: allCustomers[0].count,
      active: activeCustomers[0].count,
    };
  }),

  // -------------------------------------------------------------------------
  // Application licence — admin procedures (free, no credit deduction).
  // -------------------------------------------------------------------------

  appClientList: adminQuery.query(async () => {
    return getDb().query.appClients.findMany({
      orderBy: [desc(appClients.createdAt)],
    });
  }),

  appClientActivate: adminQuery
    .input(
      z.object({
        mac: z.string().trim().min(3).max(64),
        name: z.string().trim().min(1).max(255).optional(),
        email: z.string().email().optional(),
        licenseType: licenseTypeSchema,
      }),
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const mac = normalizeMac(input.mac);
      const now = new Date();
      const expiresAt = computeExpiry(input.licenseType, now);
      const email = input.email?.trim() || autoEmail(input.name, mac);

      const existing = (
        await db.select().from(appClients).where(eq(appClients.mac, mac)).limit(1)
      ).at(0);

      // Guard: don't silently re-create/overwrite an already-active licence.
      if (existing && licenseStatus(existing) === "active") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Cette MAC a déjà une licence active. Utilisez appClientRenew pour la renouveler.",
        });
      }

      let appClientId: number;
      if (!existing) {
        const ins = await db
          .insert(appClients)
          .values({
            mac,
            name: input.name ?? null,
            email,
            licenseType: input.licenseType,
            activatedByType: "admin",
            activatedAt: now,
            expiresAt,
          })
          .$returningId();
        appClientId = ins[0].id;
      } else {
        appClientId = existing.id;
        await db
          .update(appClients)
          .set({
            name: input.name ?? existing.name,
            email: existing.email ?? email,
            licenseType: input.licenseType,
            activatedByType: "admin",
            activatedByResellerId: null,
            activatedAt: now,
            expiresAt,
          })
          .where(eq(appClients.id, existing.id));
      }

      await db.insert(activations).values({
        appClientId,
        mac,
        licenseType: input.licenseType,
        creditsCharged: 0,
        activatedByType: "admin",
      });

      return { success: true, appClientId, licenseType: input.licenseType };
    }),

  appClientRenew: adminQuery
    .input(
      z.object({
        appClientId: z.number().int().positive(),
        licenseType: licenseTypeSchema,
      }),
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const client = (
        await db.select().from(appClients).where(eq(appClients.id, input.appClientId)).limit(1)
      ).at(0);
      if (!client) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Client introuvable." });
      }

      const now = new Date();
      const expiresAt = computeExpiry(input.licenseType, now);

      await db
        .update(appClients)
        .set({
          licenseType: input.licenseType,
          activatedByType: "admin",
          activatedByResellerId: null,
          activatedAt: now,
          expiresAt,
        })
        .where(eq(appClients.id, client.id));

      await db.insert(activations).values({
        appClientId: client.id,
        mac: client.mac,
        licenseType: input.licenseType,
        creditsCharged: 0,
        activatedByType: "admin",
      });

      return { success: true, appClientId: client.id, licenseType: input.licenseType };
    }),

  // Resellers ---------------------------------------------------------------

  resellerList: adminQuery.query(async () => {
    const rows = await getDb()
      .select()
      .from(resellers)
      .orderBy(desc(resellers.createdAt));
    return rows.map(resellerAdminView);
  }),

  resellerCreate: adminQuery
    .input(
      z.object({
        name: z.string().trim().min(1).max(255),
        contact: z.string().trim().max(255).optional(),
        username: z.string().trim().min(3).max(100),
        password: z.string().min(8).max(255),
        initialCredits: z.number().int().min(0).default(0),
      }),
    )
    .mutation(async ({ input }) => {
      const result = await getDb()
        .insert(resellers)
        .values({
          name: input.name,
          contact: input.contact ?? null,
          username: input.username,
          passwordHash: hashSecret(input.password),
          credits: input.initialCredits,
        })
        .$returningId();
      return { id: result[0].id, username: input.username };
    }),

  resellerAddCredits: adminQuery
    .input(
      z.object({
        resellerId: z.number().int().positive(),
        amount: z.number().int().positive(),
      }),
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const reseller = (
        await db.select().from(resellers).where(eq(resellers.id, input.resellerId)).limit(1)
      ).at(0);
      if (!reseller) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Revendeur introuvable." });
      }
      await db
        .update(resellers)
        .set({ credits: reseller.credits + input.amount })
        .where(eq(resellers.id, input.resellerId));
      return { success: true, credits: reseller.credits + input.amount };
    }),

  resellerActivationHistory: adminQuery
    .input(z.object({ resellerId: z.number().int().positive() }))
    .query(async ({ input }) => {
      return getDb()
        .select()
        .from(activations)
        .where(eq(activations.activatedByResellerId, input.resellerId))
        .orderBy(desc(activations.createdAt));
    }),

  // Global feed of recent activations (admin + reseller), most recent first.
  activationList: adminQuery
    .input(z.object({ limit: z.number().int().min(1).max(500).default(100) }).optional())
    .query(async ({ input }) => {
      return getDb()
        .select()
        .from(activations)
        .orderBy(desc(activations.createdAt))
        .limit(input?.limit ?? 100);
    }),
});
