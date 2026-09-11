import { eq, lt, sql } from "drizzle-orm";
import { revokedAuthSessions } from "@db/schema";
import { getDb } from "../queries/connection";

export type SessionKind = "admin" | "client" | "reseller" | "kimi";

// Denylist-based revocation: sessions are NOT recorded at login, only a
// token whose owner explicitly logged out gets a row here, keyed by its own
// `jti` (no row = not revoked). This table only has anything to say about a
// token that actually carries a valid `jti`/`exp` in the first place — the
// four `verify*Session` functions (server/lib/app-sessions.ts,
// server/kimi/session.ts) reject any signed token missing either outright,
// before this table is even consulted. See db/schema.ts for the full
// rationale.

// Idempotent by construction: ON DUPLICATE KEY UPDATE (not INSERT IGNORE,
// which would also silently swallow unrelated errors we want to surface) —
// a second revocation of the same `jti` (double logout, a second tab) is a
// no-op, never an error.
export async function revokeSession(
  jti: string,
  sessionKind: SessionKind,
  expiresAt: Date
): Promise<void> {
  await getDb()
    .insert(revokedAuthSessions)
    .values({ jti, sessionKind, expiresAt })
    .onDuplicateKeyUpdate({
      set: { revokedAt: sql`${revokedAuthSessions.revokedAt}` },
    });
}

// Fail-closed by contract: callers MUST treat any thrown error here as
// "cannot prove this session is valid" and deny authentication — never
// "not revoked, so allow". This function itself does not catch anything; it
// is the caller's responsibility (see server/context.ts and
// server/kimi/auth.ts) to wrap this in the same try/catch that already
// governs the rest of session verification, exactly like every other check
// there.
export async function isSessionRevoked(jti: string): Promise<boolean> {
  const rows = await getDb()
    .select({ jti: revokedAuthSessions.jti })
    .from(revokedAuthSessions)
    .where(eq(revokedAuthSessions.jti, jti))
    .limit(1);
  return rows.length > 0;
}

// A row past its own `expires_at` is provably redundant: the JWT's own
// `exp` claim already rejects that token during signature verification,
// before a revocation lookup is even reached. Deleting it loses no
// protection. Bounded batch — never an unlimited DELETE — so an unexpected
// surge of revocations can't turn routine cleanup into a long-running,
// lock-heavy statement.
const PURGE_BATCH_SIZE = 100;

export async function purgeExpiredRevocations(): Promise<void> {
  await getDb()
    .delete(revokedAuthSessions)
    .where(lt(revokedAuthSessions.expiresAt, new Date()))
    .limit(PURGE_BATCH_SIZE);
}

// Deterministic, non-blocking: callers fire this only after a revocation they
// just recorded has actually succeeded (never on every request, and never as
// a substitute for a successful revocation) — see the logout resolvers in
// auth-router.ts, client-router.ts and reseller-router.ts. Deliberately not
// awaited by the caller and always swallows its own error: a purge failure
// must never undo the revocation that already committed, and must never turn
// a successful logout response into a failed one.
export function schedulePurgeAfterRevocation(): void {
  purgeExpiredRevocations().catch(() => {
    // Best-effort only. A failed purge is not a security or correctness
    // issue (the JWT's own exp already protects against replay), so it must
    // never surface as a logout failure.
  });
}
