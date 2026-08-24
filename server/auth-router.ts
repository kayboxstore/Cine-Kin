import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { Session, AdminSession } from "@contracts/constants";
import { appendSessionCookie, clearSessionCookie } from "./lib/cookies";
import {
  sessionVersionForCredential,
  signAdminSession,
} from "./lib/app-sessions";
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
    // Clear both the Kimi OAuth session and the password-based admin session.
    clearSessionCookie(ctx.resHeaders, ctx.req.headers, Session.cookieName);
    clearSessionCookie(
      ctx.resHeaders,
      ctx.req.headers,
      AdminSession.cookieName
    );
    return { success: true };
  }),
});
