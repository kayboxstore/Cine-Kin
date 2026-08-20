import { Hono } from "hono";
import type { Context } from "hono";
import { bodyLimit } from "hono/body-limit";
import { secureHeaders } from "hono/secure-headers";
import { rateLimiter } from "hono-rate-limiter";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { createOAuthCallbackHandler } from "./kimi/auth";
import { Paths } from "@contracts/constants";
import {
  hasAllowedOrigin,
  isSensitiveTrpcBatch,
  isSensitiveTrpcRequest,
  sensitiveProcedureKey,
} from "./lib/trpc-security";

// The Hono application, with no server binding. Two entry points import it:
//   - server/boot.ts  → attaches @hono/node-server for a persistent Node host
//     (npm start / the esbuild bundle).
//   - server/index.ts → wraps it with hono/vercel as a single Vercel Serverless
//     Function.
const app = new Hono<{ Bindings: HttpBindings }>();

// Extract the client IP used as the rate-limiter key: the first
// X-Forwarded-For entry when behind a proxy, otherwise the socket address.
function getClientIp(c: Context<{ Bindings: HttpBindings }>): string {
  const xff = c.req.header("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return c.env?.incoming?.socket?.remoteAddress ?? "unknown";
}

// Security headers on every response (X-Frame-Options, nosniff, HSTS,
// Referrer-Policy, …) plus a tailored Content-Security-Policy that
// allow-lists exactly the external origins the app actually uses and
// nothing else:
//   - Google Fonts  → styles from fonts.googleapis.com, files from fonts.gstatic.com
//   - Google Analytics → gtag from googletagmanager.com, beacons to *.google-analytics.com
//   - external avatar images (user.avatar from the Kimi profile) → img-src https:
//
// NOTE: index.html ships three inline <script> blocks (GA config, the
// Kimi-widget cleanup IIFE, the font `onload` handler) and the app relies on
// inline `style` attributes (React/Framer Motion), so script-src/style-src
// must keep 'unsafe-inline'. Replacing that with nonces/hashes requires
// editing index.html — recommended as a follow-up hardening step.
//
// No CORS middleware exists: the frontend and the tRPC API are served from
// the same origin, so there is no CORS/secureHeaders ordering concern.
app.use(
  secureHeaders({
    contentSecurityPolicy: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://www.googletagmanager.com",
      ],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: [
        "'self'",
        "https://www.googletagmanager.com",
        "https://www.google-analytics.com",
        "https://*.google-analytics.com",
        "https://*.analytics.google.com",
      ],
    },
  })
);

// tRPC carries JSON only; there is no upload endpoint. Keeping this small
// limits memory pressure before input validation.
app.use(bodyLimit({ maxSize: 1024 * 1024 }));

app.use("/api/trpc/*", async (c, next) => {
  if (c.req.method !== "GET" && c.req.method !== "POST") return next();
  if (!hasAllowedOrigin(c.req.raw.headers, c.req.url)) {
    return c.json({ error: "Origine de requête non autorisée." }, 403);
  }
  return next();
});

// A single tRPC HTTP batch used to execute many password guesses while the
// HTTP rate limiter counted only one request. Sensitive public procedures must
// therefore use the non-batched transport.
app.use("/api/trpc/*", async (c, next) => {
  if (isSensitiveTrpcBatch(c.req.url)) {
    return c.json(
      {
        error:
          "Le batching tRPC est interdit pour les opérations d'authentification.",
      },
      400
    );
  }
  return next();
});

// Dedicated protection for public authentication/device procedures. It is
// deliberately stricter than the general API quota. The bundled store is
// process-local; a shared store will replace it in the infrastructure round so
// several serverless instances enforce one global counter.
app.use(
  "/api/trpc/*",
  rateLimiter<{ Bindings: HttpBindings }>({
    windowMs: 15 * 60_000,
    limit: 10,
    standardHeaders: "draft-6",
    requestPropertyName: "authRateLimit",
    requestStorePropertyName: "authRateLimitStore",
    skip: c => !isSensitiveTrpcRequest(c.req.url),
    keyGenerator: c => `${getClientIp(c)}:${sensitiveProcedureKey(c.req.url)}`,
    message: { error: "Trop de tentatives. Réessayez dans 15 minutes." },
  })
);

// Rate limiting on the tRPC API via hono-rate-limiter. Default in-memory
// store (per process / per serverless instance); a shared store (e.g. Redis)
// would be required to enforce a global limit across multiple instances.
app.use(
  "/api/trpc/*",
  rateLimiter<{ Bindings: HttpBindings }>({
    windowMs: 60_000, // 1 minute
    limit: 100, // max requests per IP per window
    standardHeaders: "draft-6",
    keyGenerator: getClientIp,
  })
);

app.get(Paths.oauthCallback, createOAuthCallbackHandler());
app.use("/api/trpc/*", async c => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});
app.all("/api/*", c => c.json({ error: "Not Found" }, 404));

export default app;
