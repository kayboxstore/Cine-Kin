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

  it("drops a duplicate-key sqlMessage — it echoes the offending value", () => {
    const error = Object.assign(new Error("boom"), {
      code: "ER_DUP_ENTRY",
      errno: 1062,
      sqlState: "23000",
      sqlMessage: "Duplicate entry 'a@b.com' for key 'email'",
    });
    const fields = driverErrorFields(error);
    expect(fields?.code).toBe("ER_DUP_ENTRY");
    expect(fields?.errno).toBe(1062);
    expect(fields?.sqlState).toBe("23000");
    expect(fields?.sqlMessage).toBeUndefined();
    expect(JSON.stringify(fields)).not.toContain("a@b.com");
  });

  it.each([
    "Unknown column 'claim_code_hash' in 'field list'",
    "Table 'cine_kin.app_clients' doesn't exist",
    "Unknown database 'cine_kin'",
  ])("keeps an allowlisted, schema-shaped sqlMessage as-is: %s", sqlMessage => {
    const error = Object.assign(new Error("boom"), {
      code: "ER_SOME_CODE",
      errno: 1234,
      sqlState: "42000",
      sqlMessage,
    });
    expect(driverErrorFields(error)?.sqlMessage).toBe(sqlMessage);
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
