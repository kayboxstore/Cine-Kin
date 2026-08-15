import { z } from "zod";

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

export function normalizeMac(mac: string): string {
  return mac.trim().toLowerCase();
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
export function autoEmail(name: string | null | undefined, mac: string): string {
  const slug = name ? slugify(name) : "";
  if (slug) return `${slug}@client.cine-kin.tv`;
  return `client-${normalizeMac(mac).replace(/[^a-z0-9]/g, "")}@client.cine-kin.tv`;
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
