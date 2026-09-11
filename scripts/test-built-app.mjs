import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import { createServer } from "node:net";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { once } from "node:events";
import { sanitizedCommandEnvironment } from "./lib/mysql-cli.mjs";
import { projectRoot } from "./lib/migration-database.mjs";

const modulePath = fileURLToPath(import.meta.url);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

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
  if (child.exitCode !== null || child.signalCode !== null) return;
  child.kill("SIGTERM");
  await Promise.race([once(child, "exit"), delay(2_000)]);
  if (child.exitCode === null && child.signalCode === null) {
    child.kill("SIGKILL");
    await once(child, "exit");
  }
}

async function request(origin, pathname, accept = "text/html") {
  return fetch(new URL(pathname, origin), {
    headers: { accept },
    redirect: "manual",
    signal: AbortSignal.timeout(5_000),
  });
}

async function waitForServer(origin, child, stderr) {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null || child.signalCode !== null) {
      throw new Error(
        `Le serveur E2E s’est arrêté avant les contrôles : ${stderr().trim()}`
      );
    }
    try {
      const response = await request(
        origin,
        "/api/health/live",
        "application/json"
      );
      if (response.status === 200) return;
    } catch {
      // Le socket peut être brièvement indisponible pendant le démarrage.
    }
    await delay(100);
  }
  throw new Error("Le serveur E2E n’a pas démarré dans les 10 secondes.");
}

function sitemapPaths(source) {
  return [...source.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    match => new URL(match[1]).pathname
  );
}

function htmlAttribute(tag, name) {
  return tag.match(new RegExp(`\\b${name}=["']([^"']*)["']`, "i"))?.[1];
}

function metadataContent(html, selectorName, selectorValue) {
  for (const [tag] of html.matchAll(/<meta\b[^>]*>/gi)) {
    if (htmlAttribute(tag, selectorName) === selectorValue) {
      return htmlAttribute(tag, "content");
    }
  }
  return undefined;
}

function canonicalHref(html) {
  for (const [tag] of html.matchAll(/<link\b[^>]*>/gi)) {
    if (htmlAttribute(tag, "rel") === "canonical") {
      return htmlAttribute(tag, "href");
    }
  }
  return undefined;
}

