import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { COMMERCIAL_INFO } from "../src/data/commercial";
import {
  CLIENT_PLANS,
  RESELLER_PLANS,
  SITE_CONFIG,
} from "../src/data/siteData";

const root = path.resolve(import.meta.dirname, "..");
const read = (relativePath: string) =>
  readFileSync(path.join(root, relativePath), "utf8");

describe("public commercial information", () => {
  it("uses one source of truth for published support hours", () => {
    expect(SITE_CONFIG.supportHours).toBe(COMMERCIAL_INFO.support.hours);
  });

  it("keeps every client offer within the published screen limit", () => {
    expect(Math.max(...CLIENT_PLANS.map(plan => plan.screens))).toBe(
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

  it("keeps unsupported catalogue volumes and third-party price claims out of public copy", () => {
    const publicCopy = [
      read("src/data/commercial.ts"),
      read("src/data/siteData.ts"),
      read("src/components/Gallery.tsx"),
      read("src/components/SavingsCalculator.tsx"),
      read("src/pages/Faq.tsx"),
      read("src/pages/Tutoriels.tsx"),
    ].join("\n");

    expect(publicCopy).not.toMatch(/des milliers/i);
    expect(publicCopy).not.toMatch(
      /Canal\+|BeIN Sports|Netflix Premium|Disney\+|Amazon Prime/i
    );
    expect(read("src/components/SavingsCalculator.tsx")).toContain(
      "aucun tarif tiers n’est présumé"
    );
    expect(publicCopy).not.toMatch(
      /sous quelques minutes|accédez immédiatement|contactera rapidement|toutes les fonctionnalités/i
    );
    expect(read("src/pages/Tutoriels.tsx")).not.toMatch(
      /bit\.ly|unknown sources/i
    );
    expect(read("src/pages/Tutoriels.tsx")).toContain(
      "boutique officielle"
    );
  });
});
