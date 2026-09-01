import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { Session, AdminSession } from "@contracts/constants";
import { appendSessionCookie, clearSessionCookie } from "./lib/cookies";
import { sessionVersionForCredential, signAdminSession } from "./lib/app-sessions";
import {
  revokeSession,
  schedulePurgeAfterRevocation,
} from "./lib/session-revocation";
import { env } from "./lib/env";
import { createRouter, publicQuery, authedQuery } from "./middleware";

// Constant-time comparison over fixed-length SHA-256 digests (avoids leaking
// the password length).
function passwordMatches(provided: string, expected: string): boolean {
  if (!expected) return false;
  const a = createHash("sha256").update(provided).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export const authRouter = createRouter({
  me: authedQuery.query(opts => opts.ctx.user),

  // Password-based admin login (alternative to Kimi OAuth). Sets the dedicated
  // admin session cookie; the context then resolves a synthetic admin user.
  adminLogin: publicQuery
    .input(z.object({ password: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      if (!passwordMatches(input.password, env.adminPassword)) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Mot de passe incorrect.",
        });
      }
      const token = await signAdminSession(
        sessionVersionForCredential(env.adminPassword)
      );
      appendSessionCookie(
        ctx.resHeaders,
        ctx.req.headers,
        AdminSession.cookieName,
        token,
        AdminSession.maxAgeMs
      );
      return { success: true };
    }),

  logout: authedQuery.mutation(async ({ ctx }) => {
    // createContext() already decoded whichever of the Kimi/admin cookies
    // were present and validly signed on this request — only those (never
    // both unconditionally) get revoked and cleared. A second tab or a
    // repeated click may already have neither.

    // Revocation MUST succeed before any cookie is cleared and before a
    // success response is returned — a copied cookie must never remain
    // usable just because clearing failed silently or the DB write did not
    // actually happen. If revokeSession() throws (e.g. MySQL unreachable),
    // it propagates out of this resolver: no cookie is cleared, no success
    // response is sent.
    let revoked = false;
    if (ctx.kimiSession) {
      await revokeSession(ctx.kimiSession.jti, "kimi", ctx.kimiSession.expiresAt);
      revoked = true;
    }
    if (ctx.adminSession) {
      await revokeSession(ctx.adminSession.jti, "admin", ctx.adminSession.expiresAt);
      revoked = true;
    }

    // Only after every revocation above has been confirmed do we clear the
    // cookies that were actually present.
    if (ctx.kimiSession) {
      clearSessionCookie(ctx.resHeaders, ctx.req.headers, Session.cookieName);
    }
    if (ctx.adminSession) {
      clearSessionCookie(
        ctx.resHeaders,
        ctx.req.headers,
        AdminSession.cookieName
      );
    }

    // Deterministic (not random), bounded, and only after a revocation this
    // request actually recorded — never on a no-op logout. Best-effort: a
    // purge failure can never undo the revocation above or fail this response.
    if (revoked) {
      schedulePurgeAfterRevocation();
    }

    return { success: true };
  }),
});