export async function runBuiltAppE2e() {
  const entrypoint = path.join(projectRoot, "dist", "boot.js");
  await access(entrypoint);
  const port = await availablePort();
  const origin = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, [entrypoint], {
    cwd: projectRoot,
    env: sanitizedCommandEnvironment({
      NODE_ENV: "test",
      PORT: String(port),
      DATABASE_CONNECT_TIMEOUT_MS: "1000",
      RATE_LIMIT_STORE: "memory",
      TRUST_PROXY: "false",
    }),
    shell: false,
    stdio: ["ignore", "pipe", "pipe"],
  });
  const stdout = outputCollector(child.stdout);
  const stderr = outputCollector(child.stderr);
  const completedChecks = [];

  async function check(name, operation) {
    await operation();
    completedChecks.push(name);
  }

  try {
    await waitForServer(origin, child, stderr);

    let sitemap = "";
    await check("sitemap publié", async () => {
      const response = await request(origin, "/sitemap.xml", "application/xml");
      sitemap = await response.text();
      assert(
        response.status === 200,
        `Le sitemap retourne HTTP ${response.status}.`
      );
      assert(
        (response.headers.get("content-type") ?? "").includes("xml"),
        "Le sitemap ne retourne pas du XML."
      );
    });
    const publicPaths = [...new Set(sitemapPaths(sitemap))];
    assert(publicPaths.length >= 10, "Le sitemap public paraît incomplet.");

    await check("routes publiques du sitemap", async () => {
      for (const pathname of publicPaths) {
        const response = await request(origin, pathname);
        assert(
          response.status === 200,
          `${pathname} retourne HTTP ${response.status}.`
        );
        assert(
          (response.headers.get("content-type") ?? "").includes("text/html"),
          `${pathname} ne retourne pas du HTML.`
        );
      }
    });

    await check("entrées privées de la SPA", async () => {
      for (const pathname of [
        "/admin",
        "/espace-client",
        "/login",
        "/revendeur",
      ]) {
        const response = await request(origin, pathname);
        assert(
          response.status === 200,
          `${pathname} retourne HTTP ${response.status}.`
        );
      }
    });

    let homeHtml = "";
    await check("shell HTML et assets versionnés", async () => {
      const home = await request(origin, "/");
      homeHtml = await home.text();
      assert(home.status === 200, `L’accueil retourne HTTP ${home.status}.`);
      assert(
        homeHtml.toLowerCase().includes("<!doctype html>"),
        "Doctype HTML absent."
      );
      const assetPaths = [
        ...homeHtml.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g),
      ].map(match => match[1]);
      assert(
        assetPaths.length >= 2,
        "Les assets Vite versionnés sont absents du shell."
      );
      for (const assetPath of new Set(assetPaths)) {
        const asset = await request(origin, assetPath, "*/*");
        assert(
          asset.status === 200,
          `${assetPath} retourne HTTP ${asset.status}.`
        );
        assert(
          (await asset.arrayBuffer()).byteLength > 0,
          `${assetPath} est vide.`
        );
      }
    });

    await check("métadonnées publiques cohérentes", async () => {
      const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
        match => new URL(match[1])
      );
      assert(sitemapUrls.length > 0, "Le sitemap ne contient aucune URL.");
      const siteOrigin = sitemapUrls[0].origin;
      assert(
        sitemapUrls.every(url => url.origin === siteOrigin),
        "Le sitemap mélange plusieurs domaines."
      );
      assert(
        new URL(siteOrigin).protocol === "https:",
        "Le domaine public du sitemap n’utilise pas HTTPS."
      );

      const robotsResponse = await request(origin, "/robots.txt", "text/plain");
      const robots = await robotsResponse.text();
      assert(
        robotsResponse.status === 200,
        `robots.txt retourne HTTP ${robotsResponse.status}.`
      );
      assert(
        robots.includes(`Sitemap: ${siteOrigin}/sitemap.xml`),
        "robots.txt et sitemap n’utilisent pas le même domaine."
      );
      assert(
        metadataContent(homeHtml, "property", "og:url") === siteOrigin,
        "L’URL Open Graph ne correspond pas au sitemap."
      );
      assert(
        metadataContent(homeHtml, "name", "twitter:url") === siteOrigin,
        "L’URL Twitter ne correspond pas au sitemap."
      );
      assert(
        canonicalHref(homeHtml) === `${siteOrigin}/`,
        "L’URL canonicale ne correspond pas au sitemap."
      );
      for (const property of ["og:image", "twitter:image"]) {
        const selectorName = property === "og:image" ? "property" : "name";
        assert(
          metadataContent(homeHtml, selectorName, property)?.startsWith(
            `${siteOrigin}/`
          ),
          `L’image ${property} ne correspond pas au domaine public.`
        );
      }
    });

    await check("PWA publiée", async () => {
      const [manifest, worker] = await Promise.all([
        request(origin, "/manifest.json", "application/json"),
        request(origin, "/service-worker.js", "application/javascript"),
      ]);
      assert(
        manifest.status === 200,
        `Le manifeste retourne HTTP ${manifest.status}.`
      );
      assert(
        worker.status === 200,
        `Le service worker retourne HTTP ${worker.status}.`
      );
      const manifestBody = await manifest.json();
      assert(manifestBody.name === "Ciné Kin Premium", "Nom PWA inattendu.");
      assert(
        (await worker.text()).includes("networkFirst"),
        "Service worker inattendu."
      );
    });

    await check("vivacité et en-têtes de sécurité", async () => {
      const response = await request(
        origin,
        "/api/health/live",
        "application/json"
      );
      const body = await response.json();
      assert(response.status === 200 && body.ok === true, "Vivacité en échec.");
      assert(
        response.headers.get("cache-control") === "no-store",
        "Cache live non neutralisé."
      );
      assert(
        response.headers.get("x-content-type-options") === "nosniff",
        "nosniff absent."
      );
      assert(
        response.headers.get("x-frame-options") === "SAMEORIGIN",
        "X-Frame-Options absent."
      );
      assert(
        (response.headers.get("content-security-policy") ?? "").includes(
          "script-src 'self'"
        ),
        "CSP script-src inattendue."
      );
      assert(
        /^[0-9a-f-]{36}$/i.test(response.headers.get("x-request-id") ?? ""),
        "X-Request-ID absent ou invalide."
      );
    });

    await check("readiness sans fuite lorsque MySQL est absent", async () => {
      const response = await request(
        origin,
        "/api/health/ready",
        "application/json"
      );
      const body = await response.json();
      assert(
        response.status === 503,
        `La readiness retourne HTTP ${response.status}.`
      );
      assert(
        body.ok === false && body.checks?.database === "down",
        "Readiness inattendue."
      );
      const serialized = JSON.stringify(body);
      assert(
        !/ECONN|mysql|password|stack/i.test(serialized),
        "La readiness divulgue une erreur interne."
      );
    });

    await check("statut OAuth minimal", async () => {
      const response = await request(
        origin,
        "/api/oauth/status",
        "application/json"
      );
      const body = await response.json();
      assert(
        response.status === 200,
        `OAuth status retourne HTTP ${response.status}.`
      );
      assert(
        JSON.stringify(body) === '{"enabled":false}',
        "Le statut OAuth expose trop d’informations."
      );
    });

    await check("404 réelles HTML et API", async () => {
      const [html, api, unknownArticle] = await Promise.all([
        request(origin, "/__cine_kin_e2e_unknown__"),
        request(origin, "/api/__cine_kin_e2e_unknown__", "application/json"),
        request(origin, "/blog/999"),
      ]);
      assert(html.status === 404, `La 404 HTML retourne HTTP ${html.status}.`);
      assert(api.status === 404, `La 404 API retourne HTTP ${api.status}.`);
      assert(
        unknownArticle.status === 404,
        `L’article inconnu retourne HTTP ${unknownArticle.status}.`
      );
      assert(
        (await html.text()).toLowerCase().includes("<!doctype html>"),
        "La 404 HTML est vide."
      );
      assert(
        (await api.json()).error === "Not Found",
        "La 404 API est inattendue."
      );
    });

    return {
      checks: completedChecks,
      origin,
      publicRoutes: publicPaths.length,
    };
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
    await stopProcess(child);
  }
}

async function main() {
  const report = await runBuiltAppE2e();
  console.log(
    `✓ E2E build public : ${report.checks.length} groupes, ${report.publicRoutes} routes sitemap.`
  );
}

if (path.resolve(process.argv[1] ?? "") === path.resolve(modulePath)) {
  main().catch(error => {
    console.error(
      `[e2e:public] ${error instanceof Error ? error.message : String(error)}`
    );
    process.exitCode = 1;
  });
}
