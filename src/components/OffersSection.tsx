import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiCheck,
  FiMonitor,
  FiHeadphones,
  FiShield,
  FiZap,
  FiMessageCircle,
  FiArrowRight,
} from "react-icons/fi";
import { CLIENT_PLANS, SITE_CONFIG } from "@/data/siteData";
import ScrollReveal from "@/components/ScrollReveal";

// Single source of truth = CLIENT_PLANS (siteData). The monthly equivalent
// and savings % are computed dynamically from `price` and `months`.
type Plan = (typeof CLIENT_PLANS)[number];

const DEFAULT_ID = CLIENT_PLANS.find((p) => p.popular)?.id ?? CLIENT_PLANS[0].id;

/** Monthly baseline for the savings comparison = the 1-month plan. */
const BASELINE_MONTHLY = (() => {
  const oneMonth = CLIENT_PLANS.find((p) => p.months === 1);
  return oneMonth ? oneMonth.price / oneMonth.months : 0;
})();

function isTrial(p: Plan): boolean {
  return p.price === 0 || p.months <= 0;
}

function monthlyPrice(p: Plan): number | null {
  if (isTrial(p)) return null;
  return p.price / p.months;
}

function savingsPct(p: Plan): number {
  const m = monthlyPrice(p);
  if (m === null || BASELINE_MONTHLY <= 0) return 0;
  return Math.max(0, Math.round((1 - m / BASELINE_MONTHLY) * 100));
}

function formatMoney(value: number): string {
  return Number.isInteger(value)
    ? String(value)
    : value.toFixed(2).replace(".", ",");
}

function fullLabel(p: Plan): string {
  return `${p.name} · ${p.screensLabel}`;
}

function whatsappLink(p: Plan): string {
  const message = isTrial(p)
    ? `Bonjour Ciné Kin Premium ! Je souhaite démarrer l'essai gratuit 24h.`
    : `Bonjour Ciné Kin Premium ! Je souhaite commander la formule "${fullLabel(p)}" à ${p.price} $.`;
  return `https://wa.me/${SITE_CONFIG.whatsappNumber.replace(/[+\s]/g, "")}?text=${encodeURIComponent(message)}`;
}

export default function OffersSection() {
  const [selectedId, setSelectedId] = useState<string>(DEFAULT_ID);
  const selected = CLIENT_PLANS.find((p) => p.id === selectedId) ?? CLIENT_PLANS[0];

  const monthly = monthlyPrice(selected);
  const savings = savingsPct(selected);

  return (
    <section className="relative py-24 bg-[#0a1628] overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(90,107,78,0.06) 0%, transparent 60%)" }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-8">
        <ScrollReveal className="text-center mb-12">
          <p className="text-[#6b7c5c] text-sm font-medium tracking-[0.2em] uppercase mb-4">
            Nos formules
          </p>
          <h2 className="font-display font-bold text-4xl sm:text-5xl text-white tracking-[-0.02em] leading-tight">
            Choisissez <span className="text-white/70">votre durée</span>
          </h2>
          <p className="text-white/80 text-base font-light max-w-md mx-auto mt-4">
            Plus la durée est longue, plus le prix mensuel baisse. Sélectionnez une formule pour voir le détail.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6">
          {/* Plan list */}
          <div className="lg:col-span-2 flex flex-col gap-2.5">
            {CLIENT_PLANS.map((p) => {
              const isActive = p.id === selectedId;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedId(p.id)}
                  aria-pressed={isActive}
                  className={`relative w-full text-left rounded-xl border px-5 py-4 transition-all duration-300 ${
                    isActive
                      ? "border-[#5a6b4e] bg-[#5a6b4e]/10 ring-1 ring-[#5a6b4e]/40"
                      : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.14] hover:bg-white/[0.04]"
                  }`}
                >
                  {p.popular && (
                    <span className="absolute -top-2 right-4 px-2 py-0.5 bg-[#5a6b4e] rounded-full text-[9px] font-bold text-white tracking-wider uppercase">
                      Le plus populaire
                    </span>
                  )}
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-display font-semibold text-white text-base">
                        {p.name}
                      </div>
                      <div className="text-[#6b7c5c] text-xs font-medium mt-0.5">
                        {p.screensLabel}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-display font-bold text-white text-lg">
                        {isTrial(p) ? "Gratuit" : `${p.price} $`}
                      </div>
                      {savingsPct(p) > 0 && (
                        <div className="text-emerald-400 text-[11px] font-medium">
                          −{savingsPct(p)}%
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detail panel */}
          <div className="lg:col-span-3">
            <div className="relative rounded-2xl border border-white/[0.08] bg-[#111d32]/50 p-6 sm:p-8 h-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selected.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  <div className="flex items-start justify-between gap-4 mb-6">
                    <div>
                      <h3 className="font-display font-bold text-2xl text-white">
                        {selected.name}
                      </h3>
                      <p className="text-[#6b7c5c] text-sm font-medium mt-1">
                        {selected.screensLabel}
                      </p>
                    </div>
                    {selected.popular && (
                      <span className="px-3 py-1 bg-[#5a6b4e] rounded-full text-[10px] font-bold text-white tracking-wider uppercase whitespace-nowrap">
                        Le plus populaire
                      </span>
                    )}
                  </div>

                  {/* Price block */}
                  <div className="flex items-end gap-3 mb-6">
                    <span className="font-display font-bold text-5xl text-white leading-none">
                      {isTrial(selected) ? "Gratuit" : `${selected.price} $`}
                    </span>
                    {monthly !== null && (
                      <span className="text-white/70 text-sm pb-1">
                        ≈ {formatMoney(monthly)} $/mois
                      </span>
                    )}
                  </div>

                  {savings > 0 && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-6">
                      <FiZap className="w-3.5 h-3.5" />
                      {savings}% d'économie vs formule 1 mois
                    </div>
                  )}

                  {/* Feature rows */}
                  <div className="space-y-3 mb-8">
                    <DetailRow
                      icon={FiMonitor}
                      label="Écrans simultanés"
                      value={`${selected.screens} écran${selected.screens > 1 ? "s" : ""}`}
                    />
                    <DetailRow
                      icon={FiHeadphones}
                      label="Support"
                      value={selected.support === "Prioritaire" ? "Support prioritaire" : "Support standard"}
                    />
                    <DetailRow
                      icon={FiShield}
                      label="Garantie"
                      value={selected.guarantee === "Aucune" ? "Aucune garantie" : `Garantie ${selected.guarantee}`}
                    />
                  </div>

                  {/* CTA */}
                  <a
                    href={whatsappLink(selected)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2.5 w-full py-4 rounded-xl bg-[#5a6b4e] text-white font-semibold text-base hover:bg-[#4d5d42] transition-all"
                  >
                    <FiMessageCircle className="w-5 h-5" />
                    {isTrial(selected) ? "Démarrer l'essai 24h" : "Commander sur WhatsApp"}
                    <FiArrowRight className="w-4 h-4" />
                  </a>
                  <p className="text-center text-white/70 text-xs mt-3">
                    Sans engagement · Activation rapide · Support WhatsApp direct
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-[#5a6b4e]/10 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-[#6b7c5c]" />
      </div>
      <div className="flex items-center justify-between flex-1 gap-3 border-b border-white/[0.05] pb-2.5">
        <span className="text-white/70 text-sm">{label}</span>
        <span className="flex items-center gap-1.5 text-white text-sm font-medium">
          <FiCheck className="w-3.5 h-3.5 text-[#6b7c5c]" />
          {value}
        </span>
      </div>
    </div>
  );
}
