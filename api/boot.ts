import { Hono } from "hono";
import type { Context } from "hono";
import { bodyLimit } from "hono/body-limit";
import { secureHeaders } from "hono/secure-headers";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { env } from "./lib/env";
import { createOAuthCallbackHandler } from "./kimi/auth";
import { Paths } from "@contracts/constants";

const app = new Hono<{ Bindings: HttpBindings }>();

// ── Basic in-memory rate limiter (per IP, fixed window) ──────────
// No external dependency. Note: state is per-process, so behind
// multiple instances a shared store (Redis) would be required.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 100;
const rateLimitHits = new Map<string, { count: number; resetAt: number }>();

function getClientIp(c: Context<{ Bindings: HttpBindings }>): string {
  const xff = c.req.header("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return c.env?.incoming?.socket?.remoteAddress ?? "unknown";
}

// Security headers on every response (X-Frame-Options, nosniff, HSTS, …).
// A tailored Content-Security-Policy is intentionally left out for now:
// index.html ships inline scripts + external GA/fonts, so a strict CSP
// needs a nonce pass first (tracked for a later wave).
app.use(secureHeaders());

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));

app.use("/api/trpc/*", async (c, next) => {
  const ip = getClientIp(c);
  const now = Date.now();

  if (rateLimitHits.size > 10_000) {
    for (const [key, value] of rateLimitHits) {
      if (now > value.resetAt) rateLimitHits.delete(key);
    }
  }

  const entry = rateLimitHits.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitHits.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
  } else {
    entry.count++;
    if (entry.count > RATE_LIMIT_MAX) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      return c.json({ error: "Too Many Requests" }, 429, {
        "Retry-After": String(retryAfter),
      });
    }
  }

  return next();
});

app.get(Paths.oauthCallback, createOAuthCallbackHandler());
app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});
app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;

if (env.isProduction) {
  const { serve } = await import("@hono/node-server");
  const { serveStaticFiles } = await import("./lib/vite");
  serveStaticFiles(app);

  const port = parseInt(process.env.PORT || "3000");
  serve({ fetch: app.fetch, port }, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
