import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value && process.env.NODE_ENV === "production") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value ?? "";
}

export const env = {
  appSecret: required("APP_SECRET"),
  isProduction: process.env.NODE_ENV === "production",
  databaseUrl: required("DATABASE_URL"),
  // Kimi OAuth is optional: the admin panel also supports a password-based
  // login (ADMIN_PASSWORD), so a deployment without Kimi credentials must
  // still boot. These stay empty when unset rather than throwing at startup;
  // the OAuth code paths check for them before use.
  appId: process.env.APP_ID ?? "",
  kimiAuthUrl: process.env.KIMI_AUTH_URL ?? "",
  kimiOpenUrl: process.env.KIMI_OPEN_URL ?? "",
  ownerUnionId: process.env.OWNER_UNION_ID ?? "",
  // Key material for encrypting Xtream credentials at rest. Prefer a dedicated
  // ENCRYPTION_KEY; falls back to APP_SECRET so the feature works out of the box.
  encryptionKey: process.env.ENCRYPTION_KEY || process.env.APP_SECRET || "",
  // Password-based admin login (alternative to Kimi OAuth). When set, an admin
  // can sign in to /admin with this password. Empty disables that path.
  adminPassword: process.env.ADMIN_PASSWORD ?? "",
};
