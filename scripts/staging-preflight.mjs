import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  classifyMigrationState,
  openDatabase,
} from "./lib/migration-database.mjs";
import {
  parseStagingArguments,
  safeStagingReport,
  validateStagingEnvironment,
} from "./lib/staging-safety.mjs";

const ALLOWED_SOURCE_STATES = new Set(["empty", "legacy-untracked", "tracked"]);

async function inspectOne(rawUrl) {
  const opened = await openDatabase(rawUrl);
  try {
    const result = await classifyMigrationState(
      opened.connection,
      opened.target.database
    );
    return {
      state: result.state,
      applicationTables: [...result.inspection.tableNames].filter(
        tableName => tableName !== "__drizzle_migrations"
      ).length,
      appClients: result.inspection.appClientSummary?.total ?? 0,
      resellers: result.inspection.resellerRows.length,
      ledgerEntries: result.inspection.ledgerRows.length,
    };
  } finally {
    await opened.connection.end();
  }
}

export async function inspectStagingTargets(validation) {
  if (!validation.ok) {
    return { errors: [...validation.errors], ok: false };
  }
  const { source, restore } = validation.configuration;
  const [sourceInspection, restoreInspection] = await Promise.all([
    inspectOne(source.rawUrl),
    inspectOne(restore.rawUrl),
  ]);
  const errors = [];
  const warnings = [];
  if (!ALLOWED_SOURCE_STATES.has(sourceInspection.state)) {
    errors.push(
      `État de la base source refusé pour une répétition : ${sourceInspection.state}.`
    );
  }
  if (restoreInspection.state !== "empty") {
    errors.push(
      `La base de restauration doit être vide ; état observé : ${restoreInspection.state}.`
    );
  }
  if (sourceInspection.state === "empty") {
    warnings.push(
      "La base source est vide : la répétition validera la chaîne technique mais pas une reprise représentative."
    );
  }
  if (sourceInspection.state === "legacy-untracked") {
    warnings.push(
      "La source utilise la baseline historique ; la copie restaurée exigera --adopt-legacy."
    );
  }
  return {
    errors,
    ok: errors.length === 0,
    restore: restoreInspection,
    source: sourceInspection,
    warnings,
  };
}

export async function runStagingPreflight(
  argv = process.argv.slice(2),
  environment = process.env
) {
  const options = parseStagingArguments(argv);
  const validation = validateStagingEnvironment(environment, options);
  const report = safeStagingReport(validation);
  if (!validation.ok) return report;

  const inspection = await inspectStagingTargets(validation);
  return {
    ...report,
    ok: inspection.ok,
    errors: [...report.errors, ...inspection.errors],
    warnings: [...report.warnings, ...inspection.warnings],
    inspection: {
      source: inspection.source,
      restore: inspection.restore,
    },
  };
}

function printReport(report) {
  if (report.source) {
    console.log(
      `Source : ${report.source.database} sur ${report.source.host}:${report.source.port}`
    );
  }
  if (report.restore) {
    console.log(
      `Restauration : ${report.restore.database} sur ${report.restore.host}:${report.restore.port}`
    );
  }
  if (report.inspection) {
    console.log(`État source : ${report.inspection.source.state}`);
    console.log(`État restauration : ${report.inspection.restore.state}`);
    console.log(
      `Volumes source : ${report.inspection.source.appClients} appareils, ${report.inspection.source.resellers} revendeurs, ${report.inspection.source.ledgerEntries} écritures de crédit.`
    );
  }
  for (const warning of report.warnings)
    console.warn(`Avertissement : ${warning}`);
  for (const error of report.errors) console.error(`Erreur : ${error}`);
  if (report.ok) {
    console.log(
      "✓ Préflight staging réussi. La source restera en lecture seule et la cible de restauration est vide."
    );
  }
}

async function main() {
  const options = parseStagingArguments(process.argv.slice(2));
  const report = await runStagingPreflight();
  if (options.json) console.log(JSON.stringify(report, null, 2));
  else printReport(report);
  if (!report.ok) process.exitCode = 1;
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) ===
    path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  main().catch(error => {
    console.error(
      `[staging-preflight] ${error instanceof Error ? error.message : String(error)}`
    );
    process.exitCode = 1;
  });
}
