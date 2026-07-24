import * as jose from "jose";
import { env } from "./env";

// Separate, self-contained session tokens for the application-licence auth
// systems (device client + reseller). Signed with the same HS256 secret as the
// admin session but carry a `kind` discriminator and live in different cookies,
// so a token minted for one system can never satisfy another.

const JWT_ALG = "HS256";
const EXPIRATION = "30d";

function secret(): Uint8Array {
  return new TextEncoder().encode(env.appSecret);
}

export type ClientSessionPayload = { kind: "client"; appClientId: number };
export type ResellerSessionPayload = { kind: "reseller"; resellerId: number };

export async function signClientSession(appClientId: number): Promise<string> {
  return new jose.SignJWT({ kind: "client", appClientId })
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setExpirationTime(EXPIRATION)
    .sign(secret());
}

export async function verifyClientSession(
  token: string | undefined,
): Promise<ClientSessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jose.jwtVerify(token, secret(), { algorithms: [JWT_ALG] });
    if (payload.kind !== "client" || typeof payload.appClientId !== "number") return null;
    return { kind: "client", appClientId: payload.appClientId };
  } catch {
    return null;
  }
}

export async function signResellerSession(resellerId: number): Promise<string> {
  return new jose.SignJWT({ kind: "reseller", resellerId })
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setExpirationTime(EXPIRATION)
    .sign(secret());
}

export async function verifyResellerSession(
  token: string | undefined,
): Promise<ResellerSessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jose.jwtVerify(token, secret(), { algorithms: [JWT_ALG] });
    if (payload.kind !== "reseller" || typeof payload.resellerId !== "number") return null;
    return { kind: "reseller", resellerId: payload.resellerId };
  } catch {
    return null;
  }
}
