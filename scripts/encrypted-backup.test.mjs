import { createWriteStream } from "node:fs";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import { afterEach, describe, expect, it } from "vitest";
import {
  decryptFileToWritable,
  encryptedBackupFormat,
  encryptReadableToFile,
  verifyEncryptedBackup,
} from "./lib/encrypted-backup.mjs";
import {
  mysqlDefaultsFile,
  sanitizedCommandEnvironment,
} from "./lib/mysql-cli.mjs";

const temporaryDirectories = [];
const passphrase = "backup-passphrase-0123456789-ABCDEFGHIJKLMNOPQRSTUVWXYZ";

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map(directory => rm(directory, { force: true, recursive: true }))
  );
});

describe("encrypted staging backups", () => {
  it("encrypts, fingerprints and authenticates a dump round trip", async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), "cine-kin-backup-"));
    temporaryDirectories.push(directory);
    const encrypted = path.join(directory, "backup.sql.ckbackup");
    const restored = path.join(directory, "restored.sql");
    const sql = "CREATE TABLE test (id int);\nINSERT INTO test VALUES (1);\n";

    const metadata = await encryptReadableToFile(
      Readable.from([sql]),
      encrypted,
      passphrase
    );
    expect(metadata.algorithm).toBe("aes-256-gcm+scrypt");
    expect(metadata.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(metadata.bytes).toBeGreaterThan(sql.length);
    expect((await readFile(encrypted)).includes(Buffer.from(sql))).toBe(false);

    await decryptFileToWritable(
      encrypted,
      createWriteStream(restored, { mode: 0o600 }),
      passphrase
    );
    expect(await readFile(restored, "utf8")).toBe(sql);
    expect((await stat(encrypted)).mode & 0o777).toBe(0o600);
    await expect(
      verifyEncryptedBackup(encrypted, passphrase)
    ).resolves.toBeUndefined();
  });

  it("rejects a wrong passphrase and a truncated file", async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), "cine-kin-backup-"));
    temporaryDirectories.push(directory);
    const encrypted = path.join(directory, "backup.sql.ckbackup");
    await encryptReadableToFile(
      Readable.from(["SELECT 1;\n"]),
      encrypted,
      passphrase
    );
    await expect(
      decryptFileToWritable(
        encrypted,
        createWriteStream(path.join(directory, "wrong.sql")),
        `${passphrase}-wrong`
      )
    ).rejects.toThrow();

    const truncated = path.join(directory, "truncated.ckbackup");
    await writeFile(truncated, Buffer.from(encryptedBackupFormat.magic));
    await expect(
      decryptFileToWritable(
        truncated,
        createWriteStream(path.join(directory, "truncated.sql")),
        passphrase
      )
    ).rejects.toThrow("tronquée ou vide");
  });

  it("refuses to overwrite an existing backup artifact", async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), "cine-kin-backup-"));
    temporaryDirectories.push(directory);
    const encrypted = path.join(directory, "backup.sql.ckbackup");
    await writeFile(encrypted, "existing", { mode: 0o600 });

    await expect(
      encryptReadableToFile(
        Readable.from(["SELECT 1;\n"]),
        encrypted,
        passphrase
      )
    ).rejects.toMatchObject({ code: "EEXIST" });
    expect(await readFile(encrypted, "utf8")).toBe("existing");
  });

  it("writes a TLS-verifying MySQL option file without placing credentials in argv", () => {
    const config = mysqlDefaultsFile({
      host: "db.example",
      port: 3306,
      options: { user: "staging", password: 'strong"password' },
    });
    expect(config).toContain("ssl-mode=VERIFY_IDENTITY");
    expect(config).toContain('password="strong\\"password"');
    expect(() =>
      mysqlDefaultsFile({
        host: "db.example",
        port: 3306,
        options: { user: "staging", password: "bad\npassword" },
      })
    ).toThrow("non sûre");
  });

  it("passes only an explicit allowlist of environment values to child tools", () => {
    const environment = sanitizedCommandEnvironment({ DATABASE_URL: "safe" });
    expect(environment.DATABASE_URL).toBe("safe");
    expect(Object.keys(environment)).toEqual(
      expect.arrayContaining(["DATABASE_URL"])
    );
    expect(
      Object.keys(environment).every(key =>
        [
          "DATABASE_URL",
          "HOME",
          "LANG",
          "LC_ALL",
          "PATH",
          "Path",
          "PATHEXT",
          "SystemRoot",
          "TEMP",
          "TMP",
          "TMPDIR",
          "WINDIR",
        ].includes(key)
      )
    ).toBe(true);
  });
});
