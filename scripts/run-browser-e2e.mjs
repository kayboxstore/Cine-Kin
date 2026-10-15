import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import { createServer } from "node:net";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { once } from "node:events";
import { sanitizedCommandEnvironment } from "./lib/mysql-cli.mjs";
import { projectRoot } from "./lib/migration-database.mjs";

// Boots the real built server (dist/boot.js) against a real (disposable)
// MySQL — never the Vite dev server — then runs the Playwright suite against
// it, and always tears the server down afterwards. Mirrors the structure of
// test-built-app.mjs (used by `npm run e2e:public`), kept as a separate,
// independent entry point rather than sharing code, since the two exercise
// different concerns (static/public HTTP checks vs. a real authenticated
// browser session).

const modulePath = fileURLToPath(import.meta.url);

async function availablePort() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : null;
  await new Promise((resolve, reject) =>
    server.close(error => (error ? reject(error) : resolve()))
  );
  if (!port) throw new Error("Impossible de réserver un port E2E local.");
  return port;
}

function outputCollector(stream) {
  let output = "";
  stream?.on("data", chunk => {
    if (output.length < 64_000) output += chunk.toString("utf8");
  });
  return () => output;
}

async function stopProcess(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  child.kill("SIGTERM");
  await Promise.race([once(child, "exit"), delay(2_000)]);
  if (child.exitCode === null && child.signalCode === null) {
    child.kill("SIGKILL");
    await once(child, "exit");
  }
}

async function waitForServer(origin, child, stderr) {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null || child.signalCode !== null) {
      throw new Error(
        `Le serveur E2E navigateur s'est arrêté avant les contrôles : ${stderr().trim()}`
      );
    }
    try {
      const response = await fetch(new URL("/api/health/ready", origin), {
        headers: { accept: "application/json" },
        signal: AbortSignal.timeout(2_000),
      });
      if (response.status === 200) return;
    } catch {
      // Le socket ou la connexion MySQL peuvent être brièvement indisponibles
      // pendant le démarrage.
    }
    await delay(200);
  }
  throw new Error(
    "Le serveur E2E navigateur n'a pas atteint l'état « prêt » (MySQL) dans les 20 secondes."
  );
}

export async function runBrowserE2e() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL absente — requise pour l'E2E navigateur (base MySQL locale jetable, déjà migrée)."
    );
  }

  const entrypoint = path.join(projectRoot, "dist", "boot.js");
  await access(entrypoint);
  const port = await availablePort();
  const origin = `http://127.0.0.1:${port}`;
  const adminPassword =
    process.env.E2E_ADMIN_PASSWORD ?? "test-only-fake-admin-password";

  const serverChild = spawn(
    process.execPath,
    [entrypoint],
    {
      cwd: projectRoot,
      env: sanitizedCommandEnvironment({
        NODE_ENV: "production",
        PORT: String(port),
        DATABASE_URL: process.env.DATABASE_URL,
        SESSION_SECRET:
          process.env.SESSION_SECRET ?? "test-only-fake-session-secret-0123456789",
        ENCRYPTION_KEY:
          process.env.ENCRYPTION_KEY ?? "test-only-fake-encryption-key-0123456789",
        ADMIN_PASSWORD: adminPassword,
        DATABASE_CONNECT_TIMEOUT_MS: "5000",
        RATE_LIMIT_STORE: "memory",
        TRUST_PROXY: "false",
      }),
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
    }
  );
  const stdout = outputCollector(serverChild.stdout);
  const stderr = outputCollector(serverChild.stderr);

  let playwrightChild;
  try {
    await waitForServer(origin, serverChild, stderr);

    const playwrightBin = path.join(
      projectRoot,
      "node_modules",
      ".bin",
      "playwright"
    );
    playwrightChild = spawn(playwrightBin, ["test"], {
      cwd: projectRoot,
      env: sanitizedCommandEnvironment({
        E2E_BASE_URL: origin,
        E2E_ADMIN_PASSWORD: adminPassword,
        CI: process.env.CI ?? "",
        ...(process.env.PLAYWRIGHT_BROWSERS_PATH
          ? { PLAYWRIGHT_BROWSERS_PATH: process.env.PLAYWRIGHT_BROWSERS_PATH }
          : {}),
        ...(process.env.PLAYWRIGHT_CHROMIUM_PATH
          ? { PLAYWRIGHT_CHROMIUM_PATH: process.env.PLAYWRIGHT_CHROMIUM_PATH }
          : {}),
      }),
      shell: false,
      stdio: "inherit",
    });
    const [exitCode] = await once(playwrightChild, "exit");
    if (exitCode !== 0) {
      throw new Error(`Playwright a échoué (code de sortie ${exitCode}).`);
    }
  } catch (error) {
    const diagnostics = [stdout().trim(), stderr().trim()]
      .filter(Boolean)
      .join("\n");
    if (diagnostics) {
      throw new Error(
        `${error instanceof Error ? error.message : String(error)}\nDiagnostics serveur :\n${diagnostics.slice(-8_000)}`
      );
    }
    throw error;
  } finally {
    await stopProcess(playwrightChild);
    await stopProcess(serverChild);
  }
}

async function main() {
  await runBrowserE2e();
  console.log("✓ E2E navigateur : suite Playwright exécutée avec succès.");
}

if (path.resolve(process.argv[1] ?? "") === path.resolve(modulePath)) {
  main().catch(error => {
    console.error(
      `[e2e:browser] ${error instanceof Error ? error.message : String(error)}`
    );
    process.exitCode = 1;
  });
}
