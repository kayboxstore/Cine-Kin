import { Hono } from "hono";
import type { Context } from "hono";
import { bodyLimit } from "hono/body-limit";
import { secureHeaders } from "hono/secure-headers";
import { rateLimiter } from "hono-rate-limiter";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { env } from "./lib/env";
import { createOAuthCallbackHandler } from "./kimi/auth";
import { Paths } from "@contracts/constants";

const app = new Hono<{ Bindings: HttpBindings }>();

// Extract the client IP used as the rate-limiter key: the first
// X-Forwarded-For entry when behind a proxy, otherwise the socket address.
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

// Rate limiting on the tRPC API via hono-rate-limiter. Default in-memory
// store (per process); a shared store (e.g. Redis) would be required behind
// multiple instances.
app.use(
  "/api/trpc/*",
  rateLimiter<{ Bindings: HttpBindings }>({
    windowMs: 60_000, // 1 minute
    limit: 100, // max requests per IP per window
    standardHeaders: "draft-6",
    keyGenerator: getClientIp,
  }),
);

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
