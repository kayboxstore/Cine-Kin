import { trpc } from "@/providers/trpc";
import { SectionCard } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/licenseFormat";

const STATUS_META: Record<string, { label: string; className: string }> = {
  pending: { label: "En attente", className: "border-amber-500/30 bg-amber-500/10 text-amber-400" },
  active: { label: "Actif", className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" },
  expired: { label: "Expiré", className: "border-red-500/30 bg-red-500/10 text-red-400" },
  cancelled: { label: "Annulé", className: "border-white/15 bg-white/5 text-white/50" },
};

export default function OrdersSection() {
  const orders = trpc.admin.orderList.useQuery();

  return (
    <SectionCard title="Commandes IPTV">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Formule</TableHead>
              <TableHead>Prix</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.data && orders.data.length > 0 ? (
              orders.data.map((o) => {
                const meta = STATUS_META[o.status] ?? STATUS_META.pending;
                return (
                  <TableRow key={o.id}>
                    <TableCell className="text-muted-foreground">#{o.id}</TableCell>
                    <TableCell>
                      <div className="font-medium text-foreground">{o.customerName}</div>
                      <div className="text-xs text-muted-foreground">{o.customerPhone}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-foreground">{o.planName}</div>
                      <div className="text-xs capitalize text-muted-foreground">{o.planType}</div>
                    </TableCell>
                    <TableCell className="text-foreground">{o.price}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={meta.className}>
                        {meta.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(o.createdAt)}</TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  {orders.isLoading ? "Chargement…" : "Aucune commande"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </SectionCard>
  );
}
