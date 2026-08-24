import { describe, expect, it, vi } from "vitest";

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

describe("application sessions", () => {
  it("binds a client token to the current credential version", async () => {
    const version = sessionVersionForCredential("stored-pin-hash-v1");
    const token = await signClientSession(42, version);

    await expect(verifyClientSession(token)).resolves.toEqual({
      kind: "client",
      appClientId: 42,
      sessionVersion: version,
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
});
