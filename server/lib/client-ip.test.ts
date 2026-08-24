import { describe, expect, it } from "vitest";
import { getTrustedClientIp } from "./client-ip";

describe("trusted client IP extraction", () => {
  it("ignores spoofable forwarded headers when proxy trust is disabled", () => {
    expect(
      getTrustedClientIp({
        forwardedFor: "203.0.113.10",
        remoteAddress: "192.0.2.5",
        trustProxy: false,
        trustedHops: 1,
      })
    ).toBe("192.0.2.5");
  });

  it("selects from the right of a trusted proxy chain", () => {
    expect(
      getTrustedClientIp({
        forwardedFor: "198.51.100.99, 203.0.113.7",
        remoteAddress: "192.0.2.5",
        trustProxy: true,
        trustedHops: 1,
      })
    ).toBe("203.0.113.7");
    expect(
      getTrustedClientIp({
        forwardedFor: "198.51.100.99, 203.0.113.7",
        remoteAddress: "192.0.2.5",
        trustProxy: true,
        trustedHops: 2,
      })
    ).toBe("198.51.100.99");
  });

  it("rejects malformed addresses instead of using them as limiter keys", () => {
    expect(
      getTrustedClientIp({
        forwardedFor: "attacker-controlled",
        remoteAddress: "also-invalid",
        trustProxy: true,
        trustedHops: 1,
      })
    ).toBe("unknown");
  });
});
