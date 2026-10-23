import { describe, expect, it } from "vitest";
import {
  parseStagingArguments,
  safeStagingReport,
  validateStagingEnvironment,
} from "./lib/staging-safety.mjs";
import { runStagingRehearsal } from "./staging-rehearsal.mjs";

function validEnvironment() {
  return {
    STAGING_ENVIRONMENT: "staging",
    STAGING_DATABASE_URL:
      "mysql://staging_user:source-password@db.example/cinekin_staging",
    STAGING_RESTORE_DATABASE_URL:
      "mysql://restore_user:restore-password@db.example/cinekin_restore_validation",
    STAGING_BACKUP_PASSPHRASE:
      "backup-passphrase-0123456789-ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    STAGING_REHEARSAL_ALLOW_APPLY: "0",
    STAGING_BASE_URL: "https://staging.cine-kin.example",
    SESSION_SECRET: "session-key-0123456789-ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    ENCRYPTION_KEY: "encryption-key-0123456789-ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    ADMIN_PASSWORD: "staging-admin-password-strong",
    APP_BASE_URL: "https://staging.cine-kin.example",
    VITE_SITE_URL: "https://staging.cine-kin.example",
    RATE_LIMIT_STORE: "database",
    TRUST_PROXY: "true",
    TRUST_PROXY_HOPS: "1",
    KIMI_OAUTH_PKCE: "true",
  };
}

const confirmations = [
  "--confirm-source",
  "cinekin_staging",
  "--confirm-restore",
  "cinekin_restore_validation",
];

describe("staging argument and environment guards", () => {
  it("parses explicit source, restore and apply confirmations", () => {
    expect(
      parseStagingArguments([
        ...confirmations,
        "--apply",
        "--adopt-legacy",
        "--json",
      ])
    ).toEqual({
      adoptLegacy: true,
      apply: true,
      confirmRestore: "cinekin_restore_validation",
      confirmSource: "cinekin_staging",
      json: true,
    });
    expect(() => parseStagingArguments(["--force"])).toThrow("Option inconnue");
    expect(() => parseStagingArguments(["--confirm-source", "--json"])).toThrow(
      "attend le nom exact"
    );
  });

  it("accepts a complete dry-run configuration without exposing credentials", () => {
    const validation = validateStagingEnvironment(
      validEnvironment(),
      parseStagingArguments(confirmations)
    );
    expect(validation.ok).toBe(true);
    const safe = safeStagingReport(validation);
    expect(safe.source).toEqual({
      database: "cinekin_staging",
      host: "db.example",
      port: 3306,
    });
    expect(JSON.stringify(safe)).not.toContain("source-password");
    expect(JSON.stringify(safe)).not.toContain("backup-passphrase");
  });

  it("refuses an unconfirmed, non-isolated or non-gated write target", () => {
    const environment = validEnvironment();
    environment.STAGING_RESTORE_DATABASE_URL =
      "mysql://restore_user:restore-password@db.example/cinekin_staging";
    const options = parseStagingArguments([
      "--confirm-source",
      "cinekin_staging",
      "--confirm-restore",
      "cinekin_staging",
      "--apply",
    ]);
    const validation = validateStagingEnvironment(environment, options);
    expect(validation.ok).toBe(false);
    expect(validation.errors.join(" ")).toContain("restauration doit contenir");
    expect(validation.errors.join(" ")).toContain(
      "doivent porter des noms distincts"
    );
    expect(validation.errors.join(" ")).toContain(
      "STAGING_REHEARSAL_ALLOW_APPLY=1"
    );
  });

  it("rejects reused secrets, mismatched origins and missing admin access", () => {
    const environment = validEnvironment();
    environment.ENCRYPTION_KEY = environment.SESSION_SECRET;
    environment.VITE_SITE_URL = "https://other.example";
    environment.ADMIN_PASSWORD = "";
    const validation = validateStagingEnvironment(
      environment,
      parseStagingArguments(confirmations)
    );
    expect(validation.ok).toBe(false);
    const errors = validation.errors.join(" ");
    expect(errors).toContain("doivent être distincts");
    expect(errors).toContain("doivent utiliser la même origine");
    expect(errors).toContain("ADMIN_PASSWORD ou un OAuth Kimi complet");
  });

  it("rejects database names outside the strict client-safe format", () => {
    const environment = validEnvironment();
    environment.STAGING_RESTORE_DATABASE_URL =
      "mysql://restore_user:restore-password@db.example/restore%20validation";
    const validation = validateStagingEnvironment(
      environment,
      parseStagingArguments([
        "--confirm-source",
        "cinekin_staging",
        "--confirm-restore",
        "restore validation",
      ])
    );
    expect(validation.ok).toBe(false);
    expect(validation.errors.join(" ")).toContain("nom de base MySQL simple");
  });

  it("rejects same-named targets across host aliases and exposed backup paths", () => {
    const environment = validEnvironment();
    environment.STAGING_DATABASE_URL =
      "mysql://source_user:source-password@source.example/cinekin_restore_validation";
    environment.STAGING_RESTORE_DATABASE_URL =
      "mysql://restore_user:restore-password@restore.example/cinekin_restore_validation";
    environment.STAGING_BACKUP_DIR = "public/staging-backups";
    const validation = validateStagingEnvironment(
      environment,
      parseStagingArguments([
        "--confirm-source",
        "cinekin_restore_validation",
        "--confirm-restore",
        "cinekin_restore_validation",
      ])
    );
    const errors = validation.errors.join(" ");
    expect(validation.ok).toBe(false);
    expect(errors).toContain("doivent porter des noms distincts");
    expect(errors).toContain("STAGING_BACKUP_DIR");
  });

  it("never starts a rehearsal without the explicit apply flag", async () => {
    const report = await runStagingRehearsal(confirmations, validEnvironment());
    expect(report.ok).toBe(false);
    expect(report.completed).toBe(false);
    expect(report.errors[0]).toContain("ajoutez --apply");
  });
});
