import { describe, expect, it } from "vitest";
import { COMMERCIAL_INFO } from "../src/data/commercial";
import {
  CLIENT_PLANS,
  RESELLER_PLANS,
  SITE_CONFIG,
} from "../src/data/siteData";

describe("public commercial information", () => {
  it("uses one source of truth for published support hours", () => {
    expect(SITE_CONFIG.supportHours).toBe(COMMERCIAL_INFO.support.hours);
  });

  it("keeps every client offer within the published screen limit", () => {
    expect(Math.max(...CLIENT_PLANS.map((plan) => plan.screens))).toBe(
      COMMERCIAL_INFO.screens.max
    );
  });

  it("does not encode a guaranteed reseller margin in the plan grid", () => {
    for (const plan of RESELLER_PLANS) {
      expect("margin" in plan).toBe(false);
      expect(plan.priceLabel).toContain(String(plan.price));
    }
  });

  it("does not publish an unapproved numeric refund window", () => {
    const refundCopy = `${COMMERCIAL_INFO.refund.label} ${COMMERCIAL_INFO.refund.description}`;
    expect(refundCopy).not.toMatch(/\b(?:2|7|30)\s*jours?\b/i);
  });
});
