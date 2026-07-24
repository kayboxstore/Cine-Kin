import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
  createCipheriv,
  createDecipheriv,
} from "node:crypto";
import { env } from "./env";

// ---------------------------------------------------------------------------
// Secret hashing (PINs, passwords) — scrypt with a per-secret random salt.
// Format: "scrypt$<saltHex>$<hashHex>". Never store or return the clear value.
// ---------------------------------------------------------------------------

const KEYLEN = 64;

export function hashSecret(plain: string): string {
  const salt = randomBytes(16);
  const derived = scryptSync(plain, salt, KEYLEN);
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}

export function verifySecret(plain: string, stored: string | null | undefined): boolean {
  if (!stored) return false;
  const [scheme, saltHex, hashHex] = stored.split("$");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const derived = scryptSync(plain, Buffer.from(saltHex, "hex"), expected.length);
  return expected.length === derived.length && timingSafeEqual(expected, derived);
}

// ---------------------------------------------------------------------------
// Symmetric encryption at rest (AES-256-GCM) — used for Xtream credentials.
// Format: "gcm$<ivHex>$<tagHex>$<cipherHex>". The 32-byte key is derived from
// ENCRYPTION_KEY (falling back to APP_SECRET — see api/lib/env.ts).
// ---------------------------------------------------------------------------

let cachedKey: Buffer | null = null;

function encryptionKey(): Buffer {
  if (!cachedKey) {
    // Static salt: the input secret already carries the entropy; we only need a
    // deterministic 32-byte key so ciphertext stays decryptable across restarts.
    cachedKey = scryptSync(env.encryptionKey, "cinekin-playlist-enc-v1", 32);
  }
  return cachedKey;
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `gcm$${iv.toString("hex")}$${tag.toString("hex")}$${enc.toString("hex")}`;
}

export function decryptSecret(stored: string | null | undefined): string | null {
  if (!stored) return null;
  const [scheme, ivHex, tagHex, dataHex] = stored.split("$");
  if (scheme !== "gcm" || !ivHex || !tagHex || !dataHex) return null;
  try {
    const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivHex, "hex"));
    decipher.setAuthTag(Buffer.from(tagHex, "hex"));
    const dec = Buffer.concat([
      decipher.update(Buffer.from(dataHex, "hex")),
      decipher.final(),
    ]);
    return dec.toString("utf8");
  } catch {
    return null;
  }
}
