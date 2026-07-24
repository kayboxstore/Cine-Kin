import { useState } from "react";
import { Coins, Zap } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { useToast } from "@/components/Toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type License = "12_months" | "unlimited";
const COST: Record<License, number> = { "12_months": 1, unlimited: 2 };

export default function DashboardTab({ credits }: { credits: number }) {
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mac, setMac] = useState("");
  const [licenseType, setLicenseType] = useState<License>("12_months");

  const activate = trpc.reseller.activate.useMutation({
    onSuccess: (res) => {
      // Sync the balance from the SERVER value — never recompute client-side.
      utils.reseller.me.setData(undefined, (old) =>
        old ? { ...old, credits: res.remainingCredits ?? old.credits } : old,
      );
      utils.reseller.myActivations.invalidate();
      toast(`Licence activée. Solde restant : ${res.remainingCredits} crédits.`, "success");
      setName("");
      setEmail("");
      setMac("");
      setLicenseType("12_months");
    },
    onError: (e) => toast(e.message || "Échec de l'activation", "error"),
  });

  const cost = COST[licenseType];
  const insufficient = credits < cost;
  const macTooShort = mac.trim().length < 3;

  return (
    <div className="space-y-6">
      {/* Credit balance */}
      <div className="rounded-2xl border border-[#5a6b4e]/25 bg-gradient-to-br from-[#5a6b4e]/15 to-transparent p-6">
        <div className="flex items-center gap-2 text-[#8ba26f]">
          <Coins className="h-5 w-5" />
          <span className="text-sm font-medium uppercase tracking-wide">Solde de crédits</span>
        </div>
        <div className="mt-2 font-display text-5xl font-bold text-white">{credits}</div>
        <p className="mt-2 text-sm text-white/50">1 crédit = 12 mois · 2 crédits = Illimitée</p>
      </div>

      {/* Activation form */}
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
        <h2 className="mb-4 font-display text-lg font-semibold text-white">Activer une licence</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="a-name" className="text-white/70">Nom</Label>
            <Input
              id="a-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border-white/10 bg-white/[0.03] text-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="a-email" className="text-white/70">E-mail (optionnel)</Label>
            <Input
              id="a-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Généré si vide"
              className="border-white/10 bg-white/[0.03] text-white"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="a-mac" className="text-white/70">Adresse MAC</Label>
            <Input
              id="a-mac"
              value={mac}
              onChange={(e) => setMac(e.target.value)}
              placeholder="00:11:22:33:44:55"
              className="border-white/10 bg-white/[0.03] font-mono text-white"
            />
          </div>
        </div>

        {/* License choice — cost shown on each button */}
        <div className="mt-5 space-y-2">
          <Label className="text-white/70">Type de licence</Label>
          <div className="grid gap-3 sm:grid-cols-2">
            {(["12_months", "unlimited"] as License[]).map((lt) => {
              const selected = licenseType === lt;
              const label = lt === "12_months" ? "12 mois" : "Illimitée";
              return (
                <button
                  key={lt}
                  type="button"
                  onClick={() => setLicenseType(lt)}
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors ${
                    selected
                      ? "border-[#5a6b4e] bg-[#5a6b4e]/15"
                      : "border-white/10 bg-white/[0.02] hover:border-white/20"
                  }`}
                >
                  <span className="font-medium text-white">{label}</span>
                  <span
                    className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                      selected ? "bg-[#5a6b4e] text-white" : "bg-white/5 text-white/60"
                    }`}
                  >
                    {COST[lt]} crédit{COST[lt] > 1 ? "s" : ""}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {insufficient && (
          <p className="mt-3 text-sm text-red-400">
            Solde insuffisant pour cette licence ({cost} crédit{cost > 1 ? "s" : ""} requis).
          </p>
        )}

        <div className="mt-5 flex justify-end">
          <Button
            onClick={() =>
              activate.mutate({
                mac: mac.trim(),
                name: name.trim() || undefined,
                email: email.trim() || undefined,
                licenseType,
              })
            }
            disabled={activate.isPending || insufficient || macTooShort}
            className="bg-[#5a6b4e] text-white hover:bg-[#4d5d42]"
          >
            <Zap className="mr-1.5 h-4 w-4" />
            {activate.isPending ? "Activation…" : `Activer (${cost} crédit${cost > 1 ? "s" : ""})`}
          </Button>
        </div>
      </div>
    </div>
  );
}
