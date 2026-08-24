import { spawn, spawnSync } from "node:child_process";
import { chmod, writeFile } from "node:fs/promises";
import path from "node:path";

const SAFE_ENVIRONMENT_KEYS = [
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
];

export function sanitizedCommandEnvironment(extra = {}) {
  return {
    ...Object.fromEntries(
      SAFE_ENVIRONMENT_KEYS.flatMap(key =>
        process.env[key] === undefined ? [] : [[key, process.env[key]]]
      )
    ),
    ...extra,
  };
}

function optionValue(value) {
  const normalized = String(value ?? "");
  if ([...normalized].some(character => character.charCodeAt(0) < 32)) {
    throw new Error(
      "Valeur MySQL non sûre dans le fichier d’options temporaire."
    );
  }
  return `"${normalized.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

export function mysqlDefaultsFile(target) {
  const local = ["localhost", "127.0.0.1"].includes(target.host);
  return [
    "[client]",
    "protocol=TCP",
    `host=${optionValue(target.host)}`,
    `port=${target.port}`,
    `user=${optionValue(target.options.user)}`,
    `password=${optionValue(target.options.password)}`,
    "default-character-set=utf8mb4",
    ...(local ? [] : ["ssl-mode=VERIFY_IDENTITY"]),
    "",
  ].join("\n");
}

export async function writeMysqlDefaultsFile(directory, name, target) {
  const filePath = path.join(directory, `${name}.cnf`);
  await writeFile(filePath, mysqlDefaultsFile(target), { mode: 0o600 });
  await chmod(filePath, 0o600);
  return filePath;
}

export function assertMysqlCommand(command, label) {
  const result = spawnSync(command, ["--version"], {
    encoding: "utf8",
    env: sanitizedCommandEnvironment(),
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.error?.code === "ENOENT") {
    throw new Error(
      `${label} est introuvable. Installez le client officiel MySQL 8 avant la répétition.`
    );
  }
  if (result.status !== 0) {
    throw new Error(`${label} --version a échoué.`);
  }
}

export function spawnMysqlCommand(command, args, stdio) {
  return spawn(command, args, {
    env: sanitizedCommandEnvironment(),
    shell: false,
    stdio,
  });
}

export function mysqlError(stderr) {
  const sanitized = stderr
    .replace(/mysql:\/\/[^\s]+/gi, "mysql://[masqué]")
    .replace(/password\s*=\s*[^\s]+/gi, "password=[masqué]")
    .trim();
  return sanitized.slice(0, 2_000);
}
