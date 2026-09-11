import { useMemo, useState } from "react";
import { Copy, KeyRound, Search, ShieldCheck } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/Toast";
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
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const activations = trpc.reseller.myActivations.useQuery();
  const [search, setSearch] = useState("");
  const [claimCredential, setClaimCredential] = useState<{
    code: string;
    expiresAt: Date | string;
  } | null>(null);

  const issueClaimCode = trpc.reseller.issueClaimCode.useMutation({
    onSuccess: data => {
      setClaimCredential({
        code: data.claimCode,
        expiresAt: data.claimCodeExpiresAt,
      });
      utils.reseller.myActivations.invalidate();
      toast("Nouveau code généré.", "success");
    },
    onError: e => toast(e.message || "Impossible de générer le code", "error"),
  });

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const data = activations.data ?? [];
    if (!q) return data;
    return data.filter(a =>
      [a.clientName, a.clientEmail, a.mac].some(v =>
        (v ?? "").toLowerCase().includes(q)
      )
    );
  }, [activations.data, search]);

  return (
    <div className="space-y-4">
      {claimCredential && (
        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-400" />
            <div className="flex-1 space-y-3">
              <p className="text-sm text-emerald-100/70">
                Nouveau code valable jusqu'au{" "}
                {new Date(claimCredential.expiresAt).toLocaleString("fr-FR")}.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <code className="rounded-lg bg-black/20 px-4 py-2 font-mono text-lg font-semibold tracking-wider text-white">
                  {claimCredential.code}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard?.writeText(claimCredential.code);
                    toast("Code copié.", "success");
                  }}
                >
                  <Copy className="mr-1.5 h-4 w-4" />
                  Copier
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setClaimCredential(null)}
                >
                  Masquer
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
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
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length > 0 ? (
              rows.map(a => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium text-white">
                    {a.clientName || "—"}
                  </TableCell>
                  <TableCell className="text-white/60">
                    {a.clientEmail || "—"}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-white/60">
                    {a.mac}
                  </TableCell>
                  <TableCell className="text-white/80">
                    {licenseLabel(a.licenseType)}
                  </TableCell>
                  <TableCell className="text-white/80">
                    {a.creditsCharged} crédit{a.creditsCharged > 1 ? "s" : ""}
                  </TableCell>
                  <TableCell className="text-white/50">
                    {formatDateTime(a.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    {!a.clientRegistered && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={issueClaimCode.isPending}
                        onClick={() =>
                          issueClaimCode.mutate({ appClientId: a.appClientId })
                        }
                      >
                        <KeyRound className="mr-1.5 h-3.5 w-3.5" />
                        {a.claimCodePending ? "Régénérer" : "Générer un code"}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-12 text-center text-white/50"
                >
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
