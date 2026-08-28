import { describe, expect, it, vi } from "vitest";
import * as jose from "jose";

vi.hoisted(() => {
  process.env.NODE_ENV = "test";
  process.env.SESSION_SECRET = "session-secret-test-only-0123456789-abcdefghij";
});

import {
  sessionVersionForCredential,
  sessionVersionMatches,
  signAdminSession,
  signClientSession,
  signResellerSession,
  verifyAdminSession,
  verifyClientSession,
  verifyResellerSession,
} from "./app-sessions";

const secretBytes = () =>
  new TextEncoder().encode(process.env.SESSION_SECRET);

// Simulates a token minted before the jti/revocation feature existed: same
// issuer, audience, algorithm and application claims a legitimate signer
// would use, but missing what only the current signing code adds.
function craftLegacyToken(
  audience: string,
  claims: Record<string, unknown>,
  { omitJti = false, omitExp = false, jti = "11111111-1111-4111-8111-111111111111" } = {}
) {
  let builder = new jose.SignJWT(claims)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer("cine-kin")
    .setAudience(audience)
    .setIssuedAt();
  if (!omitJti) builder = builder.setJti(jti);
  if (!omitExp) builder = builder.setExpirationTime("1h");
  return builder.sign(secretBytes());
}

const ANY_JTI = expect.stringMatching(
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
);
const ANY_EXPIRY = expect.any(Date);

describe("application sessions", () => {
  it("binds a client token to the current credential version", async () => {
    const version = sessionVersionForCredential("stored-pin-hash-v1");
    const token = await signClientSession(42, version);

    await expect(verifyClientSession(token)).resolves.toEqual({
      kind: "client",
      appClientId: 42,
      sessionVersion: version,
      jti: ANY_JTI,
      expiresAt: ANY_EXPIRY,
    });
    expect(
      sessionVersionMatches(
        version,
        sessionVersionForCredential("stored-pin-hash-v2")
      )
    ).toBe(false);
  });

  it("keeps client, reseller and admin audiences isolated", async () => {
    const version = sessionVersionForCredential("credential-hash");
    const clientToken = await signClientSession(1, version);
    const resellerToken = await signResellerSession(2, version);
    const adminToken = await signAdminSession(version);

    await expect(verifyResellerSession(clientToken)).resolves.toBeNull();
    await expect(verifyAdminSession(resellerToken)).resolves.toBeNull();
    await expect(verifyClientSession(adminToken)).resolves.toBeNull();

    await expect(verifyResellerSession(resellerToken)).resolves.toMatchObject({
      kind: "reseller",
      resellerId: 2,
      sessionVersion: version,
    });
    await expect(verifyAdminSession(adminToken)).resolves.toEqual({
      kind: "admin",
      sessionVersion: version,
      jti: ANY_JTI,
      expiresAt: ANY_EXPIRY,
    });
  });

  it("rejects altered and empty tokens", async () => {
    const version = sessionVersionForCredential("credential-hash");
    const token = await signClientSession(1, version);
    const parts = token.split(".");
    const tamperedSignature = `${parts[2]![0] === "a" ? "b" : "a"}${parts[2]!.slice(1)}`;
    const tampered = `${parts[0]}.${parts[1]}.${tamperedSignature}`;

    await expect(verifyClientSession(undefined)).resolves.toBeNull();
    await expect(verifyClientSession(tampered)).resolves.toBeNull();
  });

  // Security model: revocation is keyed purely by `jti`, so a token this
  // codebase cannot key into that table must never be treated as valid —
  // there is no fallback path that lets an old, jti-less token slide through
  // until its own `exp`. Any deployment that ever minted tokens without a
  // `jti` (there was no such release) or with a missing `exp` is fully
  // invalidated by these checks, forcing a one-time reconnection.
  describe("legacy tokens without a jti or exp are always rejected outright, never tolerated until expiry", () => {
    it("client: rejects a validly signed token with no jti", async () => {
      const version = sessionVersionForCredential("credential-hash");
      const token = await craftLegacyToken(
        "cine-kin:client",
        { kind: "client", appClientId: 1, sessionVersion: version },
        { omitJti: true }
      );
      await expect(verifyClientSession(token)).resolves.toBeNull();
    });

    it("client: rejects a validly signed token with no exp", async () => {
      const version = sessionVersionForCredential("credential-hash");
      const token = await craftLegacyToken(
        "cine-kin:client",
        { kind: "client", appClientId: 1, sessionVersion: version },
        { omitExp: true }
      );
      await expect(verifyClientSession(token)).resolves.toBeNull();
    });

    it("client: rejects an expired token", async () => {
      const version = sessionVersionForCredential("credential-hash");
      const token = await new jose.SignJWT({
        kind: "client",
        appClientId: 1,
        sessionVersion: version,
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuer("cine-kin")
        .setAudience("cine-kin:client")
        .setJti("22222222-2222-4222-8222-222222222222")
        .setIssuedAt()
        .setExpirationTime("-1s")
        .sign(secretBytes());
      await expect(verifyClientSession(token)).resolves.toBeNull();
    });

    it("client: rejects a well-formed but non-v4 UUID as jti (e.g. v1: version nibble 1, not 4)", async () => {
      const version = sessionVersionForCredential("credential-hash");
      const token = await craftLegacyToken(
        "cine-kin:client",
        { kind: "client", appClientId: 1, sessionVersion: version },
        // Structurally a valid UUID (8-4-4-4-12 hex, valid RFC 4122 variant
        // nibble `8`) but version nibble is `1`, not `4` — must not pass a
        // regex that only checks hex-digit positions.
        { jti: "11111111-1111-1111-8111-111111111111" }
      );
      await expect(verifyClientSession(token)).resolves.toBeNull();
    });

    it("reseller: rejects a validly signed token with no jti", async () => {
      const version = sessionVersionForCredential("credential-hash");
      const token = await craftLegacyToken(
        "cine-kin:reseller",
        { kind: "reseller", resellerId: 1, sessionVersion: version },
        { omitJti: true }
      );
      await expect(verifyResellerSession(token)).resolves.toBeNull();
    });

    it("reseller: rejects a validly signed token with no exp", async () => {
      const version = sessionVersionForCredential("credential-hash");
      const token = await craftLegacyToken(
        "cine-kin:reseller",
        { kind: "reseller", resellerId: 1, sessionVersion: version },
        { omitExp: true }
      );
      await expect(verifyResellerSession(token)).resolves.toBeNull();
    });

    it("admin: rejects a validly signed token with no jti", async () => {
      const version = sessionVersionForCredential("credential-hash");
      const token = await craftLegacyToken(
        "cine-kin:admin",
        { kind: "admin", sessionVersion: version },
        { omitJti: true }
      );
      await expect(verifyAdminSession(token)).resolves.toBeNull();
    });

    it("admin: rejects a validly signed token with no exp", async () => {
      const version = sessionVersionForCredential("credential-hash");
      const token = await craftLegacyToken(
        "cine-kin:admin",
        { kind: "admin", sessionVersion: version },
        { omitExp: true }
      );
      await expect(verifyAdminSession(token)).resolves.toBeNull();
    });
  });
});
