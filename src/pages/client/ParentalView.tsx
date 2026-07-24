import { useMemo, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { useToast } from "@/components/Toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type Step = "current" | "new" | "confirm";

const STEP_LABEL: Record<Step, string> = {
  current: "Code actuel",
  new: "Nouveau code",
  confirm: "Confirmer le code",
};

export default function ParentalView() {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const parental = trpc.clientPortal.getParentalControl.useQuery();

  const enabled = parental.data?.enabled ?? false;
  // The "current code" step only exists once a code has been set.
  const steps = useMemo<Step[]>(
    () => (enabled ? ["current", "new", "confirm"] : ["new", "confirm"]),
    [enabled],
  );

  const [stepIdx, setStepIdx] = useState(0);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");

  const update = trpc.clientPortal.updateParentalControl.useMutation({
    onSuccess: () => {
      toast("Code parental mis à jour.", "success");
      setStepIdx(0);
      setCurrent("");
      setNext("");
      setConfirm("");
      utils.clientPortal.getParentalControl.invalidate();
      utils.clientPortal.getDashboard.invalidate();
    },
    onError: (e) => toast(e.message || "Échec de la mise à jour", "error"),
  });

  const step = steps[Math.min(stepIdx, steps.length - 1)];
  const value = step === "current" ? current : step === "new" ? next : confirm;
  const setValue = step === "current" ? setCurrent : step === "new" ? setNext : setConfirm;

  const isLast = stepIdx === steps.length - 1;
  const canAdvance = value.length === 4;

  const advance = () => {
    if (!canAdvance) return;
    if (!isLast) {
      setStepIdx((i) => i + 1);
      return;
    }
    if (next !== confirm) {
      toast("Les codes ne correspondent pas.", "error");
      return;
    }
    update.mutate({
      currentCode: enabled ? current : undefined,
      newCode: next,
    });
  };

  if (parental.isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#5a6b4e]/20 border-t-[#6b7c5c]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="space-y-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#5a6b4e]/15 text-[#8ba26f]">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold text-white">Contrôle parental</h2>
            <p className="text-sm text-white/50">
              {enabled ? "Modifier le code à 4 chiffres" : "Définir un code à 4 chiffres"}
            </p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2">
          {steps.map((s, i) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full ${
                i <= stepIdx ? "bg-[#6b7c5c]" : "bg-white/10"
              }`}
            />
          ))}
        </div>

        <div className="space-y-2">
          <Label htmlFor="pc-code" className="text-white/70">
            {STEP_LABEL[step]} ({stepIdx + 1}/{steps.length})
          </Label>
          <input
            id="pc-code"
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/\D/g, "").slice(0, 4))}
            inputMode="numeric"
            autoComplete="off"
            placeholder="••••"
            className="h-14 w-full rounded-lg border border-white/10 bg-white/[0.03] text-center font-mono text-3xl tracking-[0.6em] text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6b7c5c]"
          />
        </div>

        <div className="flex gap-2">
          {stepIdx > 0 && (
            <Button
              variant="ghost"
              onClick={() => setStepIdx((i) => Math.max(0, i - 1))}
              className="flex-1"
            >
              Retour
            </Button>
          )}
          <Button
            onClick={advance}
            disabled={!canAdvance || update.isPending}
            className="flex-1 bg-[#5a6b4e] text-white hover:bg-[#4d5d42]"
          >
            {update.isPending ? "Enregistrement…" : isLast ? "Valider" : "Continuer"}
          </Button>
        </div>
      </div>
    </div>
  );
}
