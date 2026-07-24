import { useMemo, useState } from "react";
import {
  ChevronDown,
  Coins,
  Copy,
  KeyRound,
  Plus,
  ShieldCheck,
  Store,
} from "lucide-react";
import { trpc } from "@/providers/trpc";
import { useToast } from "@/components/Toast";
import { SectionCard } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
import { licenseLabel, formatDateTime } from "@/lib/licenseFormat";

function generatePassword(length = 12): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);
  return Array.from(arr, (n) => chars[n % chars.length]).join("");
}

export default function ResellersSection() {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const resellers = trpc.admin.resellerList.useQuery();
  const clients = trpc.admin.appClientList.useQuery();

  const clientNames = useMemo(() => {
    const map = new Map<number, string>();
    for (const c of clients.data ?? []) map.set(c.id, c.name || c.email || c.mac);
    return map;
  }, [clients.data]);

  // Create form
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [initialCredits, setInitialCredits] = useState("0");

  // Plaintext credential shown ONCE right after creation (never re-displayable).
  const [createdCredential, setCreatedCredential] = useState<{ username: string; password: string } | null>(null);

  const create = trpc.admin.resellerCreate.useMutation({
    onSuccess: (_data, variables) => {
      setCreatedCredential({ username: variables.username, password: variables.password });
      setName("");
      setContact("");
      setUsername("");
      setPassword("");
      setInitialCredits("0");
      utils.admin.resellerList.invalidate();
    },
    onError: (e) => toast(e.message || "Échec de la création du revendeur", "error"),
  });

  const canCreate = name.trim() && username.trim().length >= 3 && password.length >= 8;

  const copy = (text: string) => {
    navigator.clipboard?.writeText(text).then(
      () => toast("Copié dans le presse-papiers.", "success"),
      () => toast("Copie impossible.", "error"),
    );
  };

  return (
    <div className="space-y-8">
      {/* Create reseller */}
      <SectionCard title="Créer un revendeur">
        <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="r-name">Nom</Label>
            <Input id="r-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="r-contact">Contact</Label>
            <Input
              id="r-contact"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="WhatsApp, e-mail…"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="r-username">Identifiant</Label>
            <Input id="r-username" value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="r-password">Mot de passe initial</Label>
            <div className="flex gap-2">
              <Input
                id="r-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="≥ 8 caractères"
              />
              <Button type="button" variant="outline" onClick={() => setPassword(generatePassword())}>
                Générer
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="r-credits">Crédits de départ</Label>
            <Input
              id="r-credits"
              type="number"
              min={0}
              value={initialCredits}
              onChange={(e) => setInitialCredits(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button
              disabled={!canCreate || create.isPending}
              onClick={() =>
                create.mutate({
                  name: name.trim(),
                  contact: contact.trim() || undefined,
                  username: username.trim(),
                  password,
                  initialCredits: Math.max(0, parseInt(initialCredits, 10) || 0),
                })
              }
              className="w-full bg-[#5a6b4e] text-white hover:bg-[#4d5d42]"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              {create.isPending ? "Création…" : "Créer le revendeur"}
            </Button>
          </div>
        </div>
      </SectionCard>

      {/* Reseller list */}
      <div className="space-y-4">
        {resellers.data && resellers.data.length > 0 ? (
          resellers.data.map((r) => (
            <ResellerCard key={r.id} reseller={r} clientNames={clientNames} />
          ))
        ) : (
          <div className="rounded-xl border border-border bg-card py-12 text-center text-muted-foreground">
            {resellers.isLoading ? "Chargement…" : "Aucun revendeur"}
          </div>
        )}
      </div>

      {/* One-time password reveal */}
      <Dialog open={!!createdCredential} onOpenChange={(open) => !open && setCreatedCredential(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              Revendeur créé
            </DialogTitle>
            <DialogDescription>
              Transmettez ces identifiants au revendeur. Le mot de passe n'est affiché
              <strong className="text-foreground"> qu'une seule fois</strong> — il ne sera jamais ré-affichable.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <CredentialRow label="Identifiant" value={createdCredential?.username ?? ""} onCopy={copy} />
            <CredentialRow label="Mot de passe" value={createdCredential?.password ?? ""} onCopy={copy} mono />
          </div>
          <DialogFooter>
            <Button
              onClick={() => setCreatedCredential(null)}
              className="bg-[#5a6b4e] text-white hover:bg-[#4d5d42]"
            >
              J'ai copié, fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CredentialRow({
  label,
  value,
  onCopy,
  mono = false,
}: {
  label: string;
  value: string;
  onCopy: (v: string) => void;
  mono?: boolean;
}) {
  return (
    <div className="space-y-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
        <code className={`flex-1 text-sm text-foreground ${mono ? "font-mono" : ""}`}>{value}</code>
        <button
          onClick={() => onCopy(value)}
          className="text-muted-foreground transition-colors hover:text-foreground"
          title="Copier"
        >
          <Copy className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

type ResellerData = {
  id: number;
  name: string;
  contact: string | null;
  username: string;
  credits: number;
  createdAt: Date | string;
};

function ResellerCard({
  reseller,
  clientNames,
}: {
  reseller: ResellerData;
  clientNames: Map<number, string>;
}) {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const [amount, setAmount] = useState("");
  const [open, setOpen] = useState(false);

  const addCredits = trpc.admin.resellerAddCredits.useMutation({
    onSuccess: () => {
      toast("Crédits ajoutés.", "success");
      setAmount("");
      utils.admin.resellerList.invalidate();
    },
    onError: (e) => toast(e.message || "Échec de l'ajout de crédits", "error"),
  });

  const history = trpc.admin.resellerActivationHistory.useQuery(
    { resellerId: reseller.id },
    { enabled: open },
  );

  const amountNum = Math.max(0, parseInt(amount, 10) || 0);

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#5a6b4e]/15 text-[#8ba26f]">
            <Store className="h-5 w-5" />
          </div>
          <div>
            <div className="font-medium text-foreground">{reseller.name}</div>
            <div className="text-xs text-muted-foreground">
              @{reseller.username}
              {reseller.contact ? ` · ${reseller.contact}` : ""}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-400">
            <Coins className="mr-1 h-3.5 w-3.5" />
            {reseller.credits} crédits
          </Badge>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Montant"
              className="h-9 w-28"
            />
            <Button
              size="sm"
              variant="outline"
              disabled={amountNum < 1 || addCredits.isPending}
              onClick={() => addCredits.mutate({ resellerId: reseller.id, amount: amountNum })}
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Crédits
            </Button>
          </div>
        </div>
      </div>

      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <button className="flex w-full items-center justify-between border-t border-border px-5 py-3 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <span className="flex items-center gap-2">
              <KeyRound className="h-4 w-4" />
              Historique d'activations
            </span>
            <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="overflow-x-auto border-t border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>MAC</TableHead>
                  <TableHead>Licence</TableHead>
                  <TableHead>Coût</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.data && history.data.length > 0 ? (
                  history.data.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium text-foreground">
                        {clientNames.get(a.appClientId) ?? "—"}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{a.mac}</TableCell>
                      <TableCell>{licenseLabel(a.licenseType)}</TableCell>
                      <TableCell>{a.creditsCharged} crédit{a.creditsCharged > 1 ? "s" : ""}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDateTime(a.createdAt)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      {history.isLoading ? "Chargement…" : "Aucune activation"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
