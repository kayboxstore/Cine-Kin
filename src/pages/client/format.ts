export function licenseLabel(t: "12_months" | "unlimited" | null): string {
  if (t === "12_months") return "12 mois";
  if (t === "unlimited") return "Illimitée";
  return "Essai";
}

export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
