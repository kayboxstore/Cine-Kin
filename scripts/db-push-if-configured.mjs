// Runs `drizzle-kit push` during the Vercel build, but only when a
// DATABASE_URL is actually configured for this deployment's environment.
//
// Preview deployments (feature branches) don't get DATABASE_URL set, so
// without this guard every preview build would fail at drizzle.config.ts's
// `throw new Error("DATABASE_URL is required...")`. Skipping cleanly here
// keeps preview builds working while still auto-syncing the schema on every
// Production deploy that does have a database configured.
//
// No --force flag: a first push against an empty database is pure CREATE
// TABLE (no data-loss prompts), but if a later schema change would be
// destructive, drizzle-kit will refuse to apply it non-interactively and the
// build fails loudly instead of silently truncating data.

import { spawnSync } from "node:child_process";

if (!process.env.DATABASE_URL) {
  console.log("[db-push] DATABASE_URL not set — skipping schema push (preview build).");
  process.exit(0);
}

console.log("[db-push] DATABASE_URL set — syncing schema with drizzle-kit push...");
const result = spawnSync("npx", ["drizzle-kit", "push"], {
  stdio: "inherit",
  env: process.env,
});

process.exit(result.status ?? 1);
