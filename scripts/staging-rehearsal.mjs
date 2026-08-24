import "dotenv/config";
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { auditMigratedDatabase } from "./audit-migrated-db.mjs";
import {
  adoptBaseline,
  openDatabase,
  projectRoot,
} from "./lib/migration-database.mjs";
import {
  decryptFileToWritable,
  encryptReadableToFile,
  sha256File,
  verifyEncryptedBackup,
} from "./lib/encrypted-backup.mjs";
import {
  assertMysqlCommand,
  mysqlError,
  sanitizedCommandEnvironment,
  spawnMysqlCommand,
  writeMysqlDefaultsFile,
} from "./lib/mysql-cli.mjs";
import {
  parseStagingArguments,
  safeStagingReport,
  validateStagingEnvironment,
} from "./lib/staging-safety.mjs";
import { inspectStagingTargets } from "./staging-preflight.mjs";

function collectStderr(child) {
  let output = "";
  child.stderr?.on("data", chunk => {
    if (output.length < 64_000) output += chunk.toString("utf8");
  });
  return () => output;
}

function childCompletion(child, label, stderr) {
  return new Promise((resolve, reject) => {
    child.once("error", error => reject(error));
    child.once("close", code => {
      if (code === 0) resolve();
      else {
        const detail = mysqlError(stderr());
        reject(
          new Error(
            `${label} a échoué avec le code ${code ?? "inconnu"}${detail ? ` : ${detail}` : "."}`
          )
        );
      }
    });
  });
}

async function createEncryptedDump({
  backupPath,
  command,
  defaultsFile,
  passphrase,
  source,
}) {
  const child = spawnMysqlCommand(
    command,
    [
      `--defaults-file=${defaultsFile}`,
      "--single-transaction",
      "--quick",
      "--routines",
      "--triggers",
      "--events",
      "--hex-blob",
      "--set-gtid-purged=OFF",
      "--no-tablespaces",
      "--default-character-set=utf8mb4",
      source.database,
    ],
    ["ignore", "pipe", "pipe"]
  );
  const stderr = collectStderr(child);
  const results = await Promise.allSettled([
    encryptReadableToFile(child.stdout, backupPath, passphrase),
    childCompletion(child, "mysqldump", stderr),
  ]);
  const failure = results.find(result => result.status === "rejected");
  if (failure) {
    child.kill();
    await rm(backupPath, { force: true });
    throw failure.reason;
  }
  return results[0].value;
}

async function restoreEncryptedDump({
  backupPath,
  command,
  defaultsFile,
  passphrase,
  restore,
}) {
  const child = spawnMysqlCommand(
    command,
    [
      `--defaults-file=${defaultsFile}`,
      "--binary-mode",
      "--show-warnings",
      "--default-character-set=utf8mb4",
      restore.database,
    ],
    ["pipe", "ignore", "pipe"]
  );
  const stderr = collectStderr(child);
  const results = await Promise.allSettled([
    decryptFileToWritable(backupPath, child.stdin, passphrase),
    childCompletion(child, "mysql restore", stderr),
  ]);
  const failure = results.find(result => result.status === "rejected");
  if (failure) {
    child.kill();
    throw failure.reason;
  }
}

function runNodeScript(relativePath, environment) {
  const result = spawnSync(
    process.execPath,
    [path.join(projectRoot, relativePath)],
    {
      cwd: projectRoot,
      env: sanitizedCommandEnvironment(environment),
      stdio: "inherit",
    }
  );
  if (result.status !== 0) {
    throw new Error(
      `${relativePath} a échoué avec le code ${result.status ?? "inconnu"}.`
    );
  }
}

function currentCommit() {
  const result = spawnSync("git", ["rev-parse", "HEAD"], {
    cwd: projectRoot,
    encoding: "utf8",
  });
  return result.status === 0 ? result.stdout.trim() : "unknown";
}

function timestampForFile(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, "-");
}

async function adoptRestoredLegacy(rawUrl, database) {
  const opened = await openDatabase(rawUrl);
  try {
    await adoptBaseline(opened.connection, database, { apply: true });
  } finally {
    await opened.connection.end();
  }
}

