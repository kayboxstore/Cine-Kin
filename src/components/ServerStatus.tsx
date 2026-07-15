import { motion } from "framer-motion";
import { FiCheckCircle, FiActivity, FiServer, FiGlobe, FiTv, FiFilm } from "react-icons/fi";
import ScrollReveal from "./ScrollReveal";

const STATUS_ITEMS = [
  { label: "Serveurs principaux", status: "Opérationnel", uptime: "99.98%", icon: FiServer, color: "text-emerald-400" },
  { label: "Chaînes Live", status: "15 240 actives", uptime: "99.95%", icon: FiTv, color: "text-emerald-400" },
  { label: "Catalogue VOD", status: "45 800+ titres", uptime: "100%", icon: FiFilm, color: "text-emerald-400" },
  { label: "API WhatsApp", status: "Opérationnel", uptime: "99.99%", icon: FiGlobe, color: "text-emerald-400" },
  { label: "Anti-freeze", status: "Actif", uptime: "-", icon: FiActivity, color: "text-emerald-400" },
  { label: "Support Live", status: "En ligne", uptime: "08h-23h", icon: FiCheckCircle, color: "text-emerald-400" },
];

export default function ServerStatus() {
  return (
    <section className="py-20 bg-[#0a1628]">
      <div className="max-w-4xl mx-auto px-6 sm:px-8">
        <ScrollReveal>
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#5a6b4e]/15 bg-white/[0.02] mb-5">
              <FiActivity className="w-4 h-4 text-[#6b7c5c]" />
              <span className="text-xs text-[#6b7c5c] font-medium tracking-wider uppercase">Statut</span>
            </div>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-white mb-3">
              État des <span className="text-[#6b7c5c]">serveurs</span>
            </h2>
            <p className="text-white/60 text-base font-light max-w-md mx-auto">
              Tous nos systèmes sont opérationnels. Mise à jour en temps réel.
            </p>
          </div>
        </ScrollReveal>

        <div className="border border-white/[0.06] rounded-2xl overflow-hidden bg-white/[0.02]">
          {/* Header row */}
          <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-white/[0.02] border-b border-white/[0.04] text-white/55 text-xs uppercase tracking-wider">
            <div className="col-span-5 sm:col-span-4">Service</div>
            <div className="col-span-4 sm:col-span-4 text-center">Statut</div>
            <div className="col-span-3 sm:col-span-4 text-right">Uptime</div>
          </div>

          {/* Rows */}
          {STATUS_ITEMS.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="grid grid-cols-12 gap-4 px-5 py-4 border-b border-white/[0.03] items-center hover:bg-white/[0.01] transition-colors"
              >
                <div className="col-span-5 sm:col-span-4 flex items-center gap-3">
                  <Icon className="w-4 h-4 text-white/55 flex-shrink-0" />
                  <span className="text-white/70 text-sm">{item.label}</span>
                </div>
                <div className="col-span-4 sm:col-span-4 flex items-center justify-center gap-2">
                  <span className={`relative flex h-2 w-2 ${item.color}`}>
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-50 ${item.color.replace("text-", "bg-")}`} />
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${item.color.replace("text-", "bg-")}`} />
                  </span>
                  <span className="text-white/60 text-sm">{item.status}</span>
                </div>
                <div className="col-span-3 sm:col-span-4 text-right">
                  <span className="text-white/60 text-sm font-mono">{item.uptime}</span>
                </div>
              </motion.div>
            );
          })}
        </div>

        <ScrollReveal delay={0.3}>
          <div className="mt-6 flex items-center justify-center gap-2 text-white/55 text-xs">
            <FiActivity className="w-3 h-3" />
            <span>Dernière mise à jour : il y a quelques secondes</span>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
