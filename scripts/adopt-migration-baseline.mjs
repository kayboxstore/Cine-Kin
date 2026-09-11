import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  adoptBaseline,
  analyzeMacRows,
  classifyMigrationState,
  databaseTarget,
  openDatabase,
} from "./lib/migration-database.mjs";

export function parseAdoptionArguments(argv) {
  const options = { apply: false, confirm: null, json: false };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--apply") options.apply = true;
    else if (argument === "--json") options.json = true;
    else if (argument === "--confirm") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error("--confirm attend le nom exact de la base.");
      }
      options.confirm = value;
      index += 1;
    } else throw new Error(`Option inconnue : ${argument}`);
  }
  return options;
}

function stateExplanation(result) {
  switch (result.state) {
    case "empty":
      return "La base est vide : exécutez directement npm run db:migrate.";
    case "tracked":
      return "La base possède déjà un historique Drizzle : aucune adoption nécessaire.";
    case "tracked-history-diverged":
      return "L'historique Drizzle enregistré diverge des migrations locales.";
    case "tracked-schema-drift":
      return "Le schéma réel diverge du dernier snapshot Drizzle enregistré.";
    case "current-untracked":
      return "Le schéma récent est présent sans historique Drizzle. Adoption automatique refusée.";
    case "incompatible":
      return "Le schéma ne correspond ni à la baseline historique ni au schéma actuel.";
    default:
      return "La base correspond à la baseline historique et peut être adoptée.";
  }
}

function safeReport(result, target) {
  const mac = analyzeMacRows(result.inspection.appClientRows);
  return {
    target: { database: target.database, host: target.host, port: target.port },
    state: result.state,
    explanation: stateExplanation(result),
    appClients: result.inspection.appClientSummary,
    resellers: result.inspection.resellerRows.length,
    mac: {
      collisions: mac.collisions,
      invalid: mac.invalid,
      legacyFormatCount: mac.legacyFormat.length,
    },
    baselineErrors: result.baselineComparison?.errors ?? [],
    currentErrors: result.currentComparison?.errors ?? [],
    trackingErrors: result.errors ?? [],
  };
}

export async function runBaselineAdoption(
  argv,
  rawUrl = process.env.DATABASE_URL
) {
  const options = parseAdoptionArguments(argv);
  const target = databaseTarget(rawUrl);
  if (options.apply && options.confirm !== target.database) {
    throw new Error(
      `Pour écrire la baseline, ajoutez --confirm ${target.database} afin de confirmer la base ciblée.`
    );
  }

  const opened = await openDatabase(rawUrl);
  try {
    const result = await classifyMigrationState(
      opened.connection,
      opened.target.database
    );
    const report = safeReport(result, target);
    if (result.state !== "legacy-untracked") {
      return { applied: false, ok: false, report };
    }
    if (!options.apply) {
      return { applied: false, ok: true, report };
    }
    await adoptBaseline(opened.connection, opened.target.database, {
      apply: true,
    });
    return { applied: true, ok: true, report };
  } finally {
    await opened.connection.end();
  }
}

async function main() {
  const options = parseAdoptionArguments(process.argv.slice(2));
  const result = await runBaselineAdoption(process.argv.slice(2));
  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(
      `Base : ${result.report.target.database} sur ${result.report.target.host}`
    );
    console.log(`État : ${result.report.state}`);
    console.log(result.report.explanation);
    if (result.report.appClients) {
      console.log(
        `Appareils : ${result.report.appClients.total} (${result.report.appClients.withPin} avec un ancien PIN)`
      );
    }
    console.log(`Revendeurs : ${result.report.resellers}`);
    console.log(
      `MAC au format historique : ${result.report.mac.legacyFormatCount}`
    );
    console.log(`MAC invalides : ${result.report.mac.invalid.length}`);
    console.log(`Collisions de MAC : ${result.report.mac.collisions.length}`);
    for (const error of [
      ...result.report.baselineErrors,
      ...result.report.currentErrors,
      ...result.report.trackingErrors,
    ].slice(0, 20)) {
      console.error(`- ${error}`);
    }
    if (result.applied) {
      console.log(
        "✓ Baseline Drizzle enregistrée. Exécutez maintenant npm run db:migrate."
      );
    } else if (result.ok) {
      console.log(
        `✓ Contrôle réussi. Pour appliquer : npm run db:adopt -- --apply --confirm ${result.report.target.database}`
      );
    }
  }
  if (!result.ok) process.exitCode = 1;
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) ===
    path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  main().catch(error => {
    console.error(
      `[db-adopt] ${error instanceof Error ? error.message : String(error)}`
    );
    process.exitCode = 1;
  });
}