export async function runStagingRehearsal(
  argv = process.argv.slice(2),
  environment = process.env
) {
  const startedAt = new Date();
  const options = parseStagingArguments(argv);
  const validation = validateStagingEnvironment(environment, options);
  if (!validation.ok) {
    return { ...safeStagingReport(validation), completed: false };
  }
  if (!options.apply) {
    return {
      ...safeStagingReport(validation),
      completed: false,
      ok: false,
      errors: [
        "La répétition écrit uniquement dans la base de restauration ; ajoutez --apply après un préflight réussi.",
      ],
    };
  }

  const inspection = await inspectStagingTargets(validation);
  if (!inspection.ok) {
    return {
      ...safeStagingReport(validation),
      completed: false,
      ok: false,
      errors: inspection.errors,
      warnings: [...validation.warnings, ...inspection.warnings],
    };
  }
  if (inspection.source.state === "legacy-untracked" && !options.adoptLegacy) {
    return {
      ...safeStagingReport(validation),
      completed: false,
      ok: false,
      errors: [
        "La source est historique : ajoutez --adopt-legacy pour adopter uniquement la copie restaurée.",
      ],
      warnings: inspection.warnings,
    };
  }

  const dumpCommand = environment.MYSQLDUMP_BIN || "mysqldump";
  const mysqlCommand = environment.MYSQL_BIN || "mysql";
  assertMysqlCommand(dumpCommand, "mysqldump");
  assertMysqlCommand(mysqlCommand, "mysql");

  const { backupPassphrase, restore, source } = validation.configuration;
  const backupDirectory = path.resolve(
    projectRoot,
    validation.configuration.backupDirectory
  );
  await mkdir(backupDirectory, { recursive: true, mode: 0o700 });
  const backupBase = `cine-kin-${source.database}-${timestampForFile(startedAt)}`;
  const backupPath = path.join(backupDirectory, `${backupBase}.sql.ckbackup`);
  const checksumPath = `${backupPath}.sha256`;
  const manifestPath = `${backupPath}.json`;
  const temporaryDirectory = await mkdtemp(
    path.join(os.tmpdir(), "cine-kin-staging-")
  );

  try {
    const sourceDefaults = await writeMysqlDefaultsFile(
      temporaryDirectory,
      "source",
      source
    );
    const restoreDefaults = await writeMysqlDefaultsFile(
      temporaryDirectory,
      "restore",
      restore
    );
    const backup = await createEncryptedDump({
      backupPath,
      command: dumpCommand,
      defaultsFile: sourceDefaults,
      passphrase: backupPassphrase,
      source,
    });
    await writeFile(
      checksumPath,
      `${backup.sha256}  ${path.basename(backupPath)}\n`,
      { mode: 0o600 }
    );

    await verifyEncryptedBackup(backupPath, backupPassphrase);
    if ((await sha256File(backupPath)) !== backup.sha256) {
      throw new Error(
        "L’empreinte de la sauvegarde a changé avant la restauration."
      );
    }

    await restoreEncryptedDump({
      backupPath,
      command: mysqlCommand,
      defaultsFile: restoreDefaults,
      passphrase: backupPassphrase,
      restore,
    });

    if (inspection.source.state === "legacy-untracked") {
      await adoptRestoredLegacy(restore.rawUrl, restore.database);
    }
    runNodeScript("scripts/db-migrate-if-configured.mjs", {
      DATABASE_URL: restore.rawUrl,
    });
    const audit = await auditMigratedDatabase(restore.rawUrl);
    if (!audit.ok) {
      throw new Error(
        `Audit de la copie restaurée en échec : ${audit.errors.join(" ; ")}`
      );
    }

    const completedAt = new Date();
    const manifest = {
      format: "cine-kin-staging-rehearsal-v1",
      commit: currentCommit(),
      startedAt: startedAt.toISOString(),
      completedAt: completedAt.toISOString(),
      source: {
        database: source.database,
        host: source.host,
        port: source.port,
        state: inspection.source.state,
      },
      restore: {
        database: restore.database,
        host: restore.host,
        port: restore.port,
      },
      backup: {
        algorithm: backup.algorithm,
        bytes: backup.bytes,
        file: path.basename(backupPath),
        sha256: backup.sha256,
      },
      audit: {
        appClients: audit.appClients?.total ?? 0,
        expectedMigrations: audit.expectedMigrations,
        ledgerEntries: audit.ledgerEntries,
        migrations: audit.migrations,
        resellers: audit.resellers,
      },
    };
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, {
      mode: 0o600,
    });

    return {
      ok: true,
      completed: true,
      backup: {
        path: backupPath,
        checksumPath,
        manifestPath,
        ...manifest.backup,
      },
      audit: manifest.audit,
      source: manifest.source,
      restore: manifest.restore,
      warnings: [...validation.warnings, ...inspection.warnings],
      errors: [],
    };
  } finally {
    await rm(temporaryDirectory, { force: true, recursive: true });
  }
}

function printReport(report) {
  for (const warning of report.warnings ?? []) {
    console.warn(`Avertissement : ${warning}`);
  }
  for (const error of report.errors ?? []) console.error(`Erreur : ${error}`);
  if (!report.completed) return;
  console.log(`Sauvegarde chiffrée : ${report.backup.path}`);
  console.log(`SHA-256 : ${report.backup.sha256}`);
  console.log(`Manifeste : ${report.backup.manifestPath}`);
  console.log(
    `Audit restauré : ${report.audit.migrations}/${report.audit.expectedMigrations} migrations, ${report.audit.resellers} revendeurs, ${report.audit.ledgerEntries} écritures.`
  );
  console.log(
    "✓ Sauvegarde, restauration isolée, migration et audit de staging réussis."
  );
}

async function main() {
  const options = parseStagingArguments(process.argv.slice(2));
  const report = await runStagingRehearsal();
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
      `[staging-rehearsal] ${error instanceof Error ? error.message : String(error)}`
    );
    process.exitCode = 1;
  });
}
