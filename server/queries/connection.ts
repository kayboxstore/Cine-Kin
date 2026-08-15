import { drizzle } from "drizzle-orm/mysql2";
import mysql, { type Pool } from "mysql2";
import { env } from "../lib/env";
import * as schema from "@db/schema";
import * as relations from "@db/relations";

const fullSchema = { ...schema, ...relations };

let instance: ReturnType<typeof drizzle<typeof fullSchema>>;

// Build a mysql2 pool from DATABASE_URL. Hosted MySQL providers (TiDB Cloud,
// Aiven, PlanetScale, …) require TLS, so SSL is enabled automatically for any
// non-localhost host. TiDB/Aiven use publicly-trusted certificates, so Node's
// default CA bundle validates them without extra config.
function createPool(): Pool {
  const url = new URL(env.databaseUrl);
  const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  return mysql.createPool({
    host: url.hostname,
    port: url.port ? Number(url.port) : 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ""),
    ...(isLocal ? {} : { ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true } }),
  });
}

export function getDb() {
  if (!instance) {
    instance = drizzle(createPool(), {
      mode: "default",
      schema: fullSchema,
    });
  }
  return instance;
}
