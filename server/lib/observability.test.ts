import { describe, expect, it } from "vitest";
import { driverErrorFields, errorSummary } from "./observability";

function drizzleQueryFailure() {
  const cause = Object.assign(new Error("Unknown column 'claim_code_hash' in 'field list'"), {
    code: "ER_BAD_FIELD_ERROR",
    errno: 1054,
    sqlState: "42S22",
    sqlMessage: "Unknown column 'claim_code_hash' in 'field list'",
  });
  // Mirrors drizzle-orm's own wrapper: the top-level .message gets the SQL
  // text and bound parameters, the original driver error moves to .cause.
  return Object.assign(
    new Error(
      "Failed query: select `id`, `claim_code_hash` from `app_clients` where `mac` in (?) params: 00:11:22:33:44:55"
    ),
    { cause }
  );
}

describe("driverErrorFields", () => {
  it("extracts code/errno/sqlState/sqlMessage from a wrapped driver cause", () => {
    expect(driverErrorFields(drizzleQueryFailure())).toEqual({
      code: "ER_BAD_FIELD_ERROR",
      errno: 1054,
      sqlState: "42S22",
      sqlMessage: "Unknown column 'claim_code_hash' in 'field list'",
    });
  });

  it("extracts the fields when they sit directly on the error, no .cause", () => {
    const error = Object.assign(new Error("boom"), { code: "ER_DUP_ENTRY", errno: 1062 });
    expect(driverErrorFields(error)).toEqual({
      code: "ER_DUP_ENTRY",
      errno: 1062,
      sqlState: undefined,
      sqlMessage: undefined,
    });
  });

  it("returns undefined for an unrelated error", () => {
    expect(driverErrorFields(new Error("validation failed"))).toBeUndefined();
    expect(driverErrorFields("not an object")).toBeUndefined();
  });
});

describe("errorSummary", () => {
  it("redacts a driver error's message instead of passing it through", () => {
    const summary = errorSummary(drizzleQueryFailure());
    expect(summary.errorMessage).not.toContain("select");
    expect(summary.errorMessage).not.toContain("params");
    expect(summary.errorMessage).not.toContain("claim_code_hash");
  });

  it("keeps the message for a plain, non-driver error", () => {
    expect(errorSummary(new Error("validation failed"))).toEqual({
      errorName: "Error",
      errorMessage: "validation failed",
    });
  });

  it("handles a non-Error thrown value", () => {
    expect(errorSummary("boom")).toEqual({
      errorName: "UnknownError",
      errorMessage: "boom",
    });
  });
});
