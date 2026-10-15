import { useMemo, useState } from "react";
import {
  ChevronDown,
  Coins,
  Copy,
  History,
  KeyRound,
  Pencil,
  Plus,
  ShieldCheck,
  Store,
  UserCheck,
  UserRoundX,
} from "lucide-react";
import { trpc } from "@/providers/trpc";
import { useToast } from "@/components/Toast";
import { SectionCard } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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

const CREDIT_ENTRY_LABELS = {
  initial_grant: "Solde initial",
  admin_grant: "Ajout administrateur",
  activation: "Activation / renouvellement",
  refund: "Remboursement",
  adjustment: "Ajustement",
} as const;

const ADMIN_ACTION_LABELS = {
  profile_update: "Profil modifié",
  password_reset: "Mot de passe réinitialisé",
  status_change: "Statut modifié",
} as const;

function generatePassword(length = 12): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);
  return Array.from(arr, n => chars[n % chars.length]).join("");
}

export default function ResellersSection() {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const resellers = trpc.admin.resellerList.useQuery();
  const clients = trpc.admin.appClientList.useQuery();

  const clientNames = useMemo(() => {
    const map = new Map<number, string>();
    for (const c of clients.data ?? [])
      map.set(c.id, c.name || c.email || c.mac);
    return map;
  }, [clients.data]);

  // Create form
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [initialCredits, setInitialCredits] = useState("0");

  // Plaintext credential shown ONCE right after creation (never re-displayable).
  const [createdCredential, setCreatedCredential] = useState<{
    username: string;
    password: string;
  } | null>(null);

  const create = trpc.admin.resellerCreate.useMutation({
    onSuccess: (_data, variables) => {
      setCreatedCredential({
        username: variables.username,
        password: variables.password,
      });
      setName("");
      setContact("");
      setUsername("");
      setPassword("");
      setInitialCredits("0");
      utils.admin.resellerList.invalidate();
    },
    onError: e =>
      toast(e.message || "Échec de la création du revendeur", "error"),
  });

  const canCreate =
    name.trim() && username.trim().length >= 3 && password.length >= 8;

  const copy = (text: string) => {
    navigator.clipboard?.writeText(text).then(
      () => toast("Copié dans le presse-papiers.", "success"),
      () => toast("Copie impossible.", "error")
    );
  };

  return (
    <div className="space-y-8">
      {/* Create reseller */}
      <SectionCard title="Créer un revendeur">
        <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="r-name">Nom</Label>
            <Input
              id="r-name"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="r-contact">Contact</Label>
            <Input
              id="r-contact"
              value={contact}
              onChange={e => setContact(e.target.value)}
              placeholder="WhatsApp, e-mail…"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="r-username">Identifiant</Label>
            <Input
              id="r-username"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="r-password">Mot de passe initial</Label>
            <div className="flex gap-2">
              <Input
                id="r-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="≥ 8 caractères"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setPassword(generatePassword())}
              >
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
              onChange={e => setInitialCredits(e.target.value)}
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
                  initialCredits: Math.max(
                    0,
                    parseInt(initialCredits, 10) || 0
                  ),
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
          resellers.data.map(r => (
            <ResellerCard key={r.id} reseller={r} clientNames={clientNames} />
          ))
        ) : (
          <div className="rounded-xl border border-border bg-card py-12 text-center text-muted-foreground">
            {resellers.isLoading ? "Chargement…" : "Aucun revendeur"}
          </div>
        )}
      </div>

      {/* One-time password reveal */}
      <Dialog
        open={!!createdCredential}
        onOpenChange={open => !open && setCreatedCredential(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              Revendeur créé
            </DialogTitle>
            <DialogDescription>
              Transmettez ces identifiants au revendeur. Le mot de passe n'est
              affiché
              <strong className="text-foreground"> qu'une seule fois</strong> —
              il ne sera jamais ré-affichable.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <CredentialRow
              label="Identifiant"
              value={createdCredential?.username ?? ""}
              onCopy={copy}
            />
            <CredentialRow
              label="Mot de passe"
              value={createdCredential?.password ?? ""}
              onCopy={copy}
              mono
            />
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
        <code
          className={`flex-1 text-sm text-foreground ${mono ? "font-mono" : ""}`}
        >
          {value}
        </code>
        <button
          type="button"
          onClick={() => onCopy(value)}
          aria-label={`Copier ${label}`}
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
  isActive: boolean;
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
  const [creditReason, setCreditReason] = useState("");
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState(reseller.name);
  const [editContact, setEditContact] = useState(reseller.contact ?? "");
  const [editUsername, setEditUsername] = useState(reseller.username);
  const [editReason, setEditReason] = useState("");
  const [resetOpen, setResetOpen] = useState(false);
  const [resetPassword, setResetPassword] = useState("");
  const [resetReason, setResetReason] = useState("");
  const [resetCredential, setResetCredential] = useState<{
    username: string;
    password: string;
  } | null>(null);
  const [statusOpen, setStatusOpen] = useState(false);
  const [statusReason, setStatusReason] = useState("");

  const addCredits = trpc.admin.resellerAddCredits.useMutation({
    onSuccess: () => {
      toast("Crédits ajoutés.", "success");
      setAmount("");
      setCreditReason("");
      utils.admin.resellerList.invalidate();
      utils.admin.resellerCreditHistory.invalidate({
        resellerId: reseller.id,
        limit: 200,
      });
    },
    onError: e => toast(e.message || "Échec de l'ajout de crédits", "error"),
  });

  const updateProfile = trpc.admin.resellerUpdate.useMutation({
    onSuccess: () => {
      toast("Profil du revendeur mis à jour.", "success");
      setEditOpen(false);
      setEditReason("");
      utils.admin.resellerList.invalidate();
      utils.admin.resellerAdminHistory.invalidate({
        resellerId: reseller.id,
        limit: 100,
      });
    },
    onError: e => toast(e.message || "Échec de la modification", "error"),
  });

  const resetPasswordMutation = trpc.admin.resellerResetPassword.useMutation({
    onSuccess: data => {
      setResetCredential({
        username: data.username,
        password: resetPassword,
      });
      setResetOpen(false);
      setResetPassword("");
      setResetReason("");
      utils.admin.resellerAdminHistory.invalidate({
        resellerId: reseller.id,
        limit: 100,
      });
    },
    onError: e => toast(e.message || "Échec de la réinitialisation", "error"),
  });

  const setActive = trpc.admin.resellerSetActive.useMutation({
    onSuccess: data => {
      toast(
        data.isActive ? "Revendeur réactivé." : "Revendeur suspendu.",
        "success"
      );
      setStatusOpen(false);
      setStatusReason("");
      utils.admin.resellerList.invalidate();
      utils.admin.resellerAdminHistory.invalidate({
        resellerId: reseller.id,
        limit: 100,
      });
    },
    onError: e => toast(e.message || "Échec du changement de statut", "error"),
  });

  const history = trpc.admin.resellerActivationHistory.useQuery(
    { resellerId: reseller.id },
    { enabled: open }
  );
  const creditHistory = trpc.admin.resellerCreditHistory.useQuery(
    { resellerId: reseller.id, limit: 200 },
    { enabled: open }
  );
  const adminHistory = trpc.admin.resellerAdminHistory.useQuery(
    { resellerId: reseller.id, limit: 100 },
    { enabled: open }
  );

  const amountNum = Math.max(0, parseInt(amount, 10) || 0);

  const openEditDialog = () => {
    setEditName(reseller.name);
    setEditContact(reseller.contact ?? "");
    setEditUsername(reseller.username);
    setEditReason("");
    setEditOpen(true);
  };

  const copy = (text: string) => {
    navigator.clipboard?.writeText(text).then(
      () => toast("Copié dans le presse-papiers.", "success"),
      () => toast("Copie impossible.", "error")
    );
  };

  return (
    <>
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
            <Badge
              variant="outline"
              className={
                reseller.isActive
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  : "border-red-500/30 bg-red-500/10 text-red-400"
              }
            >
              {reseller.isActive ? "Actif" : "Suspendu"}
            </Badge>
            <Badge
              variant="outline"
              className="border-amber-500/30 bg-amber-500/10 text-amber-400"
            >
              <Coins className="mr-1 h-3.5 w-3.5" />
              {reseller.credits} crédits
            </Badge>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="Montant"
                className="h-9 w-28"
              />
              <Input
                value={creditReason}
                onChange={e => setCreditReason(e.target.value)}
                placeholder="Motif obligatoire"
                className="h-9 w-44"
              />
              <Button
                size="sm"
                variant="outline"
                disabled={
                  amountNum < 1 ||
                  creditReason.trim().length < 3 ||
                  addCredits.isPending
                }
                onClick={() =>
                  addCredits.mutate({
                    resellerId: reseller.id,
                    amount: amountNum,
                    reason: creditReason.trim(),
                  })
                }
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                Crédits
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={openEditDialog}>
                <Pencil className="mr-1 h-3.5 w-3.5" />
                Modifier
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setResetPassword(generatePassword());
                  setResetReason("");
                  setResetOpen(true);
                }}
              >
                <KeyRound className="mr-1 h-3.5 w-3.5" />
                Mot de passe
              </Button>
              <Button
                size="sm"
                variant={reseller.isActive ? "destructive" : "outline"}
                onClick={() => {
                  setStatusReason("");
                  setStatusOpen(true);
                }}
              >
                {reseller.isActive ? (
                  <UserRoundX className="mr-1 h-3.5 w-3.5" />
                ) : (
                  <UserCheck className="mr-1 h-3.5 w-3.5" />
                )}
                {reseller.isActive ? "Suspendre" : "Réactiver"}
              </Button>
            </div>
          </div>
        </div>

        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center justify-between border-t border-border px-5 py-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <span className="flex items-center gap-2">
                <KeyRound className="h-4 w-4" />
                Historique d'activations et de crédits
              </span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="overflow-x-auto border-t border-border">
              <div className="flex items-center gap-2 px-5 py-3 text-sm font-medium text-foreground">
                <KeyRound className="h-4 w-4 text-[#8ba26f]" />
                Activations
              </div>
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
                    history.data.map(a => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium text-foreground">
                          {clientNames.get(a.appClientId) ?? "—"}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {a.mac}
                        </TableCell>
                        <TableCell>{licenseLabel(a.licenseType)}</TableCell>
                        <TableCell>
                          {a.creditsCharged} crédit
                          {a.creditsCharged > 1 ? "s" : ""}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDateTime(a.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="py-8 text-center text-muted-foreground"
                      >
                        {history.isLoading
                          ? "Chargement…"
                          : "Aucune activation"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="overflow-x-auto border-t border-border">
              <div className="flex items-center gap-2 px-5 py-3 text-sm font-medium text-foreground">
                <History className="h-4 w-4 text-amber-400" />
                Grand livre des crédits
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Motif</TableHead>
                    <TableHead>Variation</TableHead>
                    <TableHead>Solde après</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {creditHistory.data && creditHistory.data.length > 0 ? (
                    creditHistory.data.map(entry => (
                      <TableRow key={entry.id}>
                        <TableCell className="text-muted-foreground">
                          {formatDateTime(entry.createdAt)}
                        </TableCell>
                        <TableCell>
                          {CREDIT_ENTRY_LABELS[entry.entryType]}
                        </TableCell>
                        <TableCell
                          className={
                            entry.delta >= 0
                              ? "text-emerald-500"
                              : "text-amber-500"
                          }
                        >
                          {entry.delta >= 0 ? "+" : ""}
                          {entry.delta}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {entry.balanceAfter}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="py-8 text-center text-muted-foreground"
                      >
                        {creditHistory.isLoading
                          ? "Chargement…"
                          : "Aucun mouvement de crédits"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="overflow-x-auto border-t border-border">
              <div className="flex items-center gap-2 px-5 py-3 text-sm font-medium text-foreground">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                Journal d'administration
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Motif</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminHistory.data && adminHistory.data.length > 0 ? (
                    adminHistory.data.map(entry => (
                      <TableRow key={entry.id}>
                        <TableCell className="text-muted-foreground">
                          {formatDateTime(entry.createdAt)}
                        </TableCell>
                        <TableCell>
                          {ADMIN_ACTION_LABELS[entry.action]}
                        </TableCell>
                        <TableCell>{entry.reason}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="py-8 text-center text-muted-foreground"
                      >
                        {adminHistory.isLoading
                          ? "Chargement…"
                          : "Aucune opération administrative"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le revendeur</DialogTitle>
            <DialogDescription>
              Modifiez son identité publique. Cette opération est journalisée.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`edit-name-${reseller.id}`}>Nom</Label>
              <Input
                id={`edit-name-${reseller.id}`}
                value={editName}
                onChange={e => setEditName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`edit-contact-${reseller.id}`}>Contact</Label>
              <Input
                id={`edit-contact-${reseller.id}`}
                value={editContact}
                onChange={e => setEditContact(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`edit-username-${reseller.id}`}>
                Identifiant
              </Label>
              <Input
                id={`edit-username-${reseller.id}`}
                value={editUsername}
                onChange={e => setEditUsername(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`edit-reason-${reseller.id}`}>Motif</Label>
              <Input
                id={`edit-reason-${reseller.id}`}
                value={editReason}
                onChange={e => setEditReason(e.target.value)}
                placeholder="Motif obligatoire"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Annuler
            </Button>
            <Button
              disabled={
                !editName.trim() ||
                editUsername.trim().length < 3 ||
                editReason.trim().length < 3 ||
                updateProfile.isPending
              }
              onClick={() =>
                updateProfile.mutate({
                  resellerId: reseller.id,
                  name: editName.trim(),
                  contact: editContact.trim() || undefined,
                  username: editUsername.trim(),
                  reason: editReason.trim(),
                })
              }
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
            <DialogDescription>
              Les sessions actuelles du revendeur seront immédiatement
              invalidées. Le nouveau mot de passe ne sera affiché qu'une fois.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`reset-password-${reseller.id}`}>
                Nouveau mot de passe
              </Label>
              <div className="flex gap-2">
                <Input
                  id={`reset-password-${reseller.id}`}
                  value={resetPassword}
                  onChange={e => setResetPassword(e.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setResetPassword(generatePassword())}
                >
                  Générer
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`reset-reason-${reseller.id}`}>Motif</Label>
              <Input
                id={`reset-reason-${reseller.id}`}
                value={resetReason}
                onChange={e => setResetReason(e.target.value)}
                placeholder="Motif obligatoire"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetOpen(false)}>
              Annuler
            </Button>
            <Button
              disabled={
                resetPassword.length < 8 ||
                resetReason.trim().length < 3 ||
                resetPasswordMutation.isPending
              }
              onClick={() =>
                resetPasswordMutation.mutate({
                  resellerId: reseller.id,
                  newPassword: resetPassword,
                  reason: resetReason.trim(),
                })
              }
            >
              Réinitialiser
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reseller.isActive ? "Suspendre" : "Réactiver"} le revendeur
            </DialogTitle>
            <DialogDescription>
              {reseller.isActive
                ? "La connexion et les sessions existantes seront bloquées, sans supprimer son historique."
                : "Le revendeur pourra de nouveau se connecter avec son mot de passe actuel."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor={`status-reason-${reseller.id}`}>Motif</Label>
            <Input
              id={`status-reason-${reseller.id}`}
              value={statusReason}
              onChange={e => setStatusReason(e.target.value)}
              placeholder="Motif obligatoire"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusOpen(false)}>
              Annuler
            </Button>
            <Button
              variant={reseller.isActive ? "destructive" : "default"}
              disabled={statusReason.trim().length < 3 || setActive.isPending}
              onClick={() =>
                setActive.mutate({
                  resellerId: reseller.id,
                  isActive: !reseller.isActive,
                  reason: statusReason.trim(),
                })
              }
            >
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!resetCredential}
        onOpenChange={value => !value && setResetCredential(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mot de passe réinitialisé</DialogTitle>
            <DialogDescription>
              Copiez ces identifiants maintenant. Le mot de passe ne sera plus
              récupérable après la fermeture de cette fenêtre.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <CredentialRow
              label="Identifiant"
              value={resetCredential?.username ?? ""}
              onCopy={copy}
            />
            <CredentialRow
              label="Mot de passe"
              value={resetCredential?.password ?? ""}
              onCopy={copy}
              mono
            />
          </div>
          <DialogFooter>
            <Button onClick={() => setResetCredential(null)}>
              J'ai copié, fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
