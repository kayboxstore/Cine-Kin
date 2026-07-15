import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiMenu, FiX, FiLogIn, FiLogOut, FiUser, FiShield } from "react-icons/fi";
import { useAuth } from "@/hooks/useAuth";
import Logo from "./Logo";

const NAV_LINKS = [
  { name: "Accueil", path: "/" },
  { name: "Offres", path: "/offres" },
  { name: "Revendeurs", path: "/revendeurs" },
  { name: "Tutoriels", path: "/tutoriels" },
  { name: "Contact", path: "/contact" },
];

// Preload map for route prefetching
const preloadMap: Record<string, () => Promise<unknown>> = {
  "/offres": () => import("@/pages/Offres"),
  "/revendeurs": () => import("@/pages/Revendeurs"),
  "/commande": () => import("@/pages/Commande"),
  "/tutoriels": () => import("@/pages/Tutoriels"),
  "/contact": () => import("@/pages/Contact"),
  "/faq": () => import("@/pages/Faq"),
  "/blog": () => import("@/pages/Blog"),
};

function PrefetchLink({ to, children, className }: { to: string; children: React.ReactNode; className?: string }) {
  const [prefetched, setPrefetched] = useState(false);

  const handleMouseEnter = () => {
    if (!prefetched && preloadMap[to]) {
      preloadMap[to]();
      setPrefetched(true);
    }
  };

  return (
    <Link to={to} className={className} onMouseEnter={handleMouseEnter}>
      {children}
    </Link>
  );
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => { setIsOpen(false); }, [location]);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" as const }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-[#0a1628]/90 backdrop-blur-xl border-b border-white/[0.03]"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 sm:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="group">
            <Logo size={32} variant="full" />
          </Link>

          <div className="hidden lg:flex items-center gap-0.5">
            {NAV_LINKS.map((link) => (
              <PrefetchLink
                key={link.path}
                to={link.path}
                className={`relative px-3.5 py-1.5 text-[13px] font-medium rounded-md transition-all duration-300 tracking-wide ${
                  location.pathname === link.path
                    ? "text-white"
                    : "text-white/45 hover:text-white/75"
                }`}
              >
                {link.name}
                {location.pathname === link.path && (
                  <motion.div layoutId="nav-indicator" className="absolute bottom-0 left-3.5 right-3.5 h-px bg-[#5a6b4e]/40" transition={{ type: "spring", stiffness: 300, damping: 30 }} />
                )}
              </PrefetchLink>
            ))}
            {isAdmin && (
              <Link
                to="/admin"
                className={`relative px-3.5 py-1.5 text-[13px] font-medium rounded-md transition-all duration-300 tracking-wide flex items-center gap-1.5 ${
                  location.pathname === "/admin"
                    ? "text-[#6b7c5c]"
                    : "text-white/45 hover:text-white/75"
                }`}
              >
                <FiShield className="w-3.5 h-3.5" />
                Dashboard
                {location.pathname === "/admin" && (
                  <motion.div layoutId="nav-indicator" className="absolute bottom-0 left-3.5 right-3.5 h-px bg-[#5a6b4e]/40" transition={{ type: "spring", stiffness: 300, damping: 30 }} />
                )}
              </Link>
            )}
          </div>

          <div className="hidden lg:flex items-center gap-2">
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.03] rounded-full border border-white/[0.06]">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="" className="w-5 h-5 rounded-full" />
                  ) : (
                    <FiUser className="w-3.5 h-3.5 text-[#6b7c5c]" />
                  )}
                  <span className="text-white/70 text-xs">{user?.name || "User"}</span>
                  {isAdmin && (
                    <span className="px-1.5 py-0.5 bg-[#5a6b4e]/15 text-[#6b7c5c] text-[9px] font-bold rounded uppercase">
                      Admin
                    </span>
                  )}
                </div>
                <button
                  onClick={logout}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-all"
                  title="Déconnexion"
                >
                  <FiLogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 text-xs font-semibold text-white/60 hover:text-white bg-white/[0.03] hover:bg-white/[0.06] rounded-full transition-all tracking-wide flex items-center gap-1.5 border border-white/[0.06]"
              >
                <FiLogIn className="w-3.5 h-3.5" />
                Connexion
              </Link>
            )}
            <Link
              to="/commande"
              className="px-5 py-2.5 text-xs font-semibold text-white bg-[#5a6b4e] rounded-full hover:bg-[#4d5d42] transition-all tracking-wide"
            >
              Commander
            </Link>
          </div>

          <div className="flex lg:hidden items-center gap-2">
            <Link
              to="/commande"
              className="px-4 py-2 text-xs font-semibold text-white bg-[#5a6b4e] rounded-full hover:bg-[#4d5d42] transition-all tracking-wide"
            >
              Commander
            </Link>
            <button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-lg text-white/35 hover:text-white/65 transition-colors">
              {isOpen ? <FiX className="w-4 h-4" /> : <FiMenu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden bg-[#050b14] border-t border-white/[0.08] overflow-hidden"
          >
            <div className="px-6 py-6 space-y-0.5">
              {NAV_LINKS.map((link) => (
                <Link key={link.path} to={link.path} className={`block px-4 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  location.pathname === link.path ? "text-white bg-white/[0.03]" : "text-white/35 hover:text-white/65"
                }`}>
                  {link.name}
                </Link>
              ))}
              {isAdmin && (
                <Link to="/admin" className={`block px-4 py-2.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
                  location.pathname === "/admin" ? "text-[#6b7c5c] bg-white/[0.03]" : "text-white/35 hover:text-white/65"
                }`}>
                  <FiShield className="w-3.5 h-3.5" />
                  Dashboard
                </Link>
              )}

              {/* Mobile auth section */}
              <div className="border-t border-white/[0.06] pt-4 mt-4">
                {isAuthenticated ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 px-4 py-2">
                      {user?.avatar ? (
                        <img src={user.avatar} alt="" className="w-6 h-6 rounded-full" />
                      ) : (
                        <FiUser className="w-4 h-4 text-[#6b7c5c]" />
                      )}
                      <span className="text-white/70 text-xs">{user?.name || "User"}</span>
                      {isAdmin && (
                        <span className="px-1.5 py-0.5 bg-[#5a6b4e]/15 text-[#6b7c5c] text-[9px] font-bold rounded uppercase">
                          Admin
                        </span>
                      )}
                    </div>
                    <button
                      onClick={logout}
                      className="w-full text-left px-4 py-2.5 rounded-lg text-xs text-red-400/70 hover:text-red-400 hover:bg-red-400/5 transition-all flex items-center gap-2"
                    >
                      <FiLogOut className="w-3.5 h-3.5" />
                      Déconnexion
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/login"
                    className="block px-4 py-2.5 rounded-lg text-xs text-white/60 hover:text-white bg-white/[0.03] transition-all flex items-center gap-2"
                  >
                    <FiLogIn className="w-3.5 h-3.5" />
                    Connexion Admin
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
