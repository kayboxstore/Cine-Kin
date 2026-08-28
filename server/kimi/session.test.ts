import { describe, expect, it, vi } from "vitest";
import * as jose from "jose";

vi.hoisted(() => {
  process.env.NODE_ENV = "test";
  process.env.APP_ID = "cinekin-test-app";
  process.env.SESSION_SECRET = "session-test-secret-0123456789-abcdefghij";
});

import { signSessionToken, verifySessionToken } from "./session";

describe("Kimi administrator sessions", () => {
  it("round-trips a signed session with strict application claims", async () => {
    const token = await signSessionToken({
      unionId: "user-42",
      clientId: "cinekin-test-app",
    });
    await expect(verifySessionToken(token)).resolves.toEqual({
      unionId: "user-42",
      clientId: "cinekin-test-app",
      jti: expect.stringMatching(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      ),
      expiresAt: expect.any(Date),
    });
  });

  it("rejects a signed session minted for another OAuth application", async () => {
    const secret = new TextEncoder().encode(process.env.SESSION_SECRET);
    const token = await new jose.SignJWT({
      unionId: "user-42",
      clientId: "different-app",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuer("cine-kin")
      .setAudience("cine-kin:kimi-admin")
      .setIssuedAt()
      .setExpirationTime("8h")
      .sign(secret);

    await expect(verifySessionToken(token)).resolves.toBeNull();
  });

  // Same security model as server/lib/app-sessions.ts: revocation is keyed
  // purely by `jti`, so a token without one can never be individually
  // revoked and must therefore never be accepted — no fallback to "valid
  // until its own exp" for a token this codebase can't key into the
  // revocation table.
  it("rejects a validly signed token with no jti", async () => {
    const secret = new TextEncoder().encode(process.env.SESSION_SECRET);
    const token = await new jose.SignJWT({
      unionId: "user-42",
      clientId: "cinekin-test-app",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuer("cine-kin")
      .setAudience("cine-kin:kimi-admin")
      .setIssuedAt()
      .setExpirationTime("8h")
      .sign(secret);

    await expect(verifySessionToken(token)).resolves.toBeNull();
  });

  it("rejects a validly signed token with no exp", async () => {
    const secret = new TextEncoder().encode(process.env.SESSION_SECRET);
    const token = await new jose.SignJWT({
      unionId: "user-42",
      clientId: "cinekin-test-app",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuer("cine-kin")
      .setAudience("cine-kin:kimi-admin")
      .setJti("33333333-3333-4333-8333-333333333333")
      .setIssuedAt()
      .sign(secret);

    await expect(verifySessionToken(token)).resolves.toBeNull();
  });

  it("rejects an expired token", async () => {
    const secret = new TextEncoder().encode(process.env.SESSION_SECRET);
    const token = await new jose.SignJWT({
      unionId: "user-42",
      clientId: "cinekin-test-app",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuer("cine-kin")
      .setAudience("cine-kin:kimi-admin")
      .setJti("44444444-4444-4444-8444-444444444444")
      .setIssuedAt()
      .setExpirationTime("-1s")
      .sign(secret);

    await expect(verifySessionToken(token)).resolves.toBeNull();
  });
});
