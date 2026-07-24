import { useState } from "react";
import { Coins, KeyRound, LayoutDashboard, ListChecks, LogOut } from "lucide-react";
import SEO from "@/components/SEO";
import { ToastProvider } from "@/components/Toast";
import { useReseller } from "@/hooks/useReseller";
import LoginScreen from "./LoginScreen";
import DashboardTab from "./DashboardTab";
import ActivationsTab from "./ActivationsTab";
import PasswordTab from "./PasswordTab";

type Tab = "dashboard" | "activations" | "password";

const TABS: { key: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { key: "activations", label: "Mes activations", icon: ListChecks },
  { key: "password", label: "Mot de passe", icon: KeyRound },
];

function PortalInner() {
  const { reseller, isAuthenticated, isLoading, logout } = useReseller();
  const [tab, setTab] = useState<Tab>("dashboard");

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a1628]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#5a6b4e]/20 border-t-[#6b7c5c]" />
      </div>
    );
  }

  if (!isAuthenticated || !reseller) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-[#0a1628] text-white">
      {/* Header */}
      <header className="border-b border-white/[0.08] bg-[#0a1628]/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <span
              className="text-lg font-bold tracking-wide text-white"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              Ciné<span className="font-light text-[#6b7c5c]">Kin</span>
            </span>
            <span className="ml-2 text-sm text-white/50">Espace revendeur</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-lg border border-[#5a6b4e]/30 bg-[#5a6b4e]/10 px-3 py-1.5 text-sm text-[#8ba26f]">
              <Coins className="h-4 w-4" />
              <span className="font-semibold">{reseller.credits}</span>
              <span className="hidden text-[#8ba26f]/70 sm:inline">crédits</span>
            </div>
            <button
              onClick={logout}
              title="Déconnexion"
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.05] text-white/60 transition-colors hover:bg-red-500/10 hover:text-red-400"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <nav className="flex gap-1 overflow-x-auto">
            {TABS.map((t) => {
              const active = t.key === tab;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                    active
                      ? "border-[#6b7c5c] text-white"
                      : "border-transparent text-white/50 hover:text-white/80"
                  }`}
                >
                  <t.icon className="h-4 w-4" />
                  {t.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        {tab === "dashboard" && <DashboardTab credits={reseller.credits} />}
        {tab === "activations" && <ActivationsTab />}
        {tab === "password" && <PasswordTab />}
      </main>
    </div>
  );
}

export default function ResellerPortal() {
  return (
    <ToastProvider>
      <SEO title="Espace revendeur — Ciné Kin" description="Portail revendeur Ciné Kin" />
      <PortalInner />
    </ToastProvider>
  );
}
