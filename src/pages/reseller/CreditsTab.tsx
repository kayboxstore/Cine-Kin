import { ArrowDown, ArrowUp } from "lucide-react";
import { trpc } from "@/providers/trpc";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ENTRY_LABELS = {
  initial_grant: "Solde initial",
  admin_grant: "Ajout administrateur",
  activation: "Activation / renouvellement",
  refund: "Remboursement",
  adjustment: "Ajustement",
} as const;

export default function CreditsTab() {
  const history = trpc.reseller.creditHistory.useQuery();

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/[0.08] bg-white/[0.02]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Opération</TableHead>
            <TableHead>Motif</TableHead>
            <TableHead>Variation</TableHead>
            <TableHead>Solde après</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.data && history.data.length > 0 ? (
            history.data.map(entry => {
              const positive = entry.delta >= 0;
              return (
                <TableRow key={entry.id}>
                  <TableCell className="text-white/50">
                    {new Date(entry.createdAt).toLocaleString("fr-FR")}
                  </TableCell>
                  <TableCell className="text-white/80">
                    {ENTRY_LABELS[entry.entryType]}
                  </TableCell>
                  <TableCell className="max-w-xs text-white/60">
                    {entry.reason}
                  </TableCell>
                  <TableCell
                    className={positive ? "text-emerald-400" : "text-amber-400"}
                  >
                    <span className="inline-flex items-center gap-1 font-semibold">
                      {positive ? (
                        <ArrowUp className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowDown className="h-3.5 w-3.5" />
                      )}
                      {positive ? "+" : ""}
                      {entry.delta}
                    </span>
                  </TableCell>
                  <TableCell className="font-semibold text-white">
                    {entry.balanceAfter}
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell
                colSpan={5}
                className="py-12 text-center text-white/50"
              >
                {history.isLoading
                  ? "Chargement…"
                  : "Aucun mouvement de crédits"}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
