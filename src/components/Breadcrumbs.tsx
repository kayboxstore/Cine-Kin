import { Link, useLocation } from "react-router-dom";
import { FiChevronRight, FiHome } from "react-icons/fi";

const routeNames: Record<string, string> = {
  "": "Accueil",
  offres: "Offres",
  revendeurs: "Revendeurs",
  commande: "Commande",
  support: "Support",
  contact: "Contact",
  "a-propos": "À Propos",
  conditions: "Conditions",
  "politique-confidentialite": "Confidentialité",
  "mentions-legales": "Mentions légales",
  tutoriels: "Tutoriels",
  blog: "Blog",
  login: "Connexion",
};

export default function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  if (pathnames.length === 0) return null;

  return (
    <nav className="py-4 px-6 sm:px-8" aria-label="Breadcrumb">
      <ol className="flex items-center gap-2 text-xs">
        <li>
          <Link to="/" className="text-white/55 hover:text-white/60 transition-colors flex items-center gap-1">
            <FiHome className="w-3 h-3" />
            <span className="hidden sm:inline">Accueil</span>
          </Link>
        </li>
        {pathnames.map((name, index) => {
          const routeTo = `/${pathnames.slice(0, index + 1).join("/")}`;
          const isLast = index === pathnames.length - 1;
          return (
            <li key={name} className="flex items-center gap-2">
              <FiChevronRight className="w-3 h-3 text-white/15" />
              {isLast ? (
                <span className="text-white/50 font-medium">{routeNames[name] || name}</span>
              ) : (
                <Link to={routeTo} className="text-white/55 hover:text-white/60 transition-colors">
                  {routeNames[name] || name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
