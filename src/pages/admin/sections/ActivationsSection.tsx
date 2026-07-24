import { useMemo, useState } from "react";
import { AlertTriangle, Lock, Zap } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { useToast } from "@/components/Toast";
import { SectionCard, LicenseSelect } from "@/components/admin/ui";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { licenseLabel, formatDateTime, normalizeMac } from "@/lib/licenseFormat";

type License = "12_months" | "unlimited";

export default function ActivationsSection() {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const clients = trpc.admin.appClientList.useQuery();
  const activations = trpc.admin.activationList.useQuery();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mac, setMac] = useState("");
  const [licenseType, setLicenseType] = useState<License>("12_months");
  const [renewMode, setRenewMode] = useState(false);

  const clientNames = useMemo(() => {
    const map = new Map<number, string>();
    for (const c of clients.data ?? []) map.set(c.id, c.name || c.email || c.mac);
    return map;
  }, [clients.data]);

  // Real-time anti-duplicate detection against the known MAC list.
  const matched = useMemo(() => {
    const norm = normalizeMac(mac);
    if (norm.length < 3) return null;
    return (clients.data ?? []).find((c) => normalizeMac(c.mac) === norm) ?? null;
  }, [mac, clients.data]);

  const resetForm = () => {
    setName("");
    setEmail("");
    setMac("");
    setLicenseType("12_months");
    setRenewMode(false);
  };

  const onSuccess = (msg: string) => {
    toast(msg, "success");
    resetForm();
    utils.admin.appClientList.invalidate();
    utils.admin.activationList.invalidate();
  };

  const activate = trpc.admin.appClientActivate.useMutation({
    onSuccess: () => onSuccess("Licence activée."),
    onError: (e) => toast(e.message || "Échec de l'activation", "error"),
  });
  const renew = trpc.admin.appClientRenew.useMutation({
    onSuccess: () => onSuccess("Licence renouvelée."),
    onError: (e) => toast(e.message || "Échec du renouvellement", "error"),
  });

  const switchToRenew = () => {
    if (!matched) return;
    setName(matched.name ?? "");
    setEmail(matched.email ?? "");
    setLicenseType(matched.licenseType === "unlimited" ? "unlimited" : "12_months");
    setRenewMode(true);
  };

  const submit = () => {
    if (renewMode) {
      if (!matched) return;
      renew.mutate({ appClientId: matched.id, licenseType });
    } else {
      activate.mutate({
        mac: mac.trim(),
        name: name.trim() || undefined,
        email: email.trim() || undefined,
        licenseType,
      });
    }
  };

  const pending = activate.isPending || renew.isPending;
  const macTooShort = mac.trim().length < 3;

  return (
    <div className="space-y-8">
      <SectionCard title={renewMode ? "Renouvellement de licence" : "Nouvelle activation"}>
        <div className="space-y-5 p-5">
          {/* Anti-duplicate alert (only outside renew mode) */}
          {matched && !renewMode && (
            <Alert className="border-amber-500/30 bg-amber-500/10">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <AlertTitle className="text-amber-300">MAC déjà connue</AlertTitle>
              <AlertDescription className="text-amber-200/80">
                Un client existe déjà pour cette adresse MAC
                {matched.name ? ` (${matched.name})` : ""}. Pour prolonger sa licence, utilisez le
                renouvellement.
                <div className="mt-3">
                  <Button
                    size="sm"
                    onClick={switchToRenew}
                    className="bg-amber-500 text-black hover:bg-amber-400"
                  >
                    Renouveler plutôt
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {renewMode && (
            <div className="flex items-center justify-between rounded-lg border border-[#5a6b4e]/30 bg-[#5a6b4e]/10 px-4 py-2.5">
              <span className="text-sm text-[#8ba26f]">
                Mode renouvellement — client existant, MAC verrouillée.
              </span>
              <Button size="sm" variant="ghost" onClick={resetForm}>
                Nouvelle activation
              </Button>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="act-name">Nom</Label>
              <Input
                id="act-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nom du client"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="act-email">E-mail</Label>
              <Input
                id="act-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Optionnel — généré si vide"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="act-mac">Adresse MAC</Label>
              <div className="relative">
                <Input
                  id="act-mac"
                  value={mac}
                  onChange={(e) => setMac(e.target.value)}
                  disabled={renewMode}
                  placeholder="00:11:22:33:44:55"
                  className={renewMode ? "pr-9 opacity-70" : ""}
                />
                {renewMode && (
                  <Lock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="act-license">Licence</Label>
              <LicenseSelect
                id="act-license"
                value={licenseType}
                onChange={(e) => setLicenseType(e.target.value as License)}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={submit}
              disabled={pending || (!renewMode && macTooShort)}
              className="bg-[#5a6b4e] text-white hover:bg-[#4d5d42]"
            >
              <Zap className="mr-1.5 h-4 w-4" />
              {pending
                ? "Traitement…"
                : renewMode
                  ? "Renouveler la licence"
                  : "Activer la licence"}
            </Button>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Activations récentes">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>MAC</TableHead>
                <TableHead>Licence</TableHead>
                <TableHead>Origine</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activations.data && activations.data.length > 0 ? (
                activations.data.slice(0, 20).map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium text-foreground">
                      {clientNames.get(a.appClientId) ?? "—"}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{a.mac}</TableCell>
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
                  <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                    {activations.isLoading ? "Chargement…" : "Aucune activation"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </SectionCard>
    </div>
  );
}
