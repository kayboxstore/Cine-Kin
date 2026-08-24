import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import * as jose from "jose";
import { env } from "../lib/env";

const JWT_ALG = "HS256";
const ISSUER = "cine-kin";
const AUDIENCE = "cine-kin:oauth-transaction";

export type OAuthTransactionPayload = {
  state: string;
  redirectUri: string;
  codeVerifier?: string;
};

function secret(): Uint8Array {
  return new TextEncoder().encode(env.sessionSecret);
}

export function createPkcePair(): {
  verifier: string;
  challenge: string;
} {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256")
    .update(verifier, "ascii")
    .digest("base64url");
  return { verifier, challenge };
}

export function createOAuthState(): string {
  return randomBytes(32).toString("base64url");
}

export async function signOAuthTransaction(
  payload: OAuthTransactionPayload
): Promise<string> {
  return new jose.SignJWT(payload)
    .setProtectedHeader({ alg: JWT_ALG, typ: "oauth-transaction+jwt" })
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setJti(payload.state)
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(secret());
}

export async function verifyOAuthTransaction(
  token: string | undefined
): Promise<OAuthTransactionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jose.jwtVerify(token, secret(), {
      algorithms: [JWT_ALG],
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    if (
      typeof payload.state !== "string" ||
      typeof payload.redirectUri !== "string" ||
      (payload.codeVerifier !== undefined &&
        typeof payload.codeVerifier !== "string")
    ) {
      return null;
    }
    return {
      state: payload.state,
      redirectUri: payload.redirectUri,
      ...(payload.codeVerifier ? { codeVerifier: payload.codeVerifier } : {}),
    };
  } catch {
    return null;
  }
}

export function oauthStateMatches(expected: string, received: string): boolean {
  const expectedBytes = Buffer.from(expected);
  const receivedBytes = Buffer.from(received);
  return (
    expectedBytes.length === receivedBytes.length &&
    timingSafeEqual(expectedBytes, receivedBytes)
  );
}
