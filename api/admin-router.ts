import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { orders, customers } from "@db/schema";
import { eq, desc, count } from "drizzle-orm";

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
  orderList: publicQuery.query(async () => {
    return getDb().query.orders.findMany({
      orderBy: [desc(orders.createdAt)],
    });
  }),

  orderCreate: publicQuery
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

  orderUpdateStatus: publicQuery
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

  orderDelete: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await getDb().delete(orders).where(eq(orders.id, input.id));
      return { success: true };
    }),

  orderStats: publicQuery.query(async () => {
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
  customerList: publicQuery.query(async () => {
    return getDb().query.customers.findMany({
      orderBy: [desc(customers.createdAt)],
    });
  }),

  customerCreate: publicQuery
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

  customerUpdateStatus: publicQuery
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

  customerDelete: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await getDb().delete(customers).where(eq(customers.id, input.id));
      return { success: true };
    }),

  customerStats: publicQuery.query(async () => {
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
});
