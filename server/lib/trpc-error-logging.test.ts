import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import { logTrpcProcedureError } from "./trpc-error-logging";

function drizzleQueryFailure() {
  const cause = Object.assign(new Error("Unknown column 'claim_code_hash' in 'field list'"), {
    code: "ER_BAD_FIELD_ERROR",
    errno: 1054,
    sqlState: "42S22",
    sqlMessage: "Unknown column 'claim_code_hash' in 'field list'",
  });
  return Object.assign(
    new Error(
      "Failed query: select `id`, `claim_code_hash` from `app_clients` where `mac` in (?) params: 00:11:22:33:44:55"
    ),
    { cause }
  );
}

describe("logTrpcProcedureError", () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it("logs the tRPC code, path, and the driver's code/errno — never the query or params", () => {
    const error = new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "ignored on purpose",
      cause: drizzleQueryFailure(),
    });

    logTrpcProcedureError({ error, path: "app.registerDevice" });

    expect(errorSpy).toHaveBeenCalledTimes(1);
    const logged = String(errorSpy.mock.calls[0]?.[0]);

    expect(logged).toContain("app.registerDevice");
    expect(logged).toContain("INTERNAL_SERVER_ERROR");
    expect(logged).toContain("ER_BAD_FIELD_ERROR");
    expect(logged).toContain("1054");

    // sqlMessage is expected and legitimately names the offending column
    // (that's the point of logging it) — what must never appear is the raw
    // query text or the bound parameter values Drizzle's own wrapper
    // message concatenates them into.
    expect(logged.toLowerCase()).not.toContain("select");
    expect(logged.toLowerCase()).not.toContain("params:");
    expect(logged).not.toContain("00:11:22:33:44:55");
  });

  it("logs just the tRPC code and path for a deliberately thrown TRPCError", () => {
    const error = new TRPCError({ code: "UNAUTHORIZED", message: "PIN incorrect." });

    logTrpcProcedureError({ error, path: "app.registerDevice" });

    const logged = String(errorSpy.mock.calls[0]?.[0]);
    expect(logged).toContain("UNAUTHORIZED");
    expect(logged).toContain("app.registerDevice");
    expect(logged).not.toContain("PIN incorrect");
  });
});
