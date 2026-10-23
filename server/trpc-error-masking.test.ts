import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { TRPCError } from "@trpc/server";
import { createRouter, publicQuery } from "./middleware";
import { logTrpcProcedureError } from "./lib/trpc-error-logging";
import type { TrpcContext } from "./context";

// End-to-end check of the real pipeline: createRouter/publicQuery share the
// same `t` instance as the production router, so this exercises the actual
// errorFormatter (middleware.ts) wired exactly as app.ts wires onError — no
// database, no network, just the tRPC fetch adapter against an in-memory
// Request. A dedicated test router is used instead of the production
// appRouter so no procedure here ever touches a real database connection.

function drizzleQueryFailure() {
  const cause = Object.assign(new Error("Unknown column 'claim_code_hash' in 'field list'"), {
    code: "ER_BAD_FIELD_ERROR",
    errno: 1054,
    sqlState: "42S22",
    sqlMessage: "Unknown column 'claim_code_hash' in 'field list'",
  });
  return Object.assign(
    new Error(
      "Failed query: select `id`, `mac`, `claim_code_hash` from `app_clients` where `app_clients`.`mac` in (?) limit ? params: 00:11:22:33:44:55,1"
    ),
    { cause }
  );
}

const testRouter = createRouter({
  boom: publicQuery.mutation(() => {
    throw drizzleQueryFailure();
  }),
  denied: publicQuery.mutation(() => {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "PIN incorrect pour cette adresse MAC.",
    });
  }),
});

async function callProcedure(path: string) {
  const req = new Request(`http://localhost/api/trpc/${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({}),
  });
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: testRouter,
    createContext: async () => ({}) as TrpcContext,
    onError: logTrpcProcedureError,
  });
}

describe("tRPC error masking, end-to-end over the fetch adapter", () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it("never lets a raw driver/Drizzle failure reach the client response", async () => {
    const res = await callProcedure("boom");
    const body = await res.text();

    expect(body.toLowerCase()).not.toContain("select");
    expect(body.toLowerCase()).not.toContain("params");
    expect(body).not.toContain("claim_code_hash");
    expect(body).not.toContain("00:11:22:33:44:55");
    expect(body).toContain("Erreur interne.");
  });

  it("keeps a deliberately thrown TRPCError's message intact for the client", async () => {
    const res = await callProcedure("denied");
    const body = await res.text();

    expect(body).toContain("PIN incorrect pour cette adresse MAC.");
  });

  it("logs the driver's code/errno server-side, never the query or params", async () => {
    await callProcedure("boom");

    expect(errorSpy).toHaveBeenCalled();
    const logged = errorSpy.mock.calls.map((call: unknown[]) => String(call[0])).join("\n");

    expect(logged).toContain("ER_BAD_FIELD_ERROR");
    expect(logged).toContain("1054");
    // sqlMessage legitimately names the column (that's the point of logging
    // it); the raw query text and the bound parameter values never appear.
    expect(logged.toLowerCase()).not.toContain("select");
    expect(logged.toLowerCase()).not.toContain("params:");
    expect(logged).not.toContain("00:11:22:33:44:55");
  });
});
