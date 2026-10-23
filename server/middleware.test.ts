import { describe, expect, it } from "vitest";
import { TRPCError } from "@trpc/server";
import { formatTrpcError } from "./middleware";

describe("formatTrpcError", () => {
  it("replaces an INTERNAL_SERVER_ERROR message with a generic one", () => {
    const error = new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message:
        "Failed query: select `id` from `app_clients` where `mac` in (?) params: 00:11:22:33:44:55",
    });
    const shape = formatTrpcError({
      error,
      shape: {
        message: error.message,
        code: -32603,
        data: { code: "INTERNAL_SERVER_ERROR", httpStatus: 500, path: "app.registerDevice", stack: error.stack },
      },
    });
    expect(shape.message).toBe("Erreur interne.");
    expect(shape.message).not.toContain("select");
    expect(shape.message).not.toContain("params");
    expect(shape.data).not.toHaveProperty("stack");
    expect(shape.data.path).toBe("app.registerDevice");
  });

  it("keeps a deliberately thrown TRPCError's own message", () => {
    const error = new TRPCError({
      code: "UNAUTHORIZED",
      message: "PIN incorrect pour cette adresse MAC.",
    });
    const shape = formatTrpcError({
      error,
      shape: {
        message: error.message,
        code: -32001,
        data: { code: "UNAUTHORIZED", httpStatus: 401 },
      },
    });
    expect(shape.message).toBe("PIN incorrect pour cette adresse MAC.");
  });

  it("strips a stack trace even on a non-internal error, defensively", () => {
    const error = new TRPCError({ code: "CONFLICT", message: "Conflit." });
    const shape = formatTrpcError({
      error,
      shape: {
        message: error.message,
        code: -32603,
        data: { code: "CONFLICT", httpStatus: 409, stack: "Error: Conflit.\n at ..." },
      },
    });
    expect(shape.data).not.toHaveProperty("stack");
  });
});
