import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function licenseLabel(t: "12_months" | "unlimited"): string {
  return t === "unlimited" ? "Illimitée" : "12 mois";
}

function formatDateTime(d: Date | string): string {
  return new Date(d).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ActivationsTab() {
  const activations = trpc.reseller.myActivations.useQuery();
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const data = activations.data ?? [];
    if (!q) return data;
    return data.filter((a) =>
      [a.clientName, a.clientEmail, a.mac].some((v) => (v ?? "").toLowerCase().includes(q)),
    );
  }, [activations.data, search]);

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher (nom, e-mail, MAC)…"
          className="border-white/10 bg-white/[0.03] pl-9 text-white"
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/[0.08] bg-white/[0.02]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>MAC</TableHead>
              <TableHead>Licence</TableHead>
              <TableHead>Coût</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length > 0 ? (
              rows.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium text-white">{a.clientName || "—"}</TableCell>
                  <TableCell className="text-white/60">{a.clientEmail || "—"}</TableCell>
                  <TableCell className="font-mono text-xs text-white/60">{a.mac}</TableCell>
                  <TableCell className="text-white/80">{licenseLabel(a.licenseType)}</TableCell>
                  <TableCell className="text-white/80">
                    {a.creditsCharged} crédit{a.creditsCharged > 1 ? "s" : ""}
                  </TableCell>
                  <TableCell className="text-white/50">{formatDateTime(a.createdAt)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-white/50">
                  {activations.isLoading
                    ? "Chargement…"
                    : search
                      ? "Aucun résultat"
                      : "Aucune activation"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
