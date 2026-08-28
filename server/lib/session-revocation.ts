import { eq, lt, sql } from "drizzle-orm";
import { revokedAuthSessions } from "@db/schema";
import { getDb } from "../queries/connection";

export type SessionKind = "admin" | "client" | "reseller" | "kimi";

// Denylist-based revocation: sessions are NOT recorded at login, only a
// token whose owner explicitly logged out gets a row here, keyed by its own
// `jti`. Every token already in circulation before this table existed keeps
// working unchanged (no row = not revoked). See db/schema.ts for the full
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

// Opportunistic, non-blocking: called from logout handlers with low
// probability so cleanup happens over time without adding a scheduler
// dependency or making any single logout request depend on it. Never allowed
// to fail the logout it's piggybacked on.
const PURGE_PROBABILITY = 0.02;

export function maybePurgeExpiredRevocations(): void {
  if (Math.random() >= PURGE_PROBABILITY) return;
  purgeExpiredRevocations().catch(() => {
    // Best-effort only. A failed purge is not a security or correctness
    // issue (the JWT's own exp already protects against replay), so it must
    // never surface as a logout failure.
  });
}
