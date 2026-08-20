import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const connectionString = process.env.DATABASE_URL;

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "mysql",
  // Snapshot generation and consistency checks do not need a live database.
  // `drizzle-kit migrate` still requires DATABASE_URL and will fail clearly
  // when credentials are absent.
  ...(connectionString
    ? {
        dbCredentials: {
          url: connectionString,
        },
      }
    : {}),
});
