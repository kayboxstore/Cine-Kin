import * as jose from "jose";
import { randomUUID } from "node:crypto";
import { env } from "../lib/env";
import type { SessionPayload } from "./types";

const JWT_ALG = "HS256";
const ISSUER = "cine-kin";
const AUDIENCE = "cine-kin:kimi-admin";

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
): Promise<SessionPayload | null> {
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
    return { unionId, clientId } as SessionPayload;
  } catch {
    return null;
  }
}
