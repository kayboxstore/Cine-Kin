type LogLevel = "info" | "warn" | "error";

export function logEvent(
  level: LogLevel,
  event: string,
  fields: Record<string, unknown> = {}
): void {
  const entry = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    event,
    ...fields,
  });
  if (level === "error") console.error(entry);
  else if (level === "warn") console.warn(entry);
  else console.info(entry);
}

export type DriverErrorFields = {
  code?: string;
  errno?: number;
  sqlState?: string;
  sqlMessage?: string;
};

// A mysql2/Drizzle query failure carries structured fields (code/errno/
// sqlState/sqlMessage) either directly on the thrown error or several
// `.cause` levels down (a TRPCError's .cause is often Drizzle's own wrapper
// error, itself rebuilding .message as "Failed query: <sql> params: <...>"
// and setting *its* .cause to the real mysql2 error). Walks the cause chain
// looking for that shape so callers can log only the structured fields and
// redact every free-text message along the way.
//
// Requires errno/sqlState/sqlMessage, never a bare `code` alone: a
// TRPCError's own `.code` is a tRPC code string (e.g.
// "INTERNAL_SERVER_ERROR") that would otherwise be mistaken for a driver
// error code.
export function driverErrorFields(error: unknown): DriverErrorFields | undefined {
  let current: unknown = error;
  for (let depth = 0; depth < 5 && current && typeof current === "object"; depth++) {
    const fields = current as Record<string, unknown>;
    const isDriverShaped =
      typeof fields.errno === "number" ||
      typeof fields.sqlState === "string" ||
      typeof fields.sqlMessage === "string";
    if (isDriverShaped) {
      const sqlMessage =
        typeof fields.sqlMessage === "string" ? fields.sqlMessage : undefined;
      return {
        code: typeof fields.code === "string" ? fields.code : undefined,
        errno: typeof fields.errno === "number" ? fields.errno : undefined,
        sqlState: typeof fields.sqlState === "string" ? fields.sqlState : undefined,
        sqlMessage:
          sqlMessage && isAllowlistedSqlMessage(sqlMessage) ? sqlMessage : undefined,
      };
    }
    current = fields.cause;
  }
  return undefined;
}

// mysql2's sqlMessage can itself carry user-supplied data verbatim — a
// duplicate-key violation echoes the offending value ("Duplicate entry
// 'a@b.com' for key 'email'"). Only schema-shaped messages (naming a
// column/table/database that doesn't exist, never a row's data) are safe to
// log as-is; anything else is dropped, keeping only code/errno/sqlState.
const ALLOWED_SQL_MESSAGE_PATTERNS = [
  /^Unknown column '[^']*'/,
  /^Table '[^']*' doesn't exist/,
  /^Unknown database '[^']*'/,
];

function isAllowlistedSqlMessage(sqlMessage: string): boolean {
  return ALLOWED_SQL_MESSAGE_PATTERNS.some(pattern => pattern.test(sqlMessage));
}

export function errorSummary(error: unknown): {
  errorName: string;
  errorMessage: string;
} {
  if (error instanceof Error) {
    // A driver/Drizzle error's own .message (and Drizzle's wrapper message)
    // can contain the raw SQL text and bound parameter values. Never log it
    // here; driverErrorFields() carries the safe, structured fields instead.
    if (driverErrorFields(error)) {
      return { errorName: error.name, errorMessage: "[driver error — see driver fields]" };
    }
    return { errorName: error.name, errorMessage: error.message };
  }
  return { errorName: "UnknownError", errorMessage: String(error) };
}
