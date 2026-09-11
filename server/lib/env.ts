import "dotenv/config";

const isProduction = process.env.NODE_ENV === "production";

function required(name: string): string {
  const value = process.env[name];
  if (!value && isProduction) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value ?? "";
}

function dedicatedSecret(name: string, developmentFallback = ""): string {
  const value = process.env[name]?.trim();
  if (value) {
    if (isProduction && value.length < 32) {
      throw new Error(`${name} must contain at least 32 characters`);
    }
    return value;
  }
  if (!isProduction && developmentFallback) return developmentFallback;
  if (isProduction) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return "";
}

function booleanValue(
  value: string | undefined,
  defaultValue: boolean
): boolean {
  if (value === undefined || value === "") return defaultValue;
  return !["0", "false", "no", "off"].includes(value.toLowerCase());
}

function positiveInteger(name: string, defaultValue: number): number {
  const raw = process.env[name];
  if (!raw) return defaultValue;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${name} must be a positive integer`);
  }
  return value;
}

function rateLimitStore(): "memory" | "database" {
  const value = process.env.RATE_LIMIT_STORE?.trim().toLowerCase();
  if (!value) return isProduction ? "database" : "memory";
  if (value === "memory" || value === "database") return value;
  throw new Error("RATE_LIMIT_STORE must be either memory or database");
}

const oauthClientSecret = process.env.APP_SECRET?.trim() ?? "";
const sessionSigningSecret = dedicatedSecret(
  "SESSION_SECRET",
  oauthClientSecret
);
const dataEncryptionKey = dedicatedSecret("ENCRYPTION_KEY", oauthClientSecret);

if (isProduction) {
  const configuredSecrets = [
    oauthClientSecret,
    sessionSigningSecret,
    dataEncryptionKey,
  ].filter(Boolean);
  if (new Set(configuredSecrets).size !== configuredSecrets.length) {
    throw new Error(
      "APP_SECRET, SESSION_SECRET and ENCRYPTION_KEY must use distinct values"
    );
  }
}

export const env = {
  isProduction,
  databaseUrl: required("DATABASE_URL"),
  // Kimi OAuth is optional: the admin panel also supports a password-based
  // login (ADMIN_PASSWORD), so a deployment without Kimi credentials must
  // still boot. These stay empty when unset rather than throwing at startup;
  // the OAuth code paths check for them before use.
  appId: process.env.APP_ID ?? "",
  appSecret: oauthClientSecret,
  kimiAuthUrl: process.env.KIMI_AUTH_URL ?? "",
  kimiOpenUrl: process.env.KIMI_OPEN_URL ?? "",
  kimiTokenIssuer: process.env.KIMI_TOKEN_ISSUER ?? "",
  kimiOauthPkce: booleanValue(process.env.KIMI_OAUTH_PKCE, true),
  appBaseUrl: process.env.APP_BASE_URL ?? "",
  trustProxy: booleanValue(
    process.env.TRUST_PROXY,
    Boolean(process.env.VERCEL)
  ),
  trustProxyHops: positiveInteger("TRUST_PROXY_HOPS", 1),
  rateLimitStore: rateLimitStore(),
  databasePoolLimit: positiveInteger("DATABASE_POOL_LIMIT", 3),
  databaseConnectTimeoutMs: positiveInteger(
    "DATABASE_CONNECT_TIMEOUT_MS",
    10_000
  ),
  ownerUnionId: process.env.OWNER_UNION_ID ?? "",
  // OAuth client credentials, session signing, and data encryption deliberately
  // use distinct key material in production. Development/tests may fall back to
  // APP_SECRET to keep local setup lightweight.
  sessionSecret: sessionSigningSecret,
  encryptionKey: dataEncryptionKey,
  // Password-based admin login (alternative to Kimi OAuth). When set, an admin
  // can sign in to /admin with this password. Empty disables that path.
  adminPassword: process.env.ADMIN_PASSWORD ?? "",
};

export function isKimiOAuthConfigured(): boolean {
  return Boolean(
    env.appId &&
    env.appSecret &&
    env.kimiAuthUrl &&
    env.kimiOpenUrl &&
    (!env.isProduction || env.appBaseUrl)
  );
}
