import { describe, expect, it } from "vitest";
import { isSiteIndexingEnabled } from "./site-indexing";

describe("isSiteIndexingEnabled", () => {
  it('is enabled only for the exact string "true" (surrounding whitespace trimmed)', () => {
    expect(isSiteIndexingEnabled("true")).toBe(true);
    expect(isSiteIndexingEnabled("  true  ")).toBe(true);
  });

  it.each([undefined, "", "false", "0", "1", "yes", "True", "TRUE"])(
    "stays disabled for anything else: %s",
    value => {
      expect(isSiteIndexingEnabled(value)).toBe(false);
    }
  );
});
