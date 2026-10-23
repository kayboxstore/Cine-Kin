import type { Hono } from "hono";
import type { HttpBindings } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import fs from "fs";
import path from "path";

type App = Hono<{
  Bindings: HttpBindings;
  Variables: { requestId: string };
}>;

const SPA_ROUTES = new Set([
  "/",
  "/a-propos",
  "/admin",
  "/blog",
  "/commande",
  "/conditions",
  "/contact",
  "/espace-client",
  "/faq",
  "/login",
  "/mentions-legales",
  "/offres",
  "/paiement",
  "/politique-confidentialite",
  "/revendeur",
  "/revendeurs",
  "/status",
  "/support",
  "/tutoriels",
]);

export function isKnownSpaRoute(pathname: string): boolean {
  const normalized =
    pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname;
  return SPA_ROUTES.has(normalized) || /^\/blog\/[1-6]$/.test(normalized);
}

export function serveStaticFiles(app: App) {
  const distPath = path.resolve(import.meta.dirname, "../dist/public");

  app.use("*", serveStatic({ root: "./dist/public" }));

  app.notFound(c => {
    const accept = c.req.header("accept") ?? "";
    if (!accept.includes("text/html")) {
      return c.json({ error: "Not Found" }, 404);
    }
    const indexPath = path.resolve(distPath, "index.html");
    const content = fs.readFileSync(indexPath, "utf-8");
    return c.html(
      content,
      isKnownSpaRoute(new URL(c.req.url).pathname) ? 200 : 404
    );
  });
}
