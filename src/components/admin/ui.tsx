import type { LucideIcon } from "lucide-react";
import type { SelectHTMLAttributes } from "react";

export function StatCard({
  icon: Icon,
  label,
  value,
  tone = "olive",
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  tone?: "olive" | "amber" | "blue" | "emerald";
}) {
  const tones: Record<string, string> = {
    olive: "bg-[#5a6b4e]/15 text-[#8ba26f]",
    amber: "bg-amber-400/10 text-amber-400",
    blue: "bg-blue-400/10 text-blue-400",
    emerald: "bg-emerald-400/10 text-emerald-400",
  };
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${tones[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="font-display text-2xl font-bold text-foreground">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

// Native <select> styled to match — the shadcn Select in this repo uses
// Tailwind v4 syntax and is broken on the project's v3 build.
export function LicenseSelect({
  showCost = false,
  className = "",
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { showCost?: boolean }) {
  return (
    <select
      {...props}
      className={`h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${className}`}
    >
      <option value="12_months">{showCost ? "12 mois — 1 crédit" : "12 mois"}</option>
      <option value="unlimited">{showCost ? "Illimitée — 2 crédits" : "Illimitée"}</option>
    </select>
  );
}

export function SectionCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <h2 className="font-display text-base font-semibold text-foreground">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}
