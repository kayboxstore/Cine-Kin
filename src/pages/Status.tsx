import { useQuery } from "@tanstack/react-query";
import {
  FiActivity,
  FiCheckCircle,
  FiDatabase,
  FiGlobe,
  FiRefreshCw,
  FiXCircle,
} from "react-icons/fi";
import SEO from "@/components/SEO";
import ScrollReveal from "@/components/ScrollReveal";
import { COMMERCIAL_INFO } from "@/data/commercial";

type CheckState = boolean | null;

type PlatformChecks = {
  website: CheckState;
  api: CheckState;
  database: CheckState;
  checkedAt: Date | null;
};

async function endpointIsReady(path: string, signal?: AbortSignal) {
  try {
    const response = await fetch(path, { cache: "no-store", signal });
    return response.ok;
  } catch {
    return false;
  }
}

export default function Status() {
  const statusQuery = useQuery({
    queryKey: ["public-platform-status"],
    queryFn: async ({ signal }) => {
      const [api, database] = await Promise.all([
        endpointIsReady("/api/health/live", signal),
        endpointIsReady("/api/health/ready", signal),
      ]);
      return { api, database };
    },
    retry: false,
    staleTime: 0,
  });
  const checks: PlatformChecks = {
    website: true,
    api: statusQuery.data?.api ?? null,
    database: statusQuery.data?.database ?? null,
    checkedAt: statusQuery.dataUpdatedAt
      ? new Date(statusQuery.dataUpdatedAt)
      : null,
  };

  const services = [
    { label: "Site public", state: checks.website, icon: FiGlobe },
    { label: "API de l’application", state: checks.api, icon: FiActivity },
    { label: "Base de données", state: checks.database, icon: FiDatabase },
  ];
  const overall = services.every((service) => service.state === true);
  const complete = services.every((service) => service.state !== null);

  return (
    <div className="min-h-screen bg-[#0a1628] pt-20">
      <SEO
        title="État de la plateforme"
        description="Contrôles en direct du site Ciné Kin, de son API et de sa base de données."
      />

      <section className="relative py-16">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 50% 30%, rgba(90,107,78,0.06) 0%, transparent 50%)",
          }}
        />
        <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-8 text-center">
          <ScrollReveal>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.02] mb-5">
              <FiActivity className="w-4 h-4 text-[#6b7c5c]" />
              <span className="text-xs text-white/60 font-medium tracking-wider uppercase">
                Vérification technique
              </span>
            </div>
            <h1 className="font-display font-bold text-4xl sm:text-5xl text-white mb-4 tracking-[-0.02em]">
              État de la <span className="text-[#6b7c5c]">plateforme</span>
            </h1>
            <p className="text-white/60 text-base font-light max-w-2xl mx-auto">
              Ces résultats proviennent des points de contrôle réellement exposés par l’application au moment de la vérification.
            </p>
          </ScrollReveal>
        </div>
      </section>

      <section className="pb-24">
        <div className="max-w-3xl mx-auto px-6 sm:px-8">
          <div className="mb-6 rounded-xl border border-amber-300/15 bg-amber-300/[0.04] p-4 text-sm leading-relaxed text-white/65">
            {COMMERCIAL_INFO.status.scope}
          </div>

          <div className="border border-white/[0.06] rounded-2xl overflow-hidden bg-white/[0.02]">
            {services.map((service) => {
              const Icon = service.icon;
              const StatusIcon = service.state === false ? FiXCircle : FiCheckCircle;
              return (
                <div
                  key={service.label}
                  className="flex items-center justify-between px-5 py-5 border-b border-white/[0.04] last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-white/55" />
                    <span className="text-white/75 text-sm">{service.label}</span>
                  </div>
                  {service.state === null ? (
                    <span className="text-white/45 text-xs">Vérification…</span>
                  ) : (
                    <span
                      className={`inline-flex items-center gap-2 text-xs font-medium ${
                        service.state ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      <StatusIcon className="w-4 h-4" />
                      {service.state ? "Opérationnel" : "Indisponible"}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-white/50 text-xs">
              {!complete
                ? "Vérification en cours…"
                : `${overall ? "Tous les contrôles ont réussi" : "Au moins un contrôle a échoué"} · ${checks.checkedAt?.toLocaleString("fr-FR")}`}
            </p>
            <button
              type="button"
              onClick={() => void statusQuery.refetch()}
              disabled={statusQuery.isFetching}
              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-white/70 transition-colors hover:bg-white/[0.06] disabled:cursor-wait disabled:opacity-50"
            >
              <FiRefreshCw className={`w-4 h-4 ${statusQuery.isFetching ? "animate-spin" : ""}`} />
              Actualiser
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
