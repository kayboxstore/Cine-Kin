import { spawnSync } from "node:child_process";
import path from "node:path";
import {
  classifyMigrationState,
  openDatabase,
  projectRoot,
} from "./lib/migration-database.mjs";

if (!process.env.DATABASE_URL) {
  console.log(
    "[db-migrate] DATABASE_URL absente — migrations ignorées (preview). "
  );
  process.exit(0);
}

const opened = await openDatabase();
let result;
try {
  result = await classifyMigrationState(
    opened.connection,
    opened.target.database
  );
} finally {
  await opened.connection.end();
}

if (result.state === "legacy-untracked") {
  throw new Error(
    `Base historique non adoptée. Exécutez d'abord « npm run db:adopt -- --apply --confirm ${opened.target.database} » sur une copie de staging, puis en production.`
  );
}
if (result.state === "current-untracked") {
  throw new Error(
    "Le schéma actuel existe sans historique Drizzle. Migration automatique refusée ; un rapprochement manuel est requis."
  );
}
if (result.state === "incompatible") {
  const details = [
    ...(result.baselineComparison?.errors ?? []),
    ...(result.currentComparison?.errors ?? []),
  ]
    .slice(0, 8)
    .join(" ; ");
  throw new Error(
    `Schéma incompatible avec les migrations versionnées : ${details}`
  );
}
if (
  result.state === "tracked-history-diverged" ||
  result.state === "tracked-schema-drift"
) {
  throw new Error(
    `Migration automatique refusée : ${result.errors.slice(0, 8).join(" ; ")}`
  );
}
if (result.state !== "empty" && result.state !== "tracked") {
  throw new Error(`État de migration non pris en charge : ${result.state}.`);
}

console.log(
  `[db-migrate] État « ${result.state} » — application des migrations versionnées...`
);
const drizzleCli = path.join(
  projectRoot,
  "node_modules",
  "drizzle-kit",
  "bin.cjs"
);
const migration = spawnSync(process.execPath, [drizzleCli, "migrate"], {
  stdio: "inherit",
  env: process.env,
});
if (migration.status !== 0) {
  process.exit(migration.status ?? 1);
}
