import { createHash } from "node:crypto";
import { sql } from "drizzle-orm";
import type { Env, Input } from "hono";
import { MemoryStore, type Store } from "hono-rate-limiter";
import { env } from "./env";
import { getDb } from "../queries/connection";

type CounterRow = {
  totalHits: number | string;
  resetTime: Date | string;
};

export class DatabaseRateLimitStore<
  E extends Env = Env,
  P extends string = string,
  I extends Input = Input,
> implements Store<E, P, I> {
  localKeys = false;
  prefix: string;
  private windowMs = 60_000;
  private operations = 0;

  constructor(prefix: string) {
    this.prefix = `${prefix}:`;
  }

  init(options: { windowMs: number }): void {
    this.windowMs = options.windowMs;
  }

  private key(value: string): string {
    return createHash("sha256").update(`${this.prefix}${value}`).digest("hex");
  }

  async get(value: string) {
    const result = await getDb().execute(sql`
      SELECT hits AS totalHits, reset_at AS resetTime
      FROM rate_limit_counters
      WHERE counter_key = ${this.key(value)}
        AND reset_at > UTC_TIMESTAMP(3)
      LIMIT 1
    `);
    const rows = result[0] as unknown as CounterRow[];
    const row = rows[0];
    if (!row) return undefined;
    return {
      totalHits: Number(row.totalHits),
      resetTime: new Date(row.resetTime),
    };
  }

  async increment(value: string) {
    const key = this.key(value);
    const windowMicros = this.windowMs * 1000;
    await getDb().execute(sql`
      INSERT INTO rate_limit_counters (counter_key, hits, reset_at)
      VALUES (
        ${key},
        1,
        DATE_ADD(UTC_TIMESTAMP(3), INTERVAL ${windowMicros} MICROSECOND)
      )
      ON DUPLICATE KEY UPDATE
        hits = IF(reset_at <= UTC_TIMESTAMP(3), 1, hits + 1),
        reset_at = IF(
          reset_at <= UTC_TIMESTAMP(3),
          VALUES(reset_at),
          reset_at
        )
    `);

    const result = await this.get(value);
    if (!result) throw new Error("Rate-limit counter could not be read back");

    this.operations += 1;
    if (this.operations % 100 === 0) {
      await getDb().execute(sql`
        DELETE FROM rate_limit_counters
        WHERE reset_at < DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 1 DAY)
        LIMIT 1000
      `);
    }
    return result;
  }

  async decrement(value: string): Promise<void> {
    await getDb().execute(sql`
      UPDATE rate_limit_counters
      SET hits = GREATEST(hits - 1, 0)
      WHERE counter_key = ${this.key(value)}
        AND reset_at > UTC_TIMESTAMP(3)
    `);
  }

  async resetKey(value: string): Promise<void> {
    await getDb().execute(sql`
      DELETE FROM rate_limit_counters
      WHERE counter_key = ${this.key(value)}
    `);
  }
}

export function createRateLimitStore<
  E extends Env = Env,
  P extends string = string,
  I extends Input = Input,
>(prefix: string): Store<E, P, I> {
  return env.rateLimitStore === "database"
    ? new DatabaseRateLimitStore<E, P, I>(prefix)
    : new MemoryStore<E, P, I>();
}
