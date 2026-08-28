import * as jose from "jose";
import { randomUUID } from "node:crypto";
import { env } from "../lib/env";
import type { SessionPayload } from "./types";

const JWT_ALG = "HS256";
const ISSUER = "cine-kin";
const AUDIENCE = "cine-kin:kimi-admin";

// Same UUID v4 shape as server/lib/app-sessions.ts — every `jti` this module
// mints comes from randomUUID(). Strict validation at verify time rejects a
// malformed/truncated `jti` before it ever reaches a SQL query.
const JTI_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type TokenIdentity = { jti: string; expiresAt: Date };

function extractTokenIdentity(payload: jose.JWTPayload): TokenIdentity | null {
  const { jti, exp } = payload;
  if (typeof jti !== "string" || !JTI_PATTERN.test(jti)) return null;
  if (typeof exp !== "number" || !Number.isFinite(exp)) return null;
  return { jti, expiresAt: new Date(exp * 1000) };
}

export async function signSessionToken(
  payload: SessionPayload
): Promise<string> {
  const secret = new TextEncoder().encode(env.sessionSecret);
  return new jose.SignJWT(payload)
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setJti(randomUUID())
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret);
}

export async function verifySessionToken(
  token: string
): Promise<(SessionPayload & TokenIdentity) | null> {
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(env.sessionSecret);
    const { payload } = await jose.jwtVerify(token, secret, {
      algorithms: [JWT_ALG],
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    const { unionId, clientId } = payload;
    if (
      typeof unionId !== "string" ||
      typeof clientId !== "string" ||
      unionId.length === 0 ||
      clientId.length === 0 ||
      clientId !== env.appId
    ) {
      return null;
    }
    const identity = extractTokenIdentity(payload);
    if (!identity) return null;
    return { unionId, clientId, ...identity };
  } catch {
    return null;
  }
}
