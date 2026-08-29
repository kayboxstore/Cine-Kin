import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import * as cookie from "cookie";
import { and, eq, isNotNull } from "drizzle-orm";
import type { User, AppClient, Reseller } from "@db/schema";
import { appClients, resellers } from "@db/schema";
import {
  ClientSession,
  ResellerSession,
  AdminSession,
} from "@contracts/constants";
import { authenticateRequest } from "./kimi/auth";
import {
  verifyClientSession,
  verifyResellerSession,
  verifyAdminSession,
  sessionVersionForCredential,
  resellerSessionCredential,
  sessionVersionMatches,
} from "./lib/app-sessions";
import { env } from "./lib/env";
import { getDb } from "./queries/connection";
import { isSessionRevoked } from "./lib/session-revocation";
import type { TokenIdentity } from "./lib/app-sessions";

// Synthetic admin identity for the password-based admin session (no Kimi user
// row). It satisfies the User shape and carries role "admin" so adminQuery and
// auth.me treat it exactly like an OAuth admin.
const PASSWORD_ADMIN_USER: User = {
  id: 0,
  unionId: "password-admin",
  name: "Administrateur",
  email: null,
  avatar: null,
  role: "admin",
  createdAt: new Date(0),
  updatedAt: new Date(0),
  lastSignInAt: new Date(0),
};

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  user?: User;
  appClient?: AppClient;
  reseller?: Reseller;
  // Identity (`jti`/`exp`) of whichever session cookie was actually present
  // and validly signed on this request, independent of whether the deeper
  // checks above (sessionVersion, revocation) ended up granting an
  // identity. Populated so logout endpoints can revoke the exact token that
  // was presented without re-parsing/re-verifying cookies themselves.
  kimiSession?: TokenIdentity;
  adminSession?: TokenIdentity;
  clientSession?: TokenIdentity;
  resellerSession?: TokenIdentity;
};

async function loadAppClient(
  appClientId: number,
  sessionVersion: string,
  jti: string
): Promise<AppClient | undefined> {
  // Fail-closed: a thrown error here (crypto or DB) propagates to the
  // caller's try/catch in createContext, which leaves ctx.appClient unset —
  // never falls through to "not revoked, so allow".
  if (await isSessionRevoked(jti)) return undefined;
  const rows = await getDb()
    .select()
    .from(appClients)
    .where(and(eq(appClients.id, appClientId), isNotNull(appClients.claimedAt)))
    .limit(1);
  const client = rows.at(0);
  if (
    !client ||
    !sessionVersionMatches(
      sessionVersion,
      sessionVersionForCredential(client.pinHash ?? "")
    )
  ) {
    return undefined;
  }
  return client;
}

async function loadReseller(
  resellerId: number,
  sessionVersion: string,
  jti: string
): Promise<Reseller | undefined> {
  if (await isSessionRevoked(jti)) return undefined;
  const rows = await getDb()
    .select()
    .from(resellers)
    .where(eq(resellers.id, resellerId))
    .limit(1);
  const reseller = rows.at(0);
  if (
    !reseller ||
    !reseller.isActive ||
    !sessionVersionMatches(
      sessionVersion,
      sessionVersionForCredential(
        resellerSessionCredential(reseller.passwordHash, reseller.sessionEpoch)
      )
    )
  ) {
    return undefined;
  }
  return reseller;
}

export async function createContext(
  opts: FetchCreateContextFnOptions
): Promise<TrpcContext> {
  const ctx: TrpcContext = { req: opts.req, resHeaders: opts.resHeaders };

  // Admin (Kimi) session — optional.
  try {
    const result = await authenticateRequest(opts.req.headers);
    ctx.user = result.user;
    ctx.kimiSession = { jti: result.jti, expiresAt: result.expiresAt };
  } catch {
    // Authentication is optional here
  }

  // Application-licence sessions — parsed only when their cookie is present.
  const cookies = cookie.parse(opts.req.headers.get("cookie") || "");

  // Password-based admin session. Verified whenever the cookie is present,
  // independent of whether a Kimi identity already took ctx.user above —
  // both sessions can be simultaneously valid (e.g. an operator who also
  // logged in with the password form), and logout must be able to revoke
  // whichever of them was actually presented. Only the *grant* of ctx.user
  // is conditional: a Kimi identity, once set, always stays the priority
  // identity and is never overwritten by the password-admin session.
  const adminToken = cookies[AdminSession.cookieName];
  if (adminToken) {
    try {
      const claim = await verifyAdminSession(adminToken);
      if (claim) {
        // Recorded as soon as the signature/shape verify, independent of
        // ctx.user and of the deeper checks below — logout must be able to
        // revoke the exact token presented even if it already failed one
        // of them.
        ctx.adminSession = { jti: claim.jti, expiresAt: claim.expiresAt };
      }
      if (
        claim &&
        !ctx.user &&
        env.adminPassword &&
        sessionVersionMatches(
          claim.sessionVersion,
          sessionVersionForCredential(env.adminPassword)
        ) &&
        // Fail-closed: a thrown error (crypto or DB) is caught below and
        // simply leaves ctx.user unset — never falls through to "not
        // revoked, so allow".
        !(await isSessionRevoked(claim.jti))
      ) {
        ctx.user = PASSWORD_ADMIN_USER;
      }
    } catch {
      // Optional
    }
  }

  const clientToken = cookies[ClientSession.cookieName];
  if (clientToken) {
    try {
      const claim = await verifyClientSession(clientToken);
      if (claim) {
        ctx.clientSession = { jti: claim.jti, expiresAt: claim.expiresAt };
        ctx.appClient = await loadAppClient(
          claim.appClientId,
          claim.sessionVersion,
          claim.jti
        );
      }
    } catch {
      // Optional
    }
  }

  const resellerToken = cookies[ResellerSession.cookieName];
  if (resellerToken) {
    try {
      const claim = await verifyResellerSession(resellerToken);
      if (claim) {
        ctx.resellerSession = { jti: claim.jti, expiresAt: claim.expiresAt };
        ctx.reseller = await loadReseller(
          claim.resellerId,
          claim.sessionVersion,
          claim.jti
        );
      }
    } catch {
      // Optional
    }
  }

  return ctx;
}
