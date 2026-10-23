import type { TRPCError } from "@trpc/server";
import { driverErrorFields, logEvent } from "./observability";

// Wired as fetchRequestHandler's `onError` (see server/app.ts). This is the
// only place a failed tRPC procedure is logged with its actual cause:
// formatTrpcError (server/middleware.ts) only shapes what the *client*
// receives, and never logs anything itself. Never logs error.message here —
// for an unhandled driver/Drizzle failure that message (or Drizzle's own
// wrapper message) can be "Failed query: <sql> params: <params>". Only the
// tRPC code, the procedure path, and (for a driver-shaped cause) its
// structured code/errno/sqlState/sqlMessage are logged.
export function logTrpcProcedureError(opts: {
  error: TRPCError;
  path?: string;
}): void {
  const { error, path } = opts;
  const cause = driverErrorFields(error);
  logEvent("error", "trpc_procedure_error", {
    path,
    code: error.code,
    ...(cause ? { cause } : {}),
  });
}
