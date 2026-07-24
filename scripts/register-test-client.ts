import "dotenv/config";
import { eq } from "drizzle-orm";
import { getDb } from "../api/queries/connection";
import { appClients, type InsertAppClient } from "../db/schema";
import { hashSecret } from "../api/lib/crypto";
import { normalizeMac, computeExpiry, type LicenseType } from "../api/lib/app-license";

// Seed / update a test app-client so the client portal (/espace-client) can be
// tested with a known MAC + PIN. Mirrors app.registerDevice (scrypt-hashed PIN).
//
//   npx tsx scripts/register-test-client.ts [MAC] [PIN] [12_months|unlimited]
//
// Examples:
//   npx tsx scripts/register-test-client.ts                       # defaults, no licence (Essai badge)
//   npx tsx scripts/register-test-client.ts 00:1A:2B:3C:4D:5E 123456
//   npx tsx scripts/register-test-client.ts 00:1A:2B:3C:4D:5E 123456 12_months

const macArg = process.argv[2] ?? "00:1A:2B:3C:4D:5E";
const pinArg = process.argv[3] ?? "123456";
const licenseArg = process.argv[4] as LicenseType | undefined;

async function main() {
  const db = getDb();
  const mac = normalizeMac(macArg);
  const now = new Date();

  const values: InsertAppClient = {
    mac,
    pinHash: hashSecret(pinArg),
    name: "Client de test",
  };

  if (licenseArg === "12_months" || licenseArg === "unlimited") {
    values.licenseType = licenseArg;
    values.activatedByType = "admin";
    values.activatedAt = now;
    values.expiresAt = computeExpiry(licenseArg, now);
  }

  const existing = (
    await db.select().from(appClients).where(eq(appClients.mac, mac)).limit(1)
  ).at(0);

  if (existing) {
    await db.update(appClients).set(values).where(eq(appClients.id, existing.id));
    console.log(`✓ Client mis à jour (id ${existing.id})`);
  } else {
    await db.insert(appClients).values(values);
    console.log("✓ Client créé");
  }

  console.log("--------------------------------------------------");
  console.log(`  Connexion /espace-client`);
  console.log(`  MAC : ${macArg}`);
  console.log(`  PIN : ${pinArg}`);
  console.log(`  Licence : ${licenseArg ?? "aucune (mode Essai)"}`);
  console.log("--------------------------------------------------");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
