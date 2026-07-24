import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LayoutDashboard, MonitorSmartphone, ShieldAlert, ShoppingCart, Store, Zap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import SEO from "@/components/SEO";
import { ToastProvider } from "@/components/Toast";
import AuthLayout, { type AdminMenuItem } from "@/components/admin/AuthLayout";
import { AuthLayoutSkeleton } from "@/components/admin/AuthLayoutSkeleton";
import OverviewSection from "./sections/OverviewSection";
import OrdersSection from "./sections/OrdersSection";
import ClientsSection from "./sections/ClientsSection";
import ActivationsSection from "./sections/ActivationsSection";
import ResellersSection from "./sections/ResellersSection";

const MENU: AdminMenuItem[] = [
  { key: "overview", label: "Vue d'ensemble", icon: LayoutDashboard },
  { key: "orders", label: "Commandes", icon: ShoppingCart },
  { key: "clients", label: "Clients", icon: MonitorSmartphone },
  { key: "activations", label: "Activations", icon: Zap },
  { key: "resellers", label: "Revendeurs", icon: Store },
];

function AdminPanelInner() {
  const navigate = useNavigate();
  const { user, isLoading, logout } = useAuth({ redirectOnUnauthenticated: true });
  const [section, setSection] = useState("overview");

  // Loading, or redirecting an unauthenticated visitor to /login.
  if (isLoading || !user) {
    return <AuthLayoutSkeleton />;
  }

  if (user.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="max-w-md text-center">
          <ShieldAlert className="mx-auto mb-4 h-12 w-12 text-red-400" />
          <h1 className="font-display text-2xl font-bold text-foreground">Accès refusé</h1>
          <p className="mt-2 text-muted-foreground">
            Vous devez être administrateur pour accéder à ce panneau.
          </p>
          <button
            onClick={() => navigate("/")}
            className="mt-6 rounded-xl bg-[#5a6b4e] px-6 py-3 text-white transition-colors hover:bg-[#4d5d42]"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  const active = MENU.find((m) => m.key === section) ?? MENU[0];

  return (
    <AuthLayout
      menu={MENU}
      active={section}
      onSelect={setSection}
      user={user}
      onLogout={logout}
      title={active.label}
    >
      {section === "overview" && <OverviewSection />}
      {section === "orders" && <OrdersSection />}
      {section === "clients" && <ClientsSection />}
      {section === "activations" && <ActivationsSection />}
      {section === "resellers" && <ResellersSection />}
    </AuthLayout>
  );
}

export default function AdminPanel() {
  return (
    <ToastProvider>
      <SEO title="Panel Admin — Licences" description="Gestion des licences application Ciné Kin" />
      <AdminPanelInner />
    </ToastProvider>
  );
}
