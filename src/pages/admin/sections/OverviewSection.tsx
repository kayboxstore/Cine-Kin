import { useMemo } from "react";
import { MonitorSmartphone, ShoppingCart, Zap, Coins } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { StatCard, SectionCard } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  computeStatus,
  licenseLabel,
  formatDate,
  formatDateTime,
} from "@/lib/licenseFormat";

function isThisMonth(d: Date | string | null | undefined): boolean {
  if (!d) return false;
  const date = new Date(d);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

export default function OverviewSection() {
  const clients = trpc.admin.appClientList.useQuery();
  const orders = trpc.admin.orderList.useQuery();
  const activations = trpc.admin.activationList.useQuery();
  const resellers = trpc.admin.resellerList.useQuery();

  const clientNames = useMemo(() => {
    const map = new Map<number, string>();
    for (const c of clients.data ?? []) map.set(c.id, c.name || c.email || c.mac);
    return map;
  }, [clients.data]);

  const activeClients = (clients.data ?? []).filter((c) => computeStatus(c) === "active").length;
  const ordersThisMonth = (orders.data ?? []).filter((o) => isThisMonth(o.createdAt)).length;
  const activationsThisMonth = (activations.data ?? []).filter((a) => isThisMonth(a.createdAt)).length;
  const creditsInCirculation = (resellers.data ?? []).reduce((sum, r) => sum + r.credits, 0);

  const latestOrders = (orders.data ?? []).slice(0, 5);
  const latestActivations = (activations.data ?? []).slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={MonitorSmartphone} label="Clients actifs" value={activeClients} tone="emerald" />
        <StatCard icon={ShoppingCart} label="Commandes du mois" value={ordersThisMonth} tone="olive" />
        <StatCard icon={Zap} label="Activations du mois" value={activationsThisMonth} tone="blue" />
        <StatCard icon={Coins} label="Crédits en circulation" value={creditsInCirculation} tone="amber" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard title="Dernières commandes">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Formule</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {latestOrders.length ? (
                  latestOrders.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-medium text-foreground">{o.customerName}</TableCell>
                      <TableCell>{o.planName}</TableCell>
                      <TableCell>{o.price}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(o.createdAt)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                      Aucune commande
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </SectionCard>

        <SectionCard title="Dernières activations">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Licence</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {latestActivations.length ? (
                  latestActivations.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium text-foreground">
                        {clientNames.get(a.appClientId) ?? a.mac}
                      </TableCell>
                      <TableCell>{licenseLabel(a.licenseType)}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            a.activatedByType === "admin"
                              ? "border-blue-500/30 bg-blue-500/10 text-blue-400"
                              : "border-[#5a6b4e]/30 bg-[#5a6b4e]/10 text-[#8ba26f]"
                          }
                        >
                          {a.activatedByType === "admin" ? "Admin" : "Revendeur"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDateTime(a.createdAt)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                      Aucune activation
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
