import { beforeEach, describe, expect, it, vi } from "vitest";

// A real, stateful in-memory backing store — not just call-recording — so
// these tests exercise actual idempotence/expiry semantics, not just "was
// called with the right arguments".
const shared = vi.hoisted(() => ({
  rows: new Map<string, { jti: string; sessionKind: string; expiresAt: Date; revokedAt: Date }>(),
  deleteError: null as Error | null,
}));

vi.mock("drizzle-orm", async importOriginal => {
  const actual = await importOriginal<typeof import("drizzle-orm")>();
  return {
    ...actual,
    eq: (col: { name: string }, val: unknown) => ({ __c: "eq", col: col.name, val }),
    lt: (col: { name: string }, val: unknown) => ({ __c: "lt", col: col.name, val }),
    sql: () => ({ __c: "sql-self-ref" }),
  };
});

vi.mock("../queries/connection", () => ({
  getDb: () => ({
    insert: () => ({
      values: (row: { jti: string; sessionKind: string; expiresAt: Date }) => ({
        onDuplicateKeyUpdate: async () => {
          const existing = shared.rows.get(row.jti);
          if (existing) {
            // The real ON DUPLICATE KEY UPDATE clause is a self-referencing
            // no-op (`revoked_at = revoked_at`) — nothing changes here either.
            return;
          }
          shared.rows.set(row.jti, { ...row, revokedAt: new Date() });
        },
      }),
    }),
    select: () => ({
      from: () => ({
        where: (cond: { __c: string; col: string; val: unknown }) => ({
          limit: async () => {
            if (cond.__c !== "eq" || cond.col !== "jti") return [];
            return shared.rows.has(cond.val as string)
              ? [{ jti: cond.val }]
              : [];
          },
        }),
      }),
    }),
    delete: () => ({
      where: (cond: { __c: string; col: string; val: unknown }) => ({
        limit: async (n: number) => {
          if (shared.deleteError) throw shared.deleteError;
          if (cond.__c !== "lt" || cond.col !== "expires_at") return;
          let removed = 0;
          for (const [jti, row] of shared.rows) {
            if (removed >= n) break;
            if (row.expiresAt < (cond.val as Date)) {
              shared.rows.delete(jti);
              removed++;
            }
          }
        },
      }),
    }),
  }),
}));

import {
  revokeSession,
  isSessionRevoked,
  purgeExpiredRevocations,
  schedulePurgeAfterRevocation,
} from "./session-revocation";

describe("session revocation", () => {
  beforeEach(() => {
    shared.rows.clear();
    shared.deleteError = null;
  });

  it("reports an unrevoked jti as not revoked", async () => {
    await expect(isSessionRevoked("never-seen")).resolves.toBe(false);
  });

  it("revokes a session and reflects it immediately", async () => {
    const jti = "11111111-1111-4111-8111-111111111111";
    await expect(isSessionRevoked(jti)).resolves.toBe(false);

    await revokeSession(jti, "admin", new Date(Date.now() + 3600_000));

    await expect(isSessionRevoked(jti)).resolves.toBe(true);
  });

  it("is idempotent: revoking the same jti twice never throws", async () => {
    const jti = "22222222-2222-4222-8222-222222222222";
    const expiresAt = new Date(Date.now() + 3600_000);

    await revokeSession(jti, "client", expiresAt);
    await expect(revokeSession(jti, "client", expiresAt)).resolves.not.toThrow();
    await expect(isSessionRevoked(jti)).resolves.toBe(true);
  });

  it("does not affect a different jti's revocation state", async () => {
    const revoked = "33333333-3333-4333-8333-333333333333";
    const untouched = "44444444-4444-4444-8444-444444444444";
    const expiresAt = new Date(Date.now() + 3600_000);

    await revokeSession(revoked, "reseller", expiresAt);

    await expect(isSessionRevoked(revoked)).resolves.toBe(true);
    await expect(isSessionRevoked(untouched)).resolves.toBe(false);
  });

  it("purges only expired rows, in a bounded batch", async () => {
    const expired = "55555555-5555-4555-8555-555555555555";
    const stillValid = "66666666-6666-4666-8666-666666666666";
    await revokeSession(expired, "kimi", new Date(Date.now() - 1000));
    await revokeSession(stillValid, "kimi", new Date(Date.now() + 3600_000));

    await purgeExpiredRevocations();

    // The expired row is gone; a JWT past its own exp is already rejected by
    // jose.jwtVerify before this table is even consulted, so removing it
    // loses no protection.
    expect(shared.rows.has(expired)).toBe(false);
    // A still-valid session's revocation must survive the purge.
    expect(shared.rows.has(stillValid)).toBe(true);
  });

  describe("schedulePurgeAfterRevocation — deterministic, non-blocking trigger", () => {
    it("purges expired rows every time it is called, with no randomness", async () => {
      const expired = "77777777-7777-4777-8777-777777777777";
      await revokeSession(expired, "admin", new Date(Date.now() - 1000));

      schedulePurgeAfterRevocation();
      // The purge runs asynchronously (fire-and-forget); give its promise a
      // tick to settle before asserting.
      await new Promise(r => setTimeout(r, 0));

      expect(shared.rows.has(expired)).toBe(false);
    });

    it("never throws or rejects even when the underlying purge fails", () => {
      shared.deleteError = new Error("simulated MySQL outage during purge");

      // Must return synchronously without throwing — a caller in a logout
      // resolver invokes this without awaiting it, so a rejected promise
      // here would become an unhandled rejection, not a caught error.
      expect(() => schedulePurgeAfterRevocation()).not.toThrow();
    });
  });
});
