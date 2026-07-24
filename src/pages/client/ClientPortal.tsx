import { useState } from "react";
import { ArrowLeft, LogOut } from "lucide-react";
import SEO from "@/components/SEO";
import { ToastProvider } from "@/components/Toast";
import { useClientPortal } from "@/hooks/useClientPortal";
import ClientLogin from "./ClientLogin";
import DashboardView from "./DashboardView";
import PlaylistsView from "./PlaylistsView";
import ParentalView from "./ParentalView";
import PaymentView from "./PaymentView";

export type ClientView = "dashboard" | "playlists" | "parental" | "payment";

const TITLES: Record<ClientView, string> = {
  dashboard: "Espace client",
  playlists: "Playlists",
  parental: "Contrôle parental",
  payment: "Paiement",
};

function PortalInner() {
  const { dashboard, isAuthenticated, isLoading, logout } = useClientPortal();
  const [view, setView] = useState<ClientView>("dashboard");

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a1628]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#5a6b4e]/20 border-t-[#6b7c5c]" />
      </div>
    );
  }

  if (!isAuthenticated || !dashboard) {
    return <ClientLogin />;
  }

  return (
    <div className="min-h-screen bg-[#0a1628] text-white">
      <header className="border-b border-white/[0.08] bg-[#0a1628]/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            {view !== "dashboard" ? (
              <button
                onClick={() => setView("dashboard")}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.05] text-white/70 transition-colors hover:bg-white/[0.08]"
                aria-label="Retour"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            ) : (
              <span
                className="text-lg font-bold tracking-wide text-white"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                Ciné<span className="font-light text-[#6b7c5c]">Kin</span>
              </span>
            )}
            <span className="text-sm text-white/50">{TITLES[view]}</span>
          </div>
          <button
            onClick={logout}
            title="Déconnexion"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.05] text-white/60 transition-colors hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        {view === "dashboard" && <DashboardView dashboard={dashboard} onNavigate={setView} />}
        {view === "playlists" && <PlaylistsView />}
        {view === "parental" && <ParentalView />}
        {view === "payment" && <PaymentView mac={dashboard.mac} />}
      </main>
    </div>
  );
}

export default function ClientPortal() {
  return (
    <ToastProvider>
      <SEO title="Espace client — Ciné Kin" description="Portail client Ciné Kin" />
      <PortalInner />
    </ToastProvider>
  );
}
