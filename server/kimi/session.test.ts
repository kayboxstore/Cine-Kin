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
});
