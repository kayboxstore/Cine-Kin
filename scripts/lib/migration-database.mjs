import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
export const projectRoot = path.resolve(moduleDirectory, "../..");
export const migrationsDirectory = path.join(projectRoot, "db", "migrations");

export const BASELINE_TAG = "0000_baseline";

function normalizedType(value) {
  const normalized = value.toLowerCase().replace(/\s+/g, "");
  // MySQL reports the BOOLEAN alias as TINYINT(1) in information_schema,
  // while Drizzle records it as `boolean` in snapshots.
  return normalized === "boolean" ? "tinyint(1)" : normalized;
}

function expectedColumnType(value) {
  return value === "serial" ? "bigint unsigned" : value;
}

function sameColumns(left, right) {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

function numberValue(value) {
  return typeof value === "bigint" ? Number(value) : Number(value ?? 0);
}

export function databaseTarget(
  rawUrl = process.env.DATABASE_URL,
  { sslCaPath = process.env.MYSQL_SSL_CA } = {}
) {
  if (!rawUrl) {
    throw new Error("DATABASE_URL est obligatoire pour cette opération.");
  }

  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("DATABASE_URL n'est pas une URL MySQL valide.");
  }
  if (url.protocol !== "mysql:") {
    throw new Error("DATABASE_URL doit utiliser le protocole mysql://.");
  }

  const database = decodeURIComponent(url.pathname.replace(/^\//, ""));
  if (!database) {
    throw new Error("DATABASE_URL doit contenir le nom de la base.");
  }

  const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  const caPath = String(sslCaPath ?? "").trim();
  const ssl = isLocal
    ? undefined
    : {
        minVersion: "TLSv1.2",
        rejectUnauthorized: true,
        ...(caPath ? { ca: readFileSync(caPath, "utf8") } : {}),
      };
  return {
    rawUrl,
    host: url.hostname,
    port: url.port ? Number(url.port) : 3306,
    database,
    options: {
      host: url.hostname,
      port: url.port ? Number(url.port) : 3306,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database,
      ...(ssl ? { ssl } : {}),
    },
  };
}

export async function openDatabase(
  rawUrl = process.env.DATABASE_URL,
  databaseOverride
) {
  const target = databaseTarget(rawUrl);
  const options = {
    ...target.options,
    ...(databaseOverride === undefined ? {} : { database: databaseOverride }),
  };
  return {
    target: {
      ...target,
      database: databaseOverride ?? target.database,
    },
    connection: await mysql.createConnection(options),
  };
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

export async function loadMigrationDefinition(tag) {
  const journal = await readJson(
    path.join(migrationsDirectory, "meta", "_journal.json")
  );
  const entry = journal.entries.find(candidate => candidate.tag === tag);
  if (!entry) {
    throw new Error(`Migration introuvable dans le journal : ${tag}`);
  }

  const prefix = String(entry.idx).padStart(4, "0");
  const sqlPath = path.join(migrationsDirectory, `${entry.tag}.sql`);
  const sql = await readFile(sqlPath, "utf8");
  const snapshot = await readJson(
    path.join(migrationsDirectory, "meta", `${prefix}_snapshot.json`)
  );
  return {
    entry,
    hash: createHash("sha256").update(sql).digest("hex"),
    snapshot,
    sql,
    sqlPath,
  };
}

export async function loadMigrationDefinitions() {
  const journal = await readJson(
    path.join(migrationsDirectory, "meta", "_journal.json")
  );
  const all = await Promise.all(
    journal.entries.map(entry => loadMigrationDefinition(entry.tag))
  );
  const baseline = all.find(
    definition => definition.entry.tag === BASELINE_TAG
  );
  const current = all.at(-1);
  if (!baseline || !current) {
    throw new Error("Historique de migrations incomplet.");
  }
  return { all, baseline, current };
}

export async function inspectDatabase(connection, database) {
  const [columnRows] = await connection.execute(
    `SELECT TABLE_NAME AS tableName,
            COLUMN_NAME AS columnName,
            COLUMN_TYPE AS columnType,
            IS_NULLABLE AS isNullable,
            EXTRA AS extra
       FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ?
      ORDER BY TABLE_NAME, ORDINAL_POSITION`,
    [database]
  );
  const [indexRows] = await connection.execute(
    `SELECT TABLE_NAME AS tableName,
            INDEX_NAME AS indexName,
            NON_UNIQUE AS nonUnique,
            SEQ_IN_INDEX AS sequence,
            COLUMN_NAME AS columnName
       FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = ?
      ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX`,
    [database]
  );

  const tableNames = new Set(columnRows.map(row => row.tableName));
  const columnsByTable = new Map();
  for (const row of columnRows) {
    const columns = columnsByTable.get(row.tableName) ?? new Set();
    columns.add(row.columnName);
    columnsByTable.set(row.tableName, columns);
  }
  const hasColumns = (tableName, ...columnNames) => {
    const columns = columnsByTable.get(tableName) ?? new Set();
    return columnNames.every(columnName => columns.has(columnName));
  };

  let migrationHistory = [];
  let migrationHistoryMalformed = false;
  if (tableNames.has("__drizzle_migrations")) {
    if (hasColumns("__drizzle_migrations", "id", "hash", "created_at")) {
      const [rows] = await connection.query(
        "SELECT id, hash, created_at AS createdAt FROM `__drizzle_migrations` ORDER BY created_at, id"
      );
      migrationHistory = rows;
    } else {
      migrationHistoryMalformed = true;
    }
  }

  let appClientRows = [];
  let appClientSummary = null;
  if (tableNames.has("app_clients")) {
    if (hasColumns("app_clients", "id", "mac")) {
      [appClientRows] = await connection.query(
        "SELECT id, mac FROM `app_clients` ORDER BY id"
      );
    }
    const summaryExpressions = ["COUNT(*) AS total"];
    if (hasColumns("app_clients", "pin_hash")) {
      summaryExpressions.push("SUM(pin_hash IS NOT NULL) AS withPin");
    }
    if (hasColumns("app_clients", "claimed_at")) {
      summaryExpressions.push(
        "SUM(claimed_at IS NOT NULL) AS claimed",
        "SUM(claimed_at IS NULL) AS pendingVerification"
      );
    }
    if (hasColumns("app_clients", "claim_code_hash")) {
      summaryExpressions.push(
        "SUM(claim_code_hash IS NOT NULL) AS pendingClaimCode"
      );
    }
    const [rows] = await connection.query(
      `SELECT ${summaryExpressions.join(", ")} FROM app_clients`
    );
    appClientSummary = Object.fromEntries(
      Object.entries(rows[0]).map(([key, value]) => [key, numberValue(value)])
    );
  }

  let resellerRows = [];
  if (hasColumns("resellers", "id", "credits")) {
    [resellerRows] = await connection.query(
      "SELECT id, credits FROM `resellers` ORDER BY id"
    );
  }

  let ledgerRows = [];
  if (
    hasColumns(
      "reseller_credit_ledger",
      "id",
      "reseller_id",
      "delta",
      "balance_after",
      "entry_type",
      "activation_id",
      "actor_type",
      "reason",
      "created_at"
    )
  ) {
    [ledgerRows] = await connection.query(
      `SELECT id,
              reseller_id AS resellerId,
              delta,
              balance_after AS balanceAfter,
              entry_type AS entryType,
              activation_id AS activationId,
              actor_type AS actorType,
              reason,
              created_at AS createdAt
         FROM reseller_credit_ledger
        ORDER BY reseller_id, id`
    );
  }

  return {
    appClientRows,
    appClientSummary,
    columnRows,
    indexRows,
    ledgerRows,
    migrationHistory,
    migrationHistoryMalformed,
    resellerRows,
    tableNames,
  };
}

function indexMap(indexRows) {
  const indexes = new Map();
  for (const row of indexRows) {
    const key = `${row.tableName}:${row.indexName}`;
    const current = indexes.get(key) ?? {
      columns: [],
      name: row.indexName,
      nonUnique: numberValue(row.nonUnique),
      tableName: row.tableName,
    };
    current.columns.push(row.columnName);
    indexes.set(key, current);
  }
  return indexes;
}

export function compareSchema(snapshot, inspection, { strict = true } = {}) {
  const errors = [];
  const expectedTableNames = new Set(Object.keys(snapshot.tables));
  const actualTableNames = new Set(
    [...inspection.tableNames].filter(
      tableName => tableName !== "__drizzle_migrations"
    )
  );
  const actualColumns = new Map(
    inspection.columnRows.map(row => [
      `${row.tableName}:${row.columnName}`,
      row,
    ])
  );
  const actualIndexes = indexMap(inspection.indexRows);

  for (const tableName of expectedTableNames) {
    if (!actualTableNames.has(tableName)) {
      errors.push(`Table manquante : ${tableName}`);
      continue;
    }

    const table = snapshot.tables[tableName];
    const expectedColumnNames = new Set(Object.keys(table.columns));
    for (const column of Object.values(table.columns)) {
      const actual = actualColumns.get(`${tableName}:${column.name}`);
      if (!actual) {
        errors.push(`Colonne manquante : ${tableName}.${column.name}`);
        continue;
      }

      const expectedType = normalizedType(expectedColumnType(column.type));
      const actualType = normalizedType(actual.columnType);
      if (expectedType !== actualType) {
        errors.push(
          `Type inattendu pour ${tableName}.${column.name} : ${actual.columnType} au lieu de ${expectedColumnType(column.type)}`
        );
      }
      const actualNotNull = actual.isNullable === "NO";
      if (actualNotNull !== Boolean(column.notNull)) {
        errors.push(`Nullabilité inattendue pour ${tableName}.${column.name}.`);
      }
      const actualAutoIncrement = String(actual.extra)
        .toLowerCase()
        .includes("auto_increment");
      if (actualAutoIncrement !== Boolean(column.autoincrement)) {
        errors.push(
          `Auto-incrément inattendu pour ${tableName}.${column.name}.`
        );
      }
    }

    if (strict) {
      for (const row of inspection.columnRows.filter(
        candidate => candidate.tableName === tableName
      )) {
        if (!expectedColumnNames.has(row.columnName)) {
          errors.push(`Colonne inattendue : ${tableName}.${row.columnName}`);
        }
      }
    }

    for (const constraint of Object.values(table.uniqueConstraints ?? {})) {
      const matches = [...actualIndexes.values()].some(
        index =>
          index.tableName === tableName &&
          index.nonUnique === 0 &&
          sameColumns(index.columns, constraint.columns)
      );
      if (!matches) {
        errors.push(
          `Contrainte unique manquante : ${tableName}(${constraint.columns.join(", ")})`
        );
      }
    }

    for (const constraint of Object.values(table.compositePrimaryKeys ?? {})) {
      const primary = actualIndexes.get(`${tableName}:PRIMARY`);
      if (!primary || !sameColumns(primary.columns, constraint.columns)) {
        errors.push(
          `Clé primaire inattendue : ${tableName}(${constraint.columns.join(", ")})`
        );
      }
    }

    for (const expectedIndex of Object.values(table.indexes ?? {})) {
      const actualIndex = actualIndexes.get(
        `${tableName}:${expectedIndex.name}`
      );
      if (
        !actualIndex ||
        !sameColumns(actualIndex.columns, expectedIndex.columns) ||
        actualIndex.nonUnique !== (expectedIndex.isUnique ? 0 : 1)
      ) {
        errors.push(`Index manquant ou divergent : ${expectedIndex.name}`);
      }
    }
  }

  if (strict) {
    for (const tableName of actualTableNames) {
      if (!expectedTableNames.has(tableName)) {
        errors.push(`Table inattendue : ${tableName}`);
      }
    }
  }

  return { errors, valid: errors.length === 0 };
}

export function canonicalMac(value) {
  const input = String(value ?? "").trim();
  if (
    !/^(?:[0-9a-f]{12}|[0-9a-f]{2}(?::[0-9a-f]{2}){5}|[0-9a-f]{2}(?:-[0-9a-f]{2}){5})$/i.test(
      input
    )
  ) {
    return null;
  }
  return input.replace(/[:-]/g, "").toLowerCase().match(/.{2}/g).join(":");
}

export function analyzeMacRows(rows) {
  const invalid = [];
  const legacyFormat = [];
  const byCanonical = new Map();
  for (const row of rows) {
    const canonical = canonicalMac(row.mac);
    if (!canonical) {
      invalid.push({ id: numberValue(row.id), mac: row.mac });
      continue;
    }
    if (row.mac !== canonical) {
      legacyFormat.push({ id: numberValue(row.id), mac: row.mac, canonical });
    }
    const group = byCanonical.get(canonical) ?? [];
    group.push({ id: numberValue(row.id), mac: row.mac });
    byCanonical.set(canonical, group);
  }
  const collisions = [...byCanonical.entries()]
    .filter(([, group]) => group.length > 1)
    .map(([canonical, rowsForMac]) => ({ canonical, rows: rowsForMac }));
  return { collisions, invalid, legacyFormat };
}

export function assessTrackedState(definitions, inspection) {
  const errors = [];
  const history = inspection.migrationHistory;
  const latestCreatedAt = Number(history.at(-1)?.createdAt);
  const expectedPrefix = definitions.all.filter(
    definition => definition.entry.when <= latestCreatedAt
  );

  if (history.length !== expectedPrefix.length) {
    errors.push(
      "L'historique enregistré n'est pas un préfixe complet du journal local."
    );
  }
  for (const row of history) {
    const definition = definitions.all.find(
      candidate => candidate.entry.when === Number(row.createdAt)
    );
    if (!definition) {
      errors.push(`Migration inconnue enregistrée à ${row.createdAt}.`);
    } else if (definition.hash !== row.hash) {
      errors.push(`Empreinte divergente pour ${definition.entry.tag}.`);
    }
  }
  if (errors.length > 0) {
    return { errors, state: "tracked-history-diverged" };
  }

  const latestDefinition = expectedPrefix.at(-1);
  if (!latestDefinition) {
    return {
      errors: [
        "Aucune migration locale ne correspond à l'historique enregistré.",
      ],
      state: "tracked-history-diverged",
    };
  }
  const comparison = compareSchema(latestDefinition.snapshot, inspection);
  if (!comparison.valid) {
    return {
      comparison,
      errors: comparison.errors,
      latestDefinition,
      state: "tracked-schema-drift",
    };
  }
  return { comparison, errors: [], latestDefinition, state: "tracked" };
}

export async function classifyMigrationState(connection, database) {
  const definitions = await loadMigrationDefinitions();
  const inspection = await inspectDatabase(connection, database);
  const applicationTables = [...inspection.tableNames].filter(
    tableName => tableName !== "__drizzle_migrations"
  );

  if (inspection.migrationHistoryMalformed) {
    return {
      definitions,
      errors: ["La table __drizzle_migrations est incomplète ou incompatible."],
      inspection,
      state: "tracked-history-diverged",
    };
  }
  if (applicationTables.length === 0) {
    return { definitions, inspection, state: "empty" };
  }
  if (inspection.migrationHistory.length > 0) {
    return {
      definitions,
      inspection,
      ...assessTrackedState(definitions, inspection),
    };
  }

  const baselineComparison = compareSchema(
    definitions.baseline.snapshot,
    inspection
  );
  if (baselineComparison.valid) {
    return {
      baselineComparison,
      definitions,
      inspection,
      state: "legacy-untracked",
    };
  }

  const currentComparison = compareSchema(
    definitions.current.snapshot,
    inspection
  );
  if (currentComparison.valid) {
    return {
      currentComparison,
      definitions,
      inspection,
      state: "current-untracked",
    };
  }

  return {
    baselineComparison,
    currentComparison,
    definitions,
    inspection,
    state: "incompatible",
  };
}

export async function adoptBaseline(
  connection,
  database,
  { apply = false } = {}
) {
  const result = await classifyMigrationState(connection, database);
  if (result.state !== "legacy-untracked") {
    throw new Error(
      `Adoption refusée : état de base « ${result.state} » au lieu de « legacy-untracked ».`
    );
  }
  if (!apply) return result;

  const { baseline } = result.definitions;
  await connection.query(
    `CREATE TABLE IF NOT EXISTS \`__drizzle_migrations\` (
       \`id\` serial PRIMARY KEY,
       \`hash\` text NOT NULL,
       \`created_at\` bigint
     )`
  );
  await connection.beginTransaction();
  try {
    const [existingRows] = await connection.query(
      "SELECT id FROM `__drizzle_migrations` FOR UPDATE"
    );
    if (existingRows.length > 0) {
      throw new Error(
        "Une migration a été enregistrée pendant l'adoption ; aucune écriture ajoutée."
      );
    }
    await connection.execute(
      "INSERT INTO `__drizzle_migrations` (`hash`, `created_at`) VALUES (?, ?)",
      [baseline.hash, baseline.entry.when]
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  }
  return result;
}

export function auditLedger(resellerRows, ledgerRows) {
  const errors = [];
  const rowsByReseller = new Map();
  const activationIds = new Set();

  for (const row of ledgerRows) {
    const resellerId = numberValue(row.resellerId);
    const group = rowsByReseller.get(resellerId) ?? [];
    group.push(row);
    rowsByReseller.set(resellerId, group);

    if (row.activationId != null) {
      const activationId = numberValue(row.activationId);
      if (activationIds.has(activationId)) {
        errors.push(
          `Activation ${activationId} débitée plusieurs fois dans le registre.`
        );
      }
      activationIds.add(activationId);
    }
  }

  for (const reseller of resellerRows) {
    const resellerId = numberValue(reseller.id);
    const entries = rowsByReseller.get(resellerId) ?? [];
    if (entries.length === 0) {
      errors.push(`Revendeur ${resellerId} sans écriture de crédit.`);
      continue;
    }

    let previousBalance = 0;
    for (const [index, entry] of entries.entries()) {
      const expectedBalance = previousBalance + numberValue(entry.delta);
      const actualBalance = numberValue(entry.balanceAfter);
      if (actualBalance !== expectedBalance) {
        errors.push(
          `Chaîne de solde invalide pour le revendeur ${resellerId}, écriture ${numberValue(entry.id)}.`
        );
      }
      previousBalance = actualBalance;
      if (index === 0 && entry.entryType !== "initial_grant") {
        errors.push(
          `Première écriture non initiale pour le revendeur ${resellerId}.`
        );
      }
    }
    if (previousBalance !== numberValue(reseller.credits)) {
      errors.push(`Solde courant divergent pour le revendeur ${resellerId}.`);
    }
  }

  for (const resellerId of rowsByReseller.keys()) {
    if (!resellerRows.some(row => numberValue(row.id) === resellerId)) {
      errors.push(`Écritures orphelines pour le revendeur ${resellerId}.`);
    }
  }

  return { errors, valid: errors.length === 0 };
}
