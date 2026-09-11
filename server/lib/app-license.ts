import { z } from "zod";
import { randomBytes } from "node:crypto";

export const licenseTypeSchema = z.enum(["12_months", "unlimited"]);
export type LicenseType = z.infer<typeof licenseTypeSchema>;

// 1 credit = 12 months, 2 credits = unlimited.
export function creditCost(type: LicenseType): number {
  return type === "unlimited" ? 2 : 1;
}

// 'unlimited' never expires; '12_months' expires 12 months after activation.
export function computeExpiry(type: LicenseType, from: Date): Date | null {
  if (type === "unlimited") return null;
  const d = new Date(from);
  d.setMonth(d.getMonth() + 12);
  return d;
}

// Renewal extends an active fixed-duration licence instead of discarding the
// remaining paid time. Expired/inactive licences restart from now.
export function computeRenewalExpiry(
  type: LicenseType,
  now: Date,
  currentExpiry: Date | null
): Date | null {
  if (type === "unlimited") return null;
  const base =
    currentExpiry && currentExpiry.getTime() > now.getTime()
      ? currentExpiry
      : now;
  return computeExpiry(type, base);
}

const CLAIM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateClaimCode(): string {
  const bytes = randomBytes(10);
  const raw = Array.from(bytes, byte => CLAIM_CODE_ALPHABET[byte & 31]).join(
    ""
  );
  return `CK-${raw.slice(0, 5)}-${raw.slice(5)}`;
}

export function normalizeClaimCode(code: string): string {
  return code.trim().toUpperCase().replace(/[\s-]/g, "");
}

export const claimCodeSchema = z
  .string()
  .trim()
  .min(1)
  .max(32)
  .transform(normalizeClaimCode)
  .refine(code => /^CK[A-HJ-NP-Z2-9]{10}$/.test(code), {
    message: "Code d'activation invalide.",
  });

export function claimCodeExpiry(from = new Date()): Date {
  return new Date(from.getTime() + 72 * 60 * 60 * 1000);
}

const MAC_INPUT_PATTERN =
  /^(?:[0-9a-f]{12}|[0-9a-f]{2}(?::[0-9a-f]{2}){5}|[0-9a-f]{2}(?:-[0-9a-f]{2}){5})$/i;

// Store every device identifier in one unambiguous form. Accept the three
// common representations at the API boundary, then persist lower-case pairs
// separated by colons (aa:bb:cc:dd:ee:ff).
export function normalizeMac(mac: string): string {
  const value = mac.trim();
  if (!MAC_INPUT_PATTERN.test(value)) return "";

  const compact = value.replace(/[:-]/g, "").toLowerCase();
  return compact.match(/.{2}/g)?.join(":") ?? "";
}

export const macAddressSchema = z
  .string()
  .trim()
  .min(1)
  .max(17)
  .refine(value => normalizeMac(value) !== "", {
    message:
      "L'adresse MAC doit contenir exactement 12 caractères hexadécimaux.",
  })
  .transform(value => normalizeMac(value));

// Backwards-compatible lookup for rows written before canonicalisation was
// enforced. A later data migration can collapse these variants safely after
// duplicate detection.
export function macLookupVariants(mac: string): string[] {
  const canonical = normalizeMac(mac);
  if (!canonical) return [];
  const compact = canonical.replace(/:/g, "");
  return [canonical, compact, canonical.replace(/:/g, "-")];
}

function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip combining diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Auto-generate an email when the reseller/admin didn't supply one:
// slug of the name, else "client-<mac>@client.cine-kin.tv".
export function autoEmail(
  name: string | null | undefined,
  mac: string
): string {
  const macSuffix = normalizeMac(mac).replace(/:/g, "");
  const slug = name ? slugify(name).slice(0, 48) : "client";
  return `${slug || "client"}-${macSuffix}@client.cine-kin.tv`;
}

export type LicenseStatus = "inactive" | "active" | "expired";

export function licenseStatus(client: {
  licenseType: string | null;
  expiresAt: Date | null;
}): LicenseStatus {
  if (!client.licenseType) return "inactive";
  if (client.licenseType === "unlimited" || !client.expiresAt) return "active";
  return client.expiresAt.getTime() > Date.now() ? "active" : "expired";
}
