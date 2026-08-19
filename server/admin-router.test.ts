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
type Caller = ReturnType<typeof createCaller>;

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

// One descriptor per sensitive admin procedure. The input is irrelevant to
// the authorization tests: the auth middleware rejects before input
// validation or the resolver ever run.
const PROCEDURES: { name: string; call: (c: Caller) => Promise<unknown> }[] = [
  { name: "orderList", call: (c) => c.admin.orderList() },
  { name: "orderStats", call: (c) => c.admin.orderStats() },
  { name: "customerList", call: (c) => c.admin.customerList() },
  { name: "customerStats", call: (c) => c.admin.customerStats() },
  {
    name: "orderCreate",
    call: (c) =>
      c.admin.orderCreate({
        customerName: "x",
        customerEmail: "x@example.com",
        customerPhone: "1",
        planId: "p",
        planName: "P",
        planType: "client",
        price: "10",
      }),
  },
  { name: "orderUpdateStatus", call: (c) => c.admin.orderUpdateStatus({ id: 1, status: "active" }) },
  { name: "orderDelete", call: (c) => c.admin.orderDelete({ id: 1 }) },
  {
    name: "customerCreate",
    call: (c) =>
      c.admin.customerCreate({
        name: "x",
        email: "x@example.com",
        phone: "1",
        planId: "p",
        planName: "P",
      }),
  },
  { name: "customerUpdateStatus", call: (c) => c.admin.customerUpdateStatus({ id: 1, status: "active" }) },
  { name: "customerDelete", call: (c) => c.admin.customerDelete({ id: 1 }) },
];

// One test per procedure: a call with NO session must be rejected before
// reaching the resolver.
describe("admin router — anonymous caller (no session) is rejected", () => {
  it.each(PROCEDURES)("$name → UNAUTHORIZED", async ({ call }) => {
    const caller = createCaller(makeCtx(undefined));
    await expect(call(caller)).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});

// One test per procedure: a call with a VALID but non-admin session must
// also be rejected. This is the case that should have caught AUDIT §2.1.
describe("admin router — authenticated non-admin caller is rejected", () => {
  it.each(PROCEDURES)("$name → FORBIDDEN", async ({ call }) => {
    const caller = createCaller(makeCtx(normalUser));
    await expect(call(caller)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe("admin router — admin caller passes the authorization guard", () => {
  it("orderStats resolves for an admin session", async () => {
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
