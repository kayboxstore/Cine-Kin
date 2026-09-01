import { createHash } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseAdoptionArguments } from "./adopt-migration-baseline.mjs";
import {
  analyzeMacRows,
  assessTrackedState,
  auditLedger,
  compareSchema,
  databaseTarget,
  loadMigrationDefinitions,
} from "./lib/migration-database.mjs";
import {
  mysqlDefaultsFile,
  sanitizedCommandEnvironment,
} from "./lib/mysql-cli.mjs";

function inspectionFromSnapshot(snapshot) {
  const columnRows = [];
  const indexRows = [];
  const tableNames = new Set(Object.keys(snapshot.tables));
  for (const [tableName, table] of Object.entries(snapshot.tables)) {
    for (const column of Object.values(table.columns)) {
      columnRows.push({
        tableName,
        columnName: column.name,
        columnType: column.type === "serial" ? "bigint unsigned" : column.type,
        isNullable: column.notNull ? "NO" : "YES",
        extra: column.autoincrement ? "auto_increment" : "",
      });
    }
    for (const constraint of Object.values(table.compositePrimaryKeys ?? {})) {
      constraint.columns.forEach((columnName, index) => {
        indexRows.push({
          tableName,
          indexName: "PRIMARY",
          nonUnique: 0,
          sequence: index + 1,
          columnName,
        });
      });
    }
    for (const constraint of Object.values(table.uniqueConstraints ?? {})) {
      constraint.columns.forEach((columnName, index) => {
        indexRows.push({
          tableName,
          indexName: constraint.name,
          nonUnique: 0,
          sequence: index + 1,
          columnName,
        });
      });
    }
    for (const expectedIndex of Object.values(table.indexes ?? {})) {
      expectedIndex.columns.forEach((columnName, index) => {
        indexRows.push({
          tableName,
          indexName: expectedIndex.name,
          nonUnique: expectedIndex.isUnique ? 0 : 1,
          sequence: index + 1,
          columnName,
        });
      });
    }
  }
  return { columnRows, indexRows, tableNames };
}

describe("verified MySQL TLS", () => {
  it("loads the protected CA while keeping certificate verification enabled", async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), "cinekin-aiven-ca-"));
    const caPath = path.join(directory, "ca.pem");
    const certificate =
      "-----BEGIN CERTIFICATE-----\\ntest-ca\\n-----END CERTIFICATE-----\\n";
    await writeFile(caPath, certificate, { mode: 0o600 });

    try {
      const target = databaseTarget(
        "mysql://reader:secret@mysql.example.test:3306/cinekin",
        { sslCaPath: caPath }
      );
      expect(target.options.ssl).toEqual({
        ca: certificate,
        minVersion: "TLSv1.2",
        rejectUnauthorized: true,
      });
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });

  it("passes the same CA to mysql and mysqldump with identity verification", () => {
    const defaults = mysqlDefaultsFile(
      {
        host: "mysql.example.test",
        port: 3306,
        options: { password: "secret", user: "reader" },
      },
      "/runner/temp/aiven ca.pem"
    );
    expect(defaults).toContain("ssl-mode=VERIFY_IDENTITY");
    expect(defaults).toContain('ssl-ca="/runner/temp/aiven ca.pem"');
  });

  it("preserves the CA variables for nested migration processes", () => {
    const previousMysqlCa = process.env.MYSQL_SSL_CA;
    const previousNodeCa = process.env.NODE_EXTRA_CA_CERTS;
    process.env.MYSQL_SSL_CA = "/runner/temp/aiven-ca.pem";
    process.env.NODE_EXTRA_CA_CERTS = "/runner/temp/aiven-ca.pem";

    try {
      expect(sanitizedCommandEnvironment()).toMatchObject({
        MYSQL_SSL_CA: "/runner/temp/aiven-ca.pem",
        NODE_EXTRA_CA_CERTS: "/runner/temp/aiven-ca.pem",
      });
    } finally {
      if (previousMysqlCa === undefined) delete process.env.MYSQL_SSL_CA;
      else process.env.MYSQL_SSL_CA = previousMysqlCa;
      if (previousNodeCa === undefined) delete process.env.NODE_EXTRA_CA_CERTS;
      else process.env.NODE_EXTRA_CA_CERTS = previousNodeCa;
    }
  });
});

