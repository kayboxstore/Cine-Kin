import type { Context } from "hono";
import { sql } from "drizzle-orm";
import { getDb } from "../queries/connection";
import { errorSummary, logEvent } from "./observability";

export async function checkDatabaseConnection(): Promise<void> {
  await getDb().execute(sql`SELECT 1`);
}

export function createReadinessHandler(
  check: () => Promise<void> = checkDatabaseConnection
) {
  return async (c: Context) => {
    c.header("Cache-Control", "no-store");
    const startedAt = performance.now();
    try {
      await check();
      return c.json({
        ok: true,
        checks: { database: "up" },
        durationMs: Math.round(performance.now() - startedAt),
      });
    } catch (error) {
      logEvent("warn", "health_database_unavailable", {
        ...errorSummary(error),
      });
      return c.json(
        {
          ok: false,
          checks: { database: "down" },
          durationMs: Math.round(performance.now() - startedAt),
        },
        503
      );
    }
  };
}
