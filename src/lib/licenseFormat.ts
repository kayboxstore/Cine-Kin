// Shared formatting for the admin licence panel. Kept in sync with the
// server-side rules in api/lib/app-license.ts (labels/status/credit cost).

export type LicenseType = "12_months" | "unlimited" | null;
export type LicenseStatus = "inactive" | "active" | "expired";

export function licenseLabel(type: LicenseType): string {
  if (type === "12_months") return "12 mois";
  if (type === "unlimited") return "Illimitée";
  return "—";
}

// 1 credit = 12 months, 2 credits = unlimited.
export function creditCost(type: Exclude<LicenseType, null>): number {
  return type === "unlimited" ? 2 : 1;
}

export function normalizeMac(mac: string): string {
  return mac.trim().toLowerCase();
}

export function computeStatus(client: {
  licenseType: LicenseType;
  expiresAt: Date | string | null;
}): LicenseStatus {
  if (!client.licenseType) return "inactive";
  if (client.licenseType === "unlimited" || !client.expiresAt) return "active";
  return new Date(client.expiresAt).getTime() > Date.now() ? "active" : "expired";
}

export function statusMeta(status: LicenseStatus): { label: string; className: string } {
  switch (status) {
    case "active":
      return { label: "Active", className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" };
    case "expired":
      return { label: "Expirée", className: "border-red-500/30 bg-red-500/10 text-red-400" };
    default:
      return { label: "Inactive", className: "border-white/15 bg-white/5 text-white/50" };
  }
}

export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateTime(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