describe("migration history", () => {
  it("contains the baseline and every versioned security migration", async () => {
    const definitions = await loadMigrationDefinitions();
    const securityDataMigration = definitions.all[1];
    const rateLimitMigration = definitions.all[2];
    const revocationMigration = definitions.all[3];
    const resellerManagementMigration = definitions.all[4];

    expect(definitions.all).toHaveLength(5);
    expect(Object.keys(definitions.baseline.snapshot.tables)).toHaveLength(7);
    expect(Object.keys(securityDataMigration.snapshot.tables)).toHaveLength(8);
    expect(Object.keys(definitions.current.snapshot.tables)).toHaveLength(11);
    expect(definitions.baseline.hash).toMatch(/^[a-f0-9]{64}$/);
    expect(securityDataMigration.sql).toContain(
      "Solde historique repris lors de la migration"
    );
    expect(securityDataMigration.sql).toContain("claimed_at");
    expect(rateLimitMigration.sql).toContain("rate_limit_counters");
    expect(revocationMigration.sql).toContain("revoked_auth_sessions");
    expect(resellerManagementMigration.sql).toContain(
      "reseller_admin_audit_log"
    );
    expect(resellerManagementMigration.sql).toContain("is_active");
    expect(resellerManagementMigration.sql).toContain("session_epoch");
  });

  it("accepts the exact LF and CRLF hashes of the same migration SQL", async () => {
    const definitions = await loadMigrationDefinitions();
    const prefix = definitions.all.slice(0, 3);
    const latestDefinition = prefix.at(-1);
    const inspection = inspectionFromSnapshot(latestDefinition.snapshot);
    inspection.migrationHistory = prefix.map((definition, index) => ({
      id: index + 1,
      hash: createHash("sha256")
        .update(
          definition.sql.replace(/\\r\\n/g, "\\n").replace(/\\n/g, "\\r\\n")
        )
        .digest("hex"),
      createdAt: definition.entry.when,
    }));

    expect(assessTrackedState(definitions, inspection)).toMatchObject({
      errors: [],
      state: "tracked",
    });
    for (const definition of prefix) {
      expect(definition.hashes).toContain(definition.hash);
      expect(definition.hashes).toHaveLength(2);
    }
  });

  it("matches the generated current snapshot exactly", async () => {
    const { current } = await loadMigrationDefinitions();
    const inspection = inspectionFromSnapshot(current.snapshot);
    const activeColumn = inspection.columnRows.find(
      row => row.tableName === "resellers" && row.columnName === "is_active"
    );
    if (!activeColumn) throw new Error("Colonne is_active absente du snapshot");
    activeColumn.columnType = "tinyint(1)";
    expect(compareSchema(current.snapshot, inspection)).toEqual({
      errors: [],
      valid: true,
    });
    inspection.columnRows = inspection.columnRows.filter(
      row =>
        !(row.tableName === "app_clients" && row.columnName === "claimed_at")
    );
    expect(compareSchema(current.snapshot, inspection).valid).toBe(false);
  });

  it("rejects edited migration history and tracked schema drift", async () => {
    const definitions = await loadMigrationDefinitions();
    const inspection = inspectionFromSnapshot(definitions.current.snapshot);
    inspection.migrationHistory = definitions.all.map((definition, index) => ({
      id: index + 1,
      hash: definition.hash,
      createdAt: definition.entry.when,
    }));
    expect(assessTrackedState(definitions, inspection).state).toBe("tracked");

    inspection.migrationHistory[1].hash = "tampered";
    expect(assessTrackedState(definitions, inspection).state).toBe(
      "tracked-history-diverged"
    );
    inspection.migrationHistory[1].hash = definitions.all[1].hash;
    inspection.columnRows = inspection.columnRows.filter(
      row =>
        !(row.tableName === "app_clients" && row.columnName === "claimed_at")
    );
    expect(assessTrackedState(definitions, inspection).state).toBe(
      "tracked-schema-drift"
    );
  });
});

describe("baseline adoption guards", () => {
  it("parses dry-run and confirmed apply modes", () => {
    expect(parseAdoptionArguments([])).toEqual({
      apply: false,
      confirm: null,
      json: false,
    });
    expect(
      parseAdoptionArguments(["--apply", "--confirm", "cinekin", "--json"])
    ).toEqual({
      apply: true,
      confirm: "cinekin",
      json: true,
    });
    expect(() => parseAdoptionArguments(["--force"])).toThrow(
      "Option inconnue"
    );
    expect(() => parseAdoptionArguments(["--confirm", "--json"])).toThrow(
      "attend le nom exact"
    );
  });

  it("reports invalid, legacy and colliding MAC representations", () => {
    const result = analyzeMacRows([
      { id: 1, mac: "AA:BB:CC:DD:EE:FF" },
      { id: 2, mac: "aabbccddeeff" },
      { id: 3, mac: "not-a-mac" },
    ]);
    expect(result.legacyFormat).toHaveLength(2);
    expect(result.invalid).toEqual([{ id: 3, mac: "not-a-mac" }]);
    expect(result.collisions).toHaveLength(1);
  });
});

describe("credit ledger audit", () => {
  it("accepts a continuous balance chain", () => {
    expect(
      auditLedger(
        [{ id: 4, credits: 6 }],
        [
          {
            id: 1,
            resellerId: 4,
            delta: 7,
            balanceAfter: 7,
            entryType: "initial_grant",
          },
          {
            id: 2,
            resellerId: 4,
            delta: -1,
            balanceAfter: 6,
            entryType: "activation",
          },
        ]
      )
    ).toEqual({ errors: [], valid: true });
  });

  it("rejects a ledger that diverges from the current balance", () => {
    const result = auditLedger(
      [{ id: 4, credits: 99 }],
      [
        {
          id: 1,
          resellerId: 4,
          delta: 7,
          balanceAfter: 7,
          entryType: "initial_grant",
        },
      ]
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      "Solde courant divergent pour le revendeur 4."
    );
  });
});
