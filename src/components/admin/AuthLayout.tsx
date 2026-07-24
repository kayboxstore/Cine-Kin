import { useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { LogOut, Menu, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// The shadcn `Sidebar` primitive shipped in this repo uses Tailwind v4 syntax
// (w-(--var), --spacing(), has-data-[…]) and is non-functional on this project's
// Tailwind v3 build. This layout keeps the same structure (collapsible-free
// sidebar + user footer + logout) with v3-safe utilities and the marine/olive
// brand tokens (bg-sidebar / text-sidebar-*).

export type AdminMenuItem = { key: string; label: string; icon: LucideIcon };

type AdminUser = { name?: string | null; email?: string | null; avatar?: string | null };

export default function AuthLayout({
  menu,
  active,
  onSelect,
  user,
  onLogout,
  title,
  children,
}: {
  menu: AdminMenuItem[];
  active: string;
  onSelect: (key: string) => void;
  user: AdminUser | null;
  onLogout: () => void;
  title: string;
  children: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const initial = (user?.name || "A").charAt(0).toUpperCase();

  const nav = (
    <nav className="flex flex-col gap-1 px-3 py-2">
      {menu.map((item) => {
        const isActive = item.key === active;
        return (
          <button
            key={item.key}
            onClick={() => {
              onSelect(item.key);
              setMobileOpen(false);
            }}
            aria-current={isActive ? "page" : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring ${
              isActive
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            }`}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );

  const footer = (
    <div className="mt-auto border-t border-sidebar-border p-3">
      <div className="flex items-center gap-3 rounded-lg px-1 py-1">
        <Avatar className="h-9 w-9 shrink-0 border border-sidebar-border">
          {user?.avatar ? <AvatarImage src={user.avatar} alt="" /> : null}
          <AvatarFallback className="bg-sidebar-accent text-xs font-medium text-sidebar-accent-foreground">
            {initial}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium leading-none text-sidebar-foreground">
            {user?.name || "Admin"}
          </p>
          <p className="mt-1.5 truncate text-xs text-sidebar-foreground/55">
            {user?.email || "—"}
          </p>
        </div>
        <button
          onClick={onLogout}
          title="Déconnexion"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-sidebar-foreground/60 transition-colors hover:bg-red-500/10 hover:text-red-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  const sidebarInner = (
    <>
      <div className="flex h-16 items-center px-5">
        <span
          className="text-lg font-bold tracking-wide text-white"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
        >
          Ciné<span className="font-light text-[#6b7c5c]">Kin</span>
        </span>
        <span className="ml-2 rounded bg-sidebar-accent px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-sidebar-accent-foreground">
          Admin
        </span>
      </div>
      {nav}
      {footer}
    </>
  );

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col bg-sidebar md:flex">{sidebarInner}</aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-sidebar shadow-xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-sidebar-foreground/60 hover:bg-sidebar-accent"
              aria-label="Fermer le menu"
            >
              <X className="h-4 w-4" />
            </button>
            {sidebarInner}
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur md:h-16 md:px-8">
          <button
            onClick={() => setMobileOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground/70 hover:bg-accent/10 md:hidden"
            aria-label="Ouvrir le menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="font-display text-lg font-bold text-foreground md:text-xl">{title}</h1>
        </header>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
