import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  int,
  bigint,
  boolean,
  index,
  uniqueIndex,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Orders table for IPTV subscriptions
export const orders = mysqlTable("orders", {
  id: serial("id").primaryKey(),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  customerEmail: varchar("customer_email", { length: 320 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 50 }).notNull(),
  planId: varchar("plan_id", { length: 50 }).notNull(),
  planName: varchar("plan_name", { length: 255 }).notNull(),
  planType: mysqlEnum("plan_type", ["client", "reseller"])
    .default("client")
    .notNull(),
  price: varchar("price", { length: 50 }).notNull(),
  device: varchar("device", { length: 100 }),
  status: mysqlEnum("status", ["pending", "active", "expired", "cancelled"])
    .default("pending")
    .notNull(),
  activationCode: varchar("activation_code", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

// Customers table for IPTV clients
export const customers = mysqlTable("customers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  device: varchar("device", { length: 100 }),
  planId: varchar("plan_id", { length: 50 }).notNull(),
  planName: varchar("plan_name", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["active", "expired", "suspended"])
    .default("active")
    .notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;

// ---------------------------------------------------------------------------
// Ciné-Kin APPLICATION licence system (distinct from the IPTV subscription
// tables above). A device (TV/box) registers with a MAC + PIN, then gets an
// application licence activated by an admin (free) or a reseller (credits).
//
// NOTE on foreign keys: this schema targets PlanetScale, which does not use
// database-level FK constraints — like the existing tables, relationships are
// expressed as indexed bigint columns and wired for query-time joins in
// db/relations.ts. All secrets (PINs, passwords) are stored hashed, never in
// clear; Xtream credentials are encrypted at rest (see api/lib/crypto.ts).
// ---------------------------------------------------------------------------

// A client of the application licence — one physical device, keyed by MAC.
export const appClients = mysqlTable("app_clients", {
  id: serial("id").primaryKey(),
  // Unique + indexed device identifier.
  mac: varchar("mac", { length: 64 }).notNull().unique(),
  // Connection PIN, hashed (scrypt). Nullable: an admin/reseller may activate a
  // MAC before the device has ever registered and claimed its PIN.
  pinHash: varchar("pin_hash", { length: 255 }),
  // One-time proof issued by an admin/reseller for a pre-activated device.
  // Only its scrypt hash is stored; the plaintext is displayed once.
  claimCodeHash: varchar("claim_code_hash", { length: 255 }),
  claimCodeExpiresAt: timestamp("claim_code_expires_at"),
  // Set only after successful one-time-code verification. A device that merely
  // self-registered a MAC is not trusted until this timestamp exists.
  claimedAt: timestamp("claimed_at"),
  name: varchar("name", { length: 255 }),
  // Unique when set; MySQL allows multiple NULLs so unregistered devices are fine.
  email: varchar("email", { length: 320 }).unique(),
  // null = registered but not yet activated.
  licenseType: mysqlEnum("license_type", ["12_months", "unlimited"]),
  activatedByType: mysqlEnum("activated_by_type", ["admin", "reseller"]),
  activatedByResellerId: bigint("activated_by_reseller_id", {
    mode: "number",
    unsigned: true,
  }),
  activatedAt: timestamp("activated_at"),
  // null for 'unlimited' (and while inactive).
  expiresAt: timestamp("expires_at"),
  // Parental-control PIN (4 digits), hashed, distinct from the login PIN.
  parentalControlPinHash: varchar("parental_control_pin_hash", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AppClient = typeof appClients.$inferSelect;
export type InsertAppClient = typeof appClients.$inferInsert;

// Reseller accounts — authenticate separately from admins and clients.
export const resellers = mysqlTable("resellers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  contact: varchar("contact", { length: 255 }),
  username: varchar("username", { length: 100 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  // Incremented on suspension so a cookie issued before the suspension can
  // never become valid again after a later reactivation.
  sessionEpoch: int("session_epoch", { unsigned: true }).default(0).notNull(),
  credits: int("credits").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Reseller = typeof resellers.$inferSelect;
export type InsertReseller = typeof resellers.$inferInsert;

// Persistent audit trail for sensitive reseller administration. Passwords and
// password hashes must never be written here; metadata contains only the names
// of changed fields or the resulting account status.
export const resellerAdminAuditLog = mysqlTable(
  "reseller_admin_audit_log",
  {
    id: serial("id").primaryKey(),
    resellerId: bigint("reseller_id", {
      mode: "number",
      unsigned: true,
    }).notNull(),
    actorUserId: bigint("actor_user_id", {
      mode: "number",
      unsigned: true,
    }).notNull(),
    action: mysqlEnum("action", [
      "profile_update",
      "password_reset",
      "status_change",
    ]).notNull(),
    reason: varchar("reason", { length: 255 }).notNull(),
    metadata: text("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  table => [
    index("reseller_admin_audit_reseller_created_idx").on(
      table.resellerId,
      table.createdAt
    ),
  ]
);

export type ResellerAdminAuditEntry = typeof resellerAdminAuditLog.$inferSelect;
export type InsertResellerAdminAuditEntry =
  typeof resellerAdminAuditLog.$inferInsert;

// Shared counters for authentication/API rate limiting. Keys are SHA-256
// digests, so raw IP addresses and procedure names are not persisted.
export const rateLimitCounters = mysqlTable(
  "rate_limit_counters",
  {
    key: varchar("counter_key", { length: 64 }).primaryKey(),
    hits: int("hits", { unsigned: true }).notNull(),
    resetAt: timestamp("reset_at", { fsp: 3 }).notNull(),
  },
  table => [index("rate_limit_reset_idx").on(table.resetAt)]
);

export type RateLimitCounter = typeof rateLimitCounters.$inferSelect;

// Immutable financial ledger. The reseller.credits column is the current
// balance; every mutation of that balance must append exactly one row here in
// the same database transaction.
export const resellerCreditLedger = mysqlTable(
  "reseller_credit_ledger",
  {
    id: serial("id").primaryKey(),
    resellerId: bigint("reseller_id", {
      mode: "number",
      unsigned: true,
    }).notNull(),
    delta: int("delta").notNull(),
    balanceAfter: int("balance_after").notNull(),
    entryType: mysqlEnum("entry_type", [
      "initial_grant",
      "admin_grant",
      "activation",
      "refund",
      "adjustment",
    ]).notNull(),
    activationId: bigint("activation_id", { mode: "number", unsigned: true }),
    actorType: mysqlEnum("actor_type", [
      "admin",
      "reseller",
      "system",
    ]).notNull(),
    actorUserId: bigint("actor_user_id", { mode: "number", unsigned: true }),
    reason: varchar("reason", { length: 255 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  table => [
    index("credit_ledger_reseller_created_idx").on(
      table.resellerId,
      table.createdAt
    ),
    uniqueIndex("credit_ledger_activation_unique").on(table.activationId),
  ]
);

export type ResellerCreditLedgerEntry =
  typeof resellerCreditLedger.$inferSelect;
export type InsertResellerCreditLedgerEntry =
  typeof resellerCreditLedger.$inferInsert;

// Audit log — one row per activation/renewal.
export const activations = mysqlTable("activations", {
  id: serial("id").primaryKey(),
  appClientId: bigint("app_client_id", {
    mode: "number",
    unsigned: true,
  }).notNull(),
  // Denormalised MAC so history survives even if the client row changes.
  mac: varchar("mac", { length: 64 }).notNull(),
  licenseType: mysqlEnum("license_type", ["12_months", "unlimited"]).notNull(),
  // 0 when performed by an admin (free).
  creditsCharged: int("credits_charged").default(0).notNull(),
  activatedByType: mysqlEnum("activated_by_type", [
    "admin",
    "reseller",
  ]).notNull(),
  activatedByResellerId: bigint("activated_by_reseller_id", {
    mode: "number",
    unsigned: true,
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Activation = typeof activations.$inferSelect;
export type InsertActivation = typeof activations.$inferInsert;

// Playlists attached to a client.
export const playlists = mysqlTable("playlists", {
  id: serial("id").primaryKey(),
  appClientId: bigint("app_client_id", {
    mode: "number",
    unsigned: true,
  }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  format: mysqlEnum("format", ["m3u", "xtream"]).notNull(),
  source: mysqlEnum("source", ["cinekin", "external"]).notNull(),
  m3uUrl: text("m3u_url"),
  // Xtream credentials are stored ENCRYPTED at rest (AES-256-GCM).
  xtreamServerUrl: text("xtream_server_url"),
  xtreamUsername: text("xtream_username"),
  xtreamPassword: text("xtream_password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Playlist = typeof playlists.$inferSelect;
export type InsertPlaylist = typeof playlists.$inferInsert;

// Revocation list for the four stateless JWT session kinds (admin, client,
// reseller, kimi). Sessions are NOT recorded at login — only a token whose
// owner explicitly logged out gets a row here, keyed by its own `jti`. This
// is deliberately additive-only and denylist-based (not a full session
// table): no row here means simply "not revoked", not "valid" — a token
// still has to carry a valid `jti` and `exp` to be accepted at all, which
// the verification code enforces unconditionally regardless of this table
// (any signed token missing either is rejected outright, with no grace
// period). A row past its own `expires_at` is provably redundant (the
// JWT's own `exp` claim already rejects it) and safe to purge in bounded
// batches.
export const revokedAuthSessions = mysqlTable(
  "revoked_auth_sessions",
  {
    jti: varchar("jti", { length: 36 }).primaryKey(),
    sessionKind: mysqlEnum("session_kind", [
      "admin",
      "client",
      "reseller",
      "kimi",
    ]).notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    revokedAt: timestamp("revoked_at").defaultNow().notNull(),
  },
  table => [index("revoked_auth_sessions_expires_idx").on(table.expiresAt)]
);

export type RevokedAuthSession = typeof revokedAuthSessions.$inferSelect;
export type InsertRevokedAuthSession = typeof revokedAuthSessions.$inferInsert;
