import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { useToast } from "@/components/Toast";
import { SectionCard, LicenseSelect } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  statusMeta,
  licenseLabel,
  formatDate,
  type LicenseType,
} from "@/lib/licenseFormat";

type ClientRow = {
  id: number;
  mac: string;
  name: string | null;
  email: string | null;
  licenseType: LicenseType;
  expiresAt: Date | string | null;
  createdAt: Date | string;
};

export default function ClientsSection() {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const clients = trpc.admin.appClientList.useQuery();

  const [renewTarget, setRenewTarget] = useState<ClientRow | null>(null);
  const [renewType, setRenewType] = useState<"12_months" | "unlimited">("12_months");

  const renew = trpc.admin.appClientRenew.useMutation({
    onSuccess: () => {
      toast("Licence renouvelée.", "success");
      setRenewTarget(null);
      utils.admin.appClientList.invalidate();
      utils.admin.activationList.invalidate();
    },
    onError: (e) => toast(e.message || "Échec du renouvellement", "error"),
  });

  const openRenew = (c: ClientRow) => {
    setRenewType(c.licenseType === "unlimited" ? "unlimited" : "12_months");
    setRenewTarget(c);
  };

  return (
    <>
      <SectionCard title="Clients application">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Formule active</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Client depuis</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.data && clients.data.length > 0 ? (
                clients.data.map((c) => {
                  const meta = statusMeta(computeStatus(c));
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium text-foreground">{c.name || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{c.email || "—"}</TableCell>
                      <TableCell>{licenseLabel(c.licenseType)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={meta.className}>
                          {meta.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(c.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openRenew(c)}
                          className="border-[#5a6b4e]/40 text-[#8ba26f] hover:bg-[#5a6b4e]/10 hover:text-[#8ba26f]"
                        >
                          <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                          Renouveler
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                    {clients.isLoading ? "Chargement…" : "Aucun client"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </SectionCard>

      <Dialog open={!!renewTarget} onOpenChange={(open) => !open && setRenewTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renouveler la licence</DialogTitle>
            <DialogDescription>
              {renewTarget?.name || renewTarget?.email || renewTarget?.mac} — nouvelle période à partir
              d'aujourd'hui.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Type de licence</label>
            <LicenseSelect
              value={renewType}
              onChange={(e) => setRenewType(e.target.value as "12_months" | "unlimited")}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRenewTarget(null)}>
              Annuler
            </Button>
            <Button
              disabled={renew.isPending}
              onClick={() =>
                renewTarget && renew.mutate({ appClientId: renewTarget.id, licenseType: renewType })
              }
              className="bg-[#5a6b4e] text-white hover:bg-[#4d5d42]"
            >
              {renew.isPending ? "Renouvellement…" : "Renouveler la licence"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
