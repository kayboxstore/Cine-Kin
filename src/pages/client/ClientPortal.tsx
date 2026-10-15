import { useEffect, useState } from "react";
import { ArrowLeft, LogOut } from "lucide-react";
import SEO from "@/components/SEO";
import { ToastProvider, useToast } from "@/components/Toast";
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
  payment: "Renouvellement",
};

function PortalInner() {
  const { toast } = useToast();
  const { dashboard, isAuthenticated, isLoading, logout, logoutError } =
    useClientPortal();
  const [view, setView] = useState<ClientView>("dashboard");

  // Only a genuine failure (network/5xx) ever reaches this — an
  // UNAUTHORIZED logout response is treated as "already logged out" inside
  // useClientPortal and never becomes a logoutError. The dashboard
  // intentionally stays visible here: a failed logout must not look like a
  // successful one.
  useEffect(() => {
    if (logoutError) {
      toast(
        logoutError.message || "Échec de la déconnexion. Réessayez.",
        "error"
      );
    }
  }, [logoutError, toast]);

  if (isLoading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-[#0a1628]"
        role="status"
      >
        <div
          className="h-10 w-10 animate-spin rounded-full border-2 border-[#5a6b4e]/20 border-t-[#6b7c5c]"
          aria-hidden="true"
        />
        <span className="sr-only">Chargement de l’espace client…</span>
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
                type="button"
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
            type="button"
            onClick={logout}
            aria-label="Se déconnecter"
            title="Déconnexion"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.05] text-white/60 transition-colors hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        {view === "dashboard" && (
          <DashboardView dashboard={dashboard} onNavigate={setView} />
        )}
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
      <SEO
        title="Espace client — Ciné Kin"
        description="Portail client Ciné Kin"
        noIndex
      />
      <PortalInner />
    </ToastProvider>
  );
}
