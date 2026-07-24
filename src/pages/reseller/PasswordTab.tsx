import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { useToast } from "@/components/Toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function PasswordTab() {
  const { toast } = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");

  const change = trpc.reseller.changePassword.useMutation({
    onSuccess: () => {
      toast("Mot de passe mis à jour.", "success");
      setCurrent("");
      setNext("");
      setConfirm("");
    },
    onError: (e) => toast(e.message || "Échec de la mise à jour", "error"),
  });

  const tooShort = next.length > 0 && next.length < 8;
  const mismatch = confirm.length > 0 && next !== confirm;
  const canSubmit = current && next.length >= 8 && next === confirm && !change.isPending;

  return (
    <div className="max-w-md">
      <div className="space-y-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
        <h2 className="font-display text-lg font-semibold text-white">Modifier le mot de passe</h2>

        <div className="space-y-2">
          <Label htmlFor="p-current" className="text-white/70">Mot de passe actuel</Label>
          <Input
            id="p-current"
            type="password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            autoComplete="current-password"
            className="border-white/10 bg-white/[0.03] text-white"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="p-next" className="text-white/70">Nouveau mot de passe</Label>
          <Input
            id="p-next"
            type="password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            autoComplete="new-password"
            className="border-white/10 bg-white/[0.03] text-white"
          />
          {tooShort && <p className="text-xs text-red-400">Au moins 8 caractères.</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="p-confirm" className="text-white/70">Confirmer le nouveau mot de passe</Label>
          <Input
            id="p-confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            className="border-white/10 bg-white/[0.03] text-white"
          />
          {mismatch && <p className="text-xs text-red-400">Les mots de passe ne correspondent pas.</p>}
        </div>

        <Button
          onClick={() => change.mutate({ currentPassword: current, newPassword: next })}
          disabled={!canSubmit}
          className="w-full bg-[#5a6b4e] text-white hover:bg-[#4d5d42]"
        >
          {change.isPending ? "Mise à jour…" : "Mettre à jour"}
        </Button>
      </div>
    </div>
  );
}
