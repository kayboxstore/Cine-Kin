import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiArrowRight,
  FiBriefcase,
  FiLogIn,
  FiMonitor,
  FiShield,
} from "react-icons/fi";
import { Paths } from "@contracts/constants";
import Logo from "@/components/Logo";
import SEO from "@/components/SEO";

const portals = [
  {
    title: "Espace client",
    description: "Connexion avec votre adresse MAC et votre code PIN.",
    path: "/espace-client",
    icon: FiMonitor,
  },
  {
    title: "Espace revendeur",
    description: "Gestion des codes, clients et activations.",
    path: "/revendeur",
    icon: FiBriefcase,
  },
  {
    title: "Administration",
    description: "Accès réservé à l’équipe d’administration.",
    path: "/admin",
    icon: FiShield,
  },
] as const;

export default function Login() {
  const [kimiEnabled, setKimiEnabled] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch(Paths.oauthStatus, { cache: "no-store", signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((result: { enabled?: boolean } | null) => {
        if (result?.enabled) setKimiEnabled(true);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a1628] flex items-center justify-center px-6 py-12">
      <SEO
        title="Connexion"
        description="Choisissez votre espace client, revendeur ou administration Ciné Kin Premium."
      />

      <div className="w-full max-w-4xl">
        <div className="text-center mb-9">
          <Logo size={48} variant="full" className="justify-center mb-6" />
          <h1 className="font-display font-bold text-3xl text-white mb-2">
            Choisissez votre espace
          </h1>
          <p className="text-white/60 text-sm">
            Chaque portail utilise ses propres identifiants et sa propre session.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {portals.map((portal) => {
            const Icon = portal.icon;
            return (
              <Link
                key={portal.path}
                to={portal.path}
                className="group flex min-h-56 flex-col rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 transition-all hover:-translate-y-1 hover:border-[#6b7c5c]/35 hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6b7c5c]"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#5a6b4e]/15 text-[#8ba26f]">
                  <Icon className="h-6 w-6" />
                </div>
                <h2 className="font-display text-lg font-semibold text-white">
                  {portal.title}
                </h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-white/55">
                  {portal.description}
                </p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[#8ba26f]">
                  Continuer
                  <FiArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            );
          })}
        </div>

        {kimiEnabled && (
          <div className="mt-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 text-center">
            <p className="mb-3 text-xs text-white/50">
              Option d’administration configurée pour cette installation
            </p>
            <a
              href={Paths.oauthStart}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#6b7c5c]/25 bg-[#5a6b4e]/10 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#5a6b4e]/20"
            >
              <FiLogIn className="h-4 w-4" />
              Se connecter avec Kimi
            </a>
          </div>
        )}

        <div className="text-center mt-7">
          <Link
            to="/"
            className="text-white/55 hover:text-[#8ba26f] text-sm transition-colors"
          >
            Retour à l’accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
