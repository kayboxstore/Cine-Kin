import { motion } from "framer-motion";
import { FiActivity, FiCheckCircle, FiServer, FiGlobe, FiTv, FiFilm, FiHeadphones, FiClock } from "react-icons/fi";
import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import ScrollReveal from "@/components/ScrollReveal";

const SERVICES = [
  { label: "Serveurs principaux", status: "Opérationnel", uptime: "99.98%", icon: FiServer, active: true },
  { label: "Chaînes Live", status: "15 240 actives", uptime: "99.95%", icon: FiTv, active: true },
  { label: "Catalogue VOD", status: "45 800+ titres", uptime: "100%", icon: FiFilm, active: true },
  { label: "API WhatsApp", status: "Opérationnel", uptime: "99.99%", icon: FiGlobe, active: true },
  { label: "Anti-freeze", status: "Actif", uptime: "-", icon: FiActivity, active: true },
  { label: "Support client", status: "En ligne", uptime: "08h-23h", icon: FiHeadphones, active: true },
  { label: "Mise à jour EPG", status: "Automatique", uptime: "Toutes les 6h", icon: FiClock, active: true },
  { label: "Système de paiement", status: "Opérationnel", uptime: "99.99%", icon: FiCheckCircle, active: true },
];

const INCIDENTS = [
  { date: "10 juillet 2026", time: "14:32", title: "Mise à jour serveurs", status: "Résolu", duration: "3 min" },
  { date: "8 juillet 2026", time: "03:15", title: "Maintenance planifiée", status: "Résolu", duration: "12 min" },
  { date: "5 juillet 2026", time: "22:47", title: "Optimisation VOD", status: "Résolu", duration: "5 min" },
];

export default function Status() {
  return (
    <div className="min-h-screen bg-[#0a1628] pt-20">
      <SEO
        title="Statut des serveurs - Ciné Kin Premium"
        description="Vérifiez l'état de nos serveurs en temps réel. Uptime, chaînes actives, VOD disponible."
      />

      {/* Hero */}
      <section className="relative py-16">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(90,107,78,0.06) 0%, transparent 50%)" }}
        />
        <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-8 text-center">
          <ScrollReveal>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/15 bg-emerald-500/5 mb-5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <span className="text-xs text-emerald-400 font-medium tracking-wider uppercase">Tous systèmes opérationnels</span>
            </div>
            <h1 className="font-display font-bold text-4xl sm:text-5xl text-white mb-4 tracking-[-0.02em]">
              État des <span className="text-[#6b7c5c]">serveurs</span>
            </h1>
            <p className="text-white/45 text-base font-light max-w-md mx-auto">
              Surveillance en temps réel de tous nos services. Mise à jour automatique.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Services */}
      <section className="pb-16">
        <div className="max-w-3xl mx-auto px-6 sm:px-8">
          <div className="border border-white/[0.06] rounded-2xl overflow-hidden bg-white/[0.02]">
            {SERVICES.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-center justify-between px-5 py-4 border-b border-white/[0.03] last:border-0 hover:bg-white/[0.01] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-white/30" />
                    <span className="text-white/70 text-sm">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                      </span>
                      <span className="text-emerald-400 text-xs font-medium">{item.status}</span>
                    </div>
                    <span className="text-white/25 text-xs font-mono hidden sm:block w-20 text-right">{item.uptime}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="pb-16">
        <div className="max-w-3xl mx-auto px-6 sm:px-8">
          <ScrollReveal>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Uptime global", value: "99.98%" },
                { label: "Chaînes actives", value: "15 240" },
                { label: "Titres VOD", value: "45 800+" },
                { label: "Latence moyenne", value: "12ms" },
              ].map((stat, i) => (
                <div key={i} className="border border-white/[0.04] rounded-xl p-4 text-center bg-white/[0.02]">
                  <div className="font-display font-bold text-xl text-white mb-1">{stat.value}</div>
                  <div className="text-white/30 text-xs">{stat.label}</div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Incidents history */}
      <section className="pb-24">
        <div className="max-w-3xl mx-auto px-6 sm:px-8">
          <ScrollReveal>
            <h2 className="font-display font-bold text-xl text-white mb-6">Historique des incidents</h2>
          </ScrollReveal>

          <div className="border border-white/[0.06] rounded-2xl overflow-hidden bg-white/[0.02]">
            <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-white/[0.02] border-b border-white/[0.04] text-white/25 text-xs uppercase tracking-wider">
              <div className="col-span-3 sm:col-span-2">Date</div>
              <div className="col-span-5 sm:col-span-5">Description</div>
              <div className="col-span-2 sm:col-span-2 text-center">Statut</div>
              <div className="col-span-2 sm:col-span-3 text-right">Durée</div>
            </div>
            {INCIDENTS.map((incident, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="grid grid-cols-12 gap-4 px-5 py-4 border-b border-white/[0.03] last:border-0 items-center"
              >
                <div className="col-span-3 sm:col-span-2 text-white/40 text-xs">{incident.date}</div>
                <div className="col-span-5 sm:col-span-5 text-white/60 text-sm">{incident.title}</div>
                <div className="col-span-2 sm:col-span-2 text-center">
                  <span className="text-emerald-400 text-xs font-medium">{incident.status}</span>
                </div>
                <div className="col-span-2 sm:col-span-3 text-right text-white/30 text-xs font-mono">{incident.duration}</div>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link to="/" className="text-[#6b7c5c] text-sm hover:underline">
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
