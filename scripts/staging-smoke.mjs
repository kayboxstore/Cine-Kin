import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function stagingOrigin(rawUrl) {
  if (!rawUrl) throw new Error("STAGING_BASE_URL est obligatoire.");
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("STAGING_BASE_URL n’est pas une URL valide.");
  }
  if (url.protocol !== "https:") {
    throw new Error("STAGING_BASE_URL doit utiliser HTTPS.");
  }
  if (
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      "STAGING_BASE_URL doit être une origine sans identifiants, chemin, query ou fragment."
    );
  }
  return url.origin;
}

async function request(fetchImplementation, origin, pathname, accept) {
  return fetchImplementation(new URL(pathname, origin), {
    headers: { accept },
    redirect: "manual",
    signal: AbortSignal.timeout(10_000),
  });
}

function securityHeaderErrors(response) {
  const errors = [];
  const csp = response.headers.get("content-security-policy") ?? "";
  if (!csp.includes("script-src 'self'")) {
    errors.push("CSP script-src absente ou inattendue.");
  }
  if (csp.includes("script-src 'self' 'unsafe-inline'")) {
    errors.push("CSP script-src autorise encore unsafe-inline.");
  }
  if (response.headers.get("x-content-type-options") !== "nosniff") {
    errors.push("X-Content-Type-Options=nosniff absent.");
  }
  return errors;
}

export async function runStagingSmoke(
  rawUrl,
  fetchImplementation = globalThis.fetch
) {
  const origin = stagingOrigin(rawUrl);
  const checks = [];

  async function check(name, operation) {
    try {
      const errors = await operation();
      checks.push({ name, ok: errors.length === 0, errors });
    } catch (error) {
      checks.push({
        name,
        ok: false,
        errors: [error instanceof Error ? error.message : String(error)],
      });
    }
  }

  await check("page d’accueil", async () => {
    const response = await request(
      fetchImplementation,
      origin,
      "/",
      "text/html"
    );
    const errors = [];
    if (response.status !== 200)
      errors.push(`HTTP ${response.status} au lieu de 200.`);
    if (!(response.headers.get("content-type") ?? "").includes("text/html")) {
      errors.push("Content-Type HTML absent.");
    }
    return errors;
  });

  await check("page de connexion", async () => {
    const response = await request(
      fetchImplementation,
      origin,
      "/login",
      "text/html"
    );
    return response.status === 200
      ? []
      : [`HTTP ${response.status} au lieu de 200.`];
  });

  await check("vivacité et en-têtes", async () => {
    const response = await request(
      fetchImplementation,
      origin,
      "/api/health/live",
      "application/json"
    );
    const errors = [];
    if (response.status !== 200)
      errors.push(`HTTP ${response.status} au lieu de 200.`);
    const body = await response.json();
    if (body.ok !== true)
      errors.push("La sonde de vivacité ne retourne pas ok=true.");
    if (!/^[0-9a-f-]{36}$/i.test(response.headers.get("x-request-id") ?? "")) {
      errors.push("X-Request-ID absent ou invalide.");
    }
    if (response.headers.get("cache-control") !== "no-store") {
      errors.push("Cache-Control=no-store absent.");
    }
    errors.push(...securityHeaderErrors(response));
    return errors;
  });

  await check("disponibilité MySQL", async () => {
    const response = await request(
      fetchImplementation,
      origin,
      "/api/health/ready",
      "application/json"
    );
    const errors = [];
    const body = await response.json();
    if (response.status !== 200)
      errors.push(`HTTP ${response.status} au lieu de 200.`);
    if (body.ok !== true || body.checks?.database !== "up") {
      errors.push("La readiness ne confirme pas database=up.");
    }
    return errors;
  });

  await check("statut OAuth", async () => {
    const response = await request(
      fetchImplementation,
      origin,
      "/api/oauth/status",
      "application/json"
    );
    const errors = [];
    const body = await response.json();
    if (response.status !== 200)
      errors.push(`HTTP ${response.status} au lieu de 200.`);
    if (typeof body.enabled !== "boolean") {
      errors.push("Le statut OAuth n’expose pas un booléen enabled.");
    }
    if (Object.keys(body).some(key => key !== "enabled")) {
      errors.push(
        "Le statut OAuth expose des champs supplémentaires inattendus."
      );
    }
    return errors;
  });

  await check("404 HTML réelle", async () => {
    const response = await request(
      fetchImplementation,
      origin,
      "/__cine_kin_staging_unknown__",
      "text/html"
    );
    const errors = [];
    if (response.status !== 404)
      errors.push(`HTTP ${response.status} au lieu de 404.`);
    if (!(response.headers.get("content-type") ?? "").includes("text/html")) {
      errors.push("La 404 navigateur ne retourne pas de HTML.");
    }
    return errors;
  });

  await check("404 API réelle", async () => {
    const response = await request(
      fetchImplementation,
      origin,
      "/api/__cine_kin_staging_unknown__",
      "application/json"
    );
    const errors = [];
    if (response.status !== 404)
      errors.push(`HTTP ${response.status} au lieu de 404.`);
    const body = await response.json();
    if (body.error !== "Not Found") errors.push("La 404 API est inattendue.");
    return errors;
  });

  return {
    origin,
    ok: checks.every(checkResult => checkResult.ok),
    checks,
  };
}

async function main() {
  const report = await runStagingSmoke(process.env.STAGING_BASE_URL);
  if (process.argv.includes("--json"))
    console.log(JSON.stringify(report, null, 2));
  else {
    for (const check of report.checks) {
      console.log(`${check.ok ? "✓" : "✗"} ${check.name}`);
      for (const error of check.errors) console.error(`  - ${error}`);
    }
  }
  if (!report.ok) process.exitCode = 1;
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) ===
    path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  main().catch(error => {
    console.error(
      `[staging-smoke] ${error instanceof Error ? error.message : String(error)}`
    );
    process.exitCode = 1;
  });
}
