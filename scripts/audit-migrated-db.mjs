import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  analyzeMacRows,
  auditLedger,
  classifyMigrationState,
  compareSchema,
  databaseTarget,
  openDatabase,
} from "./lib/migration-database.mjs";

export async function auditMigratedDatabase(rawUrl = process.env.DATABASE_URL) {
  const target = databaseTarget(rawUrl);
  const opened = await openDatabase(rawUrl);
  try {
    const result = await classifyMigrationState(
      opened.connection,
      opened.target.database
    );
    const errors = [];
    if (result.state !== "tracked") {
      errors.push(`Historique de migration inattendu : ${result.state}.`);
    }

    const schema = compareSchema(
      result.definitions.current.snapshot,
      result.inspection
    );
    errors.push(...schema.errors);

    const expectedMigrations = result.definitions.all;
    for (const migration of expectedMigrations) {
      const recorded = result.inspection.migrationHistory.find(
        row => Number(row.createdAt) === migration.entry.when
      );
      if (!recorded) {
        errors.push(`Migration non enregistrée : ${migration.entry.tag}.`);
      } else if (recorded.hash !== migration.hash) {
        errors.push(`Empreinte divergente pour ${migration.entry.tag}.`);
      }
    }

    const ledger = auditLedger(
      result.inspection.resellerRows,
      result.inspection.ledgerRows
    );
    errors.push(...ledger.errors);
    const mac = analyzeMacRows(result.inspection.appClientRows);

    return {
      ok: errors.length === 0,
      target: {
        database: target.database,
        host: target.host,
        port: target.port,
      },
      migrations: result.inspection.migrationHistory.length,
      expectedMigrations: expectedMigrations.length,
      appClients: result.inspection.appClientSummary,
      resellers: result.inspection.resellerRows.length,
      ledgerEntries: result.inspection.ledgerRows.length,
      mac: {
        collisions: mac.collisions,
        invalid: mac.invalid,
        legacyFormat: mac.legacyFormat,
      },
      errors,
    };
  } finally {
    await opened.connection.end();
  }
}

async function main() {
  const report = await auditMigratedDatabase();
  console.log(`Base : ${report.target.database} sur ${report.target.host}`);
  console.log(`Migrations enregistrées : ${report.migrations}`);
  console.log(
    `Revendeurs / écritures : ${report.resellers} / ${report.ledgerEntries}`
  );
  if (report.appClients) {
    console.log(
      `Appareils : ${report.appClients.total}, vérifiés : ${report.appClients.claimed}, à revérifier : ${report.appClients.pendingVerification}`
    );
  }
  console.log(`MAC historiques : ${report.mac.legacyFormat.length}`);
  console.log(`MAC invalides : ${report.mac.invalid.length}`);
  console.log(`Collisions de MAC : ${report.mac.collisions.length}`);
  for (const error of report.errors) console.error(`- ${error}`);
  if (!report.ok) process.exitCode = 1;
  else console.log("✓ Schéma, historique et registre de crédits cohérents.");
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) ===
    path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  main().catch(error => {
    console.error(
      `[db-audit] ${error instanceof Error ? error.message : String(error)}`
    );
    process.exitCode = 1;
  });
}
