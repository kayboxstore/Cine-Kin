import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  scrypt,
} from "node:crypto";
import {
  appendFile,
  chmod,
  mkdir,
  open,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { createReadStream, createWriteStream } from "node:fs";
import path from "node:path";
import { Writable } from "node:stream";
import { promisify } from "node:util";
import { pipeline } from "node:stream/promises";

const deriveKey = promisify(scrypt);
const MAGIC = Buffer.from("CKSTAGE1", "ascii");
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const HEADER_LENGTH = MAGIC.length + SALT_LENGTH + IV_LENGTH;

function validatePassphrase(passphrase) {
  if (typeof passphrase !== "string" || passphrase.length < 32) {
    throw new Error(
      "La phrase de chiffrement de sauvegarde doit contenir au moins 32 caractères."
    );
  }
}

async function encryptionKey(passphrase, salt) {
  validatePassphrase(passphrase);
  return deriveKey(passphrase, salt, 32);
}

export async function sha256File(filePath) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(filePath)) hash.update(chunk);
  return hash.digest("hex");
}

export async function encryptReadableToFile(readable, outputPath, passphrase) {
  const salt = randomBytes(SALT_LENGTH);
  const iv = randomBytes(IV_LENGTH);
  const key = await encryptionKey(passphrase, salt);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const header = Buffer.concat([MAGIC, salt, iv]);

  await mkdir(path.dirname(outputPath), { recursive: true, mode: 0o700 });
  await writeFile(outputPath, header, { flag: "wx", mode: 0o600 });
  try {
    await pipeline(
      readable,
      cipher,
      createWriteStream(outputPath, { flags: "a", mode: 0o600 })
    );
    await appendFile(outputPath, cipher.getAuthTag());
    await chmod(outputPath, 0o600);
    const file = await stat(outputPath);
    return {
      algorithm: "aes-256-gcm+scrypt",
      bytes: file.size,
      sha256: await sha256File(outputPath),
    };
  } catch (error) {
    await rm(outputPath, { force: true });
    throw error;
  }
}

export async function decryptFileToWritable(inputPath, writable, passphrase) {
  const file = await stat(inputPath);
  if (file.size <= HEADER_LENGTH + AUTH_TAG_LENGTH) {
    throw new Error("Sauvegarde chiffrée tronquée ou vide.");
  }

  const handle = await open(inputPath, "r");
  let header;
  let authTag;
  try {
    header = Buffer.alloc(HEADER_LENGTH);
    authTag = Buffer.alloc(AUTH_TAG_LENGTH);
    await handle.read(header, 0, HEADER_LENGTH, 0);
    await handle.read(authTag, 0, AUTH_TAG_LENGTH, file.size - AUTH_TAG_LENGTH);
  } finally {
    await handle.close();
  }

  if (!header.subarray(0, MAGIC.length).equals(MAGIC)) {
    throw new Error("Format de sauvegarde Ciné-Kin invalide.");
  }
  const salt = header.subarray(MAGIC.length, MAGIC.length + SALT_LENGTH);
  const iv = header.subarray(MAGIC.length + SALT_LENGTH, HEADER_LENGTH);
  const key = await encryptionKey(passphrase, salt);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  await pipeline(
    createReadStream(inputPath, {
      start: HEADER_LENGTH,
      end: file.size - AUTH_TAG_LENGTH - 1,
    }),
    decipher,
    writable
  );
}

export async function verifyEncryptedBackup(inputPath, passphrase) {
  await decryptFileToWritable(
    inputPath,
    new Writable({
      write(_chunk, _encoding, callback) {
        callback();
      },
    }),
    passphrase
  );
}

export const encryptedBackupFormat = {
  authTagLength: AUTH_TAG_LENGTH,
  headerLength: HEADER_LENGTH,
  magic: MAGIC.toString("ascii"),
};
