import { beforeEach, describe, expect, it, vi } from "vitest";
import * as cookie from "cookie";

vi.hoisted(() => {
  process.env.NODE_ENV = "test";
  process.env.APP_SECRET = "test-app-secret-0123456789-abcdefghij";
  process.env.SESSION_SECRET = "test-session-secret-0123456789-abcdefghij";
  process.env.ADMIN_PASSWORD = "test-only-fake-admin-password";
});

// Stateful in-memory fake for revoked_auth_sessions — behaviorally real
// (idempotent insert, actual presence check), not just call-recording.
const shared = vi.hoisted(() => ({
  revoked: new Set<string>(),
  dbError: null as Error | null,
}));

vi.mock("drizzle-orm", async importOriginal => {
  const actual = await importOriginal<typeof import("drizzle-orm")>();
  return {
    ...actual,
    eq: (col: { name: string }, val: unknown) => ({ __c: "eq", col: col.name, val }),
    lt: () => ({ __c: "lt" }),
    sql: () => ({ __c: "sql-self-ref" }),
  };
});

vi.mock("./queries/connection", () => ({
  getDb: () => {
    if (shared.dbError) throw shared.dbError;
    return {
      insert: () => ({
        values: (row: { jti: string }) => ({
          onDuplicateKeyUpdate: async () => {
            shared.revoked.add(row.jti);
          },
        }),
      }),
      select: () => ({
        from: () => ({
          where: (cond: { col: string; val: unknown }) => ({
            limit: async () =>
              cond.col === "jti" && shared.revoked.has(cond.val as string)
                ? [{ jti: cond.val }]
                : [],
          }),
        }),
      }),
      delete: () => ({ where: () => ({ limit: async () => {} }) }),
    };
  },
}));

import { appRouter } from "./router";
import { createCallerFactory } from "./middleware";
import { createContext } from "./context";

const createCaller = createCallerFactory(appRouter);

async function contextFrom(cookieHeader: string) {
  const req = new Request("http://localhost/api/trpc", {
    headers: cookieHeader ? { cookie: cookieHeader } : {},
  });
  return createContext({ req, resHeaders: new Headers() } as never);
}

async function loginAdmin() {
  const resHeaders = new Headers();
  const ctx = await createContext({
    req: new Request("http://localhost/api/trpc/auth.adminLogin"),
    resHeaders,
  } as never);
  const caller = createCaller(ctx);
  await caller.auth.adminLogin({ password: "test-only-fake-admin-password" });
  const parsed = resHeaders
    .getSetCookie()
    .map(c => cookie.parse(c))
    .find(c => "ck_admin_sid" in c);
  const token = parsed?.ck_admin_sid;
  if (!token) throw new Error("admin login did not set a cookie");
  return `ck_admin_sid=${token}`;
}

describe("session revocation — end to end", () => {
  beforeEach(() => {
    shared.revoked.clear();
    shared.dbError = null;
  });

  it("rejects a captured cookie replayed after logout (the reported vulnerability, now fixed)", async () => {
    const cookieHeader = await loginAdmin();

    const beforeLogout = await contextFrom(cookieHeader);
    expect(beforeLogout.user).toBeDefined();

    await createCaller(beforeLogout).auth.logout();

    const replayed = await contextFrom(cookieHeader);
    expect(replayed.user).toBeUndefined();
  });

  it("preserves a second, independent session after the first is revoked (multi-device)", async () => {
    const sessionA = await loginAdmin();
    const sessionB = await loginAdmin(); // distinct jti — a second login/device

    await createCaller(await contextFrom(sessionA)).auth.logout();

    await expect((await contextFrom(sessionA)).user).toBeUndefined();
    // The reported real-world scenario: logging out on one device (phone)
    // must not invalidate a legitimate concurrent session (PC).
    expect((await contextFrom(sessionB)).user).toBeDefined();
  });

  it("fails closed when the revocation check cannot reach the database", async () => {
    const cookieHeader = await loginAdmin();
    shared.dbError = new Error("simulated MySQL outage");

    const ctx = await contextFrom(cookieHeader);

    // Never fall through to "not revoked, so allow" — a DB error must deny
    // authentication exactly like an invalid token would.
    expect(ctx.user).toBeUndefined();
  });

  it("returns a plain auth error (not a crash) on a repeated logout from a second tab", async () => {
    const cookieHeader = await loginAdmin();
    const tabA = await contextFrom(cookieHeader);
    const tabB = await contextFrom(cookieHeader); // same cookie, second context

    await createCaller(tabA).auth.logout();

    // Tab B still holds the now-revoked cookie: its own context resolution
    // (fail-closed, proven above) already denies it, so `ctx.user` is unset
    // by the time logout's own `authedQuery` guard runs — the mutation
    // rejects with a normal auth error, not an unhandled exception.
    const secondContext = await contextFrom(cookieHeader);
    await expect(
      createCaller(secondContext).auth.logout()
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    void tabB;
  });

  it("does not throw when the same jti is revoked twice (idempotent double logout)", async () => {
    const cookieHeader = await loginAdmin();
    const ctx = await contextFrom(cookieHeader);

    await createCaller(ctx).auth.logout();
    // Re-run against the *same* already-authenticated context object
    // (simulates two near-simultaneous clicks racing before the cookie is
    // cleared client-side) — must not throw.
    await expect(createCaller(ctx).auth.logout()).resolves.toEqual({
      success: true,
    });
  });
});
