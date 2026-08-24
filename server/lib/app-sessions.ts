import * as jose from "jose";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { env } from "./env";

// Separate, self-contained session tokens for the application-licence auth
// systems (device client + reseller). They carry a `kind` discriminator, strict
// issuer/audience claims, a unique token id, and a credential version. Changing
// the underlying PIN/password invalidates every token minted from the old hash.

const JWT_ALG = "HS256";
const ISSUER = "cine-kin";
const CLIENT_AUDIENCE = "cine-kin:client";
const RESELLER_AUDIENCE = "cine-kin:reseller";
const ADMIN_AUDIENCE = "cine-kin:admin";
const CLIENT_EXPIRATION = "7d";
const RESELLER_EXPIRATION = "12h";
const ADMIN_EXPIRATION = "8h";

function secret(): Uint8Array {
  return new TextEncoder().encode(env.sessionSecret);
}

export function sessionVersionForCredential(credential: string): string {
  return createHmac("sha256", secret()).update(credential).digest("base64url");
}

export function sessionVersionMatches(
  actual: string,
  expected: string
): boolean {
  const actualBytes = Buffer.from(actual);
  const expectedBytes = Buffer.from(expected);
  return (
    actualBytes.length === expectedBytes.length &&
    timingSafeEqual(actualBytes, expectedBytes)
  );
}

export type ClientSessionPayload = {
  kind: "client";
  appClientId: number;
  sessionVersion: string;
};
export type ResellerSessionPayload = {
  kind: "reseller";
  resellerId: number;
  sessionVersion: string;
};

export async function signClientSession(
  appClientId: number,
  sessionVersion: string
): Promise<string> {
  return new jose.SignJWT({ kind: "client", appClientId, sessionVersion })
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuer(ISSUER)
    .setAudience(CLIENT_AUDIENCE)
    .setJti(randomUUID())
    .setIssuedAt()
    .setExpirationTime(CLIENT_EXPIRATION)
    .sign(secret());
}

export async function verifyClientSession(
  token: string | undefined
): Promise<ClientSessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jose.jwtVerify(token, secret(), {
      algorithms: [JWT_ALG],
      issuer: ISSUER,
      audience: CLIENT_AUDIENCE,
    });
    if (
      payload.kind !== "client" ||
      typeof payload.appClientId !== "number" ||
      typeof payload.sessionVersion !== "string"
    )
      return null;
    return {
      kind: "client",
      appClientId: payload.appClientId,
      sessionVersion: payload.sessionVersion,
    };
  } catch {
    return null;
  }
}

export async function signResellerSession(
  resellerId: number,
  sessionVersion: string
): Promise<string> {
  return new jose.SignJWT({ kind: "reseller", resellerId, sessionVersion })
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuer(ISSUER)
    .setAudience(RESELLER_AUDIENCE)
    .setJti(randomUUID())
    .setIssuedAt()
    .setExpirationTime(RESELLER_EXPIRATION)
    .sign(secret());
}

export async function verifyResellerSession(
  token: string | undefined
): Promise<ResellerSessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jose.jwtVerify(token, secret(), {
      algorithms: [JWT_ALG],
      issuer: ISSUER,
      audience: RESELLER_AUDIENCE,
    });
    if (
      payload.kind !== "reseller" ||
      typeof payload.resellerId !== "number" ||
      typeof payload.sessionVersion !== "string"
    )
      return null;
    return {
      kind: "reseller",
      resellerId: payload.resellerId,
      sessionVersion: payload.sessionVersion,
    };
  } catch {
    return null;
  }
}

export type AdminSessionPayload = { kind: "admin"; sessionVersion: string };

export async function signAdminSession(
  sessionVersion: string
): Promise<string> {
  return new jose.SignJWT({ kind: "admin", sessionVersion })
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuer(ISSUER)
    .setAudience(ADMIN_AUDIENCE)
    .setJti(randomUUID())
    .setIssuedAt()
    .setExpirationTime(ADMIN_EXPIRATION)
    .sign(secret());
}

export async function verifyAdminSession(
  token: string | undefined
): Promise<AdminSessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jose.jwtVerify(token, secret(), {
      algorithms: [JWT_ALG],
      issuer: ISSUER,
      audience: ADMIN_AUDIENCE,
    });
    if (payload.kind !== "admin" || typeof payload.sessionVersion !== "string")
      return null;
    return { kind: "admin", sessionVersion: payload.sessionVersion };
  } catch {
    return null;
  }
}
