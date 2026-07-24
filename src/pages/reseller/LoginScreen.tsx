import { useState } from "react";
import { Store } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { useToast } from "@/components/Toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginScreen() {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const login = trpc.reseller.login.useMutation({
    onSuccess: async () => {
      await utils.reseller.me.invalidate();
    },
    onError: (e) => toast(e.message || "Connexion impossible", "error"),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    login.mutate({ username: username.trim(), password });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a1628] px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#5a6b4e]/15 text-[#8ba26f]">
            <Store className="h-6 w-6" />
          </div>
          <h1
            className="text-2xl font-bold tracking-wide text-white"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            Ciné<span className="font-light text-[#6b7c5c]">Kin</span>
          </h1>
          <p className="mt-1 text-sm text-white/50">Espace revendeur</p>
        </div>

        <form
          onSubmit={submit}
          className="space-y-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6"
        >
          <div className="space-y-2">
            <Label htmlFor="r-username" className="text-white/70">
              Identifiant
            </Label>
            <Input
              id="r-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              className="border-white/10 bg-white/[0.03] text-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="r-password" className="text-white/70">
              Mot de passe
            </Label>
            <Input
              id="r-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="border-white/10 bg-white/[0.03] text-white"
            />
          </div>
          <Button
            type="submit"
            disabled={login.isPending || !username.trim() || !password}
            className="w-full bg-[#5a6b4e] text-white hover:bg-[#4d5d42]"
          >
            {login.isPending ? "Connexion…" : "Se connecter"}
          </Button>
        </form>
      </div>
    </div>
  );
}
