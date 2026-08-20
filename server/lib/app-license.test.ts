import { describe, expect, it } from "vitest";
import {
  autoEmail,
  claimCodeSchema,
  computeRenewalExpiry,
  generateClaimCode,
  macAddressSchema,
  macLookupVariants,
  normalizeMac,
} from "./app-license";

describe("MAC address canonicalisation", () => {
  it.each([
    "AA:BB:CC:DD:EE:FF",
    "aa-bb-cc-dd-ee-ff",
    "AABBCCDDEEFF",
  ])("normalises %s to one stored representation", (input) => {
    expect(normalizeMac(input)).toBe("aa:bb:cc:dd:ee:ff");
    expect(macAddressSchema.parse(input)).toBe("aa:bb:cc:dd:ee:ff");
  });

  it.each([
    "aa:bb:cc",
    "aa:bb:cc:dd:ee:gg",
    "aa-bb:cc-dd:ee-ff",
    "0:abb:cc:dd:ee:ff",
    "aa bb cc dd ee ff",
    "",
  ])("rejects malformed input %j", (input) => {
    expect(normalizeMac(input)).toBe("");
    expect(macAddressSchema.safeParse(input).success).toBe(false);
  });

  it("uses the canonical MAC in generated fallback emails", () => {
    expect(autoEmail(undefined, "AA-BB-CC-DD-EE-FF")).toBe(
      "client-aabbccddeeff@client.cine-kin.tv",
    );
  });

  it("keeps generated emails unique even when two clients share the same name", () => {
    expect(autoEmail("Jean Client", "00:11:22:33:44:55")).toBe(
      "jean-client-001122334455@client.cine-kin.tv",
    );
    expect(autoEmail("Jean Client", "00:11:22:33:44:66")).toBe(
      "jean-client-001122334466@client.cine-kin.tv",
    );
  });

  it("keeps legacy stored representations discoverable during migration", () => {
    expect(macLookupVariants("AA-BB-CC-DD-EE-FF")).toEqual([
      "aa:bb:cc:dd:ee:ff",
      "aabbccddeeff",
      "aa-bb-cc-dd-ee-ff",
    ]);
  });
});

describe("licence renewal and claim codes", () => {
  it("extends a still-active annual licence from its current expiry", () => {
    const now = new Date("2026-08-20T12:00:00Z");
    const currentExpiry = new Date("2027-01-15T12:00:00Z");
    expect(computeRenewalExpiry("12_months", now, currentExpiry)).toEqual(
      new Date("2028-01-15T12:00:00Z"),
    );
  });

  it("restarts an expired annual licence from now and keeps unlimited without expiry", () => {
    const now = new Date("2026-08-20T12:00:00Z");
    expect(
      computeRenewalExpiry("12_months", now, new Date("2026-01-01T00:00:00Z")),
    ).toEqual(new Date("2027-08-20T12:00:00Z"));
    expect(computeRenewalExpiry("unlimited", now, new Date("2030-01-01T00:00:00Z"))).toBeNull();
  });

  it("generates a strong human-readable code accepted by the API schema", () => {
    const code = generateClaimCode();
    expect(code).toMatch(/^CK-[A-HJ-NP-Z2-9]{5}-[A-HJ-NP-Z2-9]{5}$/);
    expect(claimCodeSchema.parse(code)).toMatch(/^CK[A-HJ-NP-Z2-9]{10}$/);
  });
});
