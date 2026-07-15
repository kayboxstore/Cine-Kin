import { describe, it, expect, vi } from "vitest";
import { appRouter } from "./router";
import { createCallerFactory } from "./middleware";
import type { TrpcContext } from "./context";
import type { User } from "@db/schema";

// Stub the DB layer so the admin happy-path resolver runs without a real
// MySQL connection. Auth middleware runs *before* the resolver, so the
// unauthorized/forbidden tests never reach this.
vi.mock("./queries/connection", () => {
  const rows = [{ count: 0 }];
  const thenableWithWhere = {
    where: () => Promise.resolve(rows),
    then: (onFulfilled: (v: typeof rows) => unknown, onRejected?: (e: unknown) => unknown) =>
      Promise.resolve(rows).then(onFulfilled, onRejected),
  };
  return {
    getDb: () => ({
      select: () => ({ from: () => thenableWithWhere }),
    }),
  };
});

const createCaller = createCallerFactory(appRouter);

function makeCtx(user?: User): TrpcContext {
  return {
    req: new Request("http://localhost/api/trpc"),
    resHeaders: new Headers(),
    user,
  };
}

const adminUser: User = {
  id: 1,
  unionId: "union-admin",
  name: "Admin",
  email: null,
  avatar: null,
  role: "admin",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignInAt: new Date(),
};

const normalUser: User = { ...adminUser, id: 2, unionId: "union-user", role: "user" };

// Every mutating/reading admin procedure, invoked with a type-valid input.
// The input is irrelevant to the auth tests: the authorization middleware
// rejects before input validation or the resolver ever run.
function adminCalls(caller: ReturnType<typeof createCaller>) {
  return [
    ["orderList", () => caller.admin.orderList()],
    ["orderStats", () => caller.admin.orderStats()],
    ["customerList", () => caller.admin.customerList()],
    ["customerStats", () => caller.admin.customerStats()],
    [
      "orderCreate",
      () =>
        caller.admin.orderCreate({
          customerName: "x",
          customerEmail: "x@example.com",
          customerPhone: "1",
          planId: "p",
          planName: "P",
          planType: "client",
          price: "9.99",
        }),
    ],
    ["orderUpdateStatus", () => caller.admin.orderUpdateStatus({ id: 1, status: "active" })],
    ["orderDelete", () => caller.admin.orderDelete({ id: 1 })],
    [
      "customerCreate",
      () =>
        caller.admin.customerCreate({
          name: "x",
          email: "x@example.com",
          phone: "1",
          planId: "p",
          planName: "P",
        }),
    ],
    ["customerUpdateStatus", () => caller.admin.customerUpdateStatus({ id: 1, status: "active" })],
    ["customerDelete", () => caller.admin.customerDelete({ id: 1 })],
  ] as const;
}

describe("admin router authorization", () => {
  it("rejects anonymous callers with UNAUTHORIZED on every procedure", async () => {
    const caller = createCaller(makeCtx(undefined));
    for (const [name, call] of adminCalls(caller)) {
      await expect(call(), `${name} should reject anonymous callers`).rejects.toMatchObject({
        code: "UNAUTHORIZED",
      });
    }
  });

  it("rejects authenticated non-admin callers with FORBIDDEN on every procedure", async () => {
    const caller = createCaller(makeCtx(normalUser));
    for (const [name, call] of adminCalls(caller)) {
      await expect(call(), `${name} should reject non-admin callers`).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    }
  });

  it("allows an admin caller past the authorization guard", async () => {
    const caller = createCaller(makeCtx(adminUser));
    await expect(caller.admin.orderStats()).resolves.toEqual({
      total: 0,
      pending: 0,
      active: 0,
    });
  });
});

describe("public router", () => {
  it("keeps ping open to unauthenticated callers", async () => {
    const caller = createCaller(makeCtx(undefined));
    const res = await caller.ping();
    expect(res.ok).toBe(true);
  });
});
