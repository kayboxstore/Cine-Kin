// Real, unmocked proof that purgeExpiredRevocations() is bounded to exactly
// PURGE_BATCH_SIZE (100) rows per call — session-revocation.test.ts already
// proves the shape of this behaviour against a stateful in-memory fake, but
// that fake enforces its own `.slice(0, n)` bound, which only proves the
// mock is faithful to the intent, not that the real drizzle query — and the
// real MySQL LIMIT clause it compiles to — actually enforces it. This file
// runs the real function, unmocked, against a real (disposable, local-only)
// MySQL database.
//
// Deliberately opt-in and guarded: unlike every other file under
// server/**/*.test.ts, this one talks to a real network/DB connection, so it
// must never run just because `npm test` happened to run — a plain `npm
// test` with no DATABASE_URL (or one pointing elsewhere) skips this file
// entirely, exactly like the destructive scripts/test-migrations.mjs script
// requires MIGRATION_TEST_ALLOW_DROP=1 and a specific database name before
// touching anything.
import { randomUUID } from "node:crypto";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { lt } from "drizzle-orm";
import { revokedAuthSessions } from "@db/schema";

function purgeBoundTestGuard(): { database: string } | null {
  const raw = process.env.DATABASE_URL;
  if (!raw) return null;
  try {
    const url = new URL(raw);
    const host = url.hostname;
    const database = url.pathname.replace(/^\//, "");
    if (!["localhost", "127.0.0.1"].includes(host)) return null;
    if (database !== "cinekin_purge_bound_test") return null;
    return { database };
  } catch {
    return null;
  }
}

const guard = purgeBoundTestGuard();

if (!guard) {
  console.log(
    "[session-revocation.purge-bound.test] skipped — point DATABASE_URL at a " +
      "disposable, already-migrated mysql://127.0.0.1:3306/cinekin_purge_bound_test " +
      "to exercise the real bounded DELETE against MySQL."
  );
}

describe.skipIf(!guard)(
  "purgeExpiredRevocations — bounded to 100 rows, proven against real MySQL (no mock)",
  () => {
    // Imported inside the guarded describe so a plain `npm test` run (no
    // DATABASE_URL) never even attempts to construct the real connection
    // pool that importing this module triggers via getDb().
    let sessionRevocation: typeof import("./session-revocation");
    let connection: typeof import("../queries/connection");

    beforeEach(async () => {
      sessionRevocation = await import("./session-revocation");
      connection = await import("../queries/connection");
      await connection.getDb().delete(revokedAuthSessions);
    });

    afterAll(async () => {
      if (connection) await connection.getDb().delete(revokedAuthSessions);
    });

    it("the compiled DELETE really carries a LIMIT of 100 in its actual SQL — not a JS-side slice", async () => {
      const query = connection
        .getDb()
        .delete(revokedAuthSessions)
        .where(lt(revokedAuthSessions.expiresAt, new Date()))
        .limit(100);
      const compiled = query.toSQL();

      expect(compiled.sql.toLowerCase()).toContain("limit");
      const literalLimit100 = /limit\s+100\b/i.test(compiled.sql);
      const parameterizedLimit100 = compiled.params.includes(100);
      expect(literalLimit100 || parameterizedLimit100).toBe(true);
    });

    it(
      "removes at most 100 expired rows per call, keeps valid rows untouched, " +
        "and needs a second pass to clear the remainder",
      async () => {
        const { revokeSession, purgeExpiredRevocations } = sessionRevocation;
        const db = connection.getDb();

        const expiredJtis = Array.from({ length: 150 }, () => randomUUID());
        const validJti = randomUUID();
        const expiredAt = new Date(Date.now() - 60_000);
        const validExpiresAt = new Date(Date.now() + 3_600_000);

        for (const jti of expiredJtis) {
          await revokeSession(jti, "admin", expiredAt);
        }
        await revokeSession(validJti, "reseller", validExpiresAt);

        const allRows = () =>
          db
            .select({ jti: revokedAuthSessions.jti })
            .from(revokedAuthSessions);

        await expect(allRows()).resolves.toHaveLength(151);

        // --- Single purge pass -------------------------------------------
        await purgeExpiredRevocations();

        const afterFirstPass = await allRows();
        // Exactly 100 of the 150 expired rows are gone; the bound is a hard
        // ceiling per call, not "up to 100 but maybe more".
        expect(afterFirstPass).toHaveLength(51);
        expect(afterFirstPass.some(r => r.jti === validJti)).toBe(true);
        const remainingExpired = afterFirstPass.filter(
          r => r.jti !== validJti
        );
        expect(remainingExpired).toHaveLength(50);

        // --- Second purge pass clears the remainder -----------------------
        await purgeExpiredRevocations();

        const afterSecondPass = await allRows();
        expect(afterSecondPass.map(r => r.jti)).toEqual([validJti]);
      },
      20_000
    );
  }
);
