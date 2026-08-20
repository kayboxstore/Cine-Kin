import { describe, expect, it } from "vitest";
import { isDuplicateKeyError } from "./db-errors";

describe("MySQL duplicate-key classification", () => {
  it("recognises direct and wrapped duplicate-key errors", () => {
    expect(isDuplicateKeyError({ code: "ER_DUP_ENTRY" })).toBe(true);
    expect(isDuplicateKeyError({ errno: 1062 })).toBe(true);
    expect(isDuplicateKeyError({ cause: { code: "ER_DUP_ENTRY" } })).toBe(true);
  });

  it("does not hide unrelated database failures", () => {
    expect(isDuplicateKeyError({ code: "ECONNREFUSED" })).toBe(false);
    expect(isDuplicateKeyError(new Error("boom"))).toBe(false);
  });
});
