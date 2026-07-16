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
import { SITE_CONFIG } from "@/data/siteData";
import ScrollReveal from "@/components/ScrollReveal";

/**
 * Real, validated pricing grid for the home offers selector.
 * NOTE: these values intentionally differ from `CLIENT_PLANS` in siteData.ts
 * (kept local on purpose — see the offers-section integration note). The
 * monthly equivalent and savings % are computed dynamically from `price`
 * and `months`, never hard-coded.
 */
type Offer = {
  id: string;
  name: string;
  /** Disambiguates the two "12 mois" plans (same duration, different screens). */
  screensLabel?: string;
  price: number;
  /** Billed duration in months; 0 for the 24h trial (no monthly equivalent). */
  months: number;
  screens: number;
  support: string;
  guarantee: string;
  popular?: boolean;
  isTrial?: boolean;
};

const OFFERS: Offer[] = [
  { id: "trial", name: "Essai 24h", price: 0, months: 0, screens: 1, support: "Standard", guarantee: "Aucune", isTrial: true },
  { id: "1month", name: "1 mois", price: 10, months: 1, screens: 1, support: "Standard", guarantee: "Aucune" },
  { id: "3months", name: "3 mois", price: 25, months: 3, screens: 1, support: "Standard", guarantee: "Aucune" },
  { id: "6months", name: "6 mois", price: 45, months: 6, screens: 1, support: "Standard", guarantee: "2 jours" },
  { id: "12months-1screen", name: "12 mois", screensLabel: "1 écran", price: 70, months: 12, screens: 1, support: "Standard", guarantee: "2 jours", popular: true },
  { id: "12months-2screens", name: "12 mois", screensLabel: "2 écrans", price: 120, months: 12, screens: 2, support: "Prioritaire", guarantee: "2 jours" },
];

const DEFAULT_ID = OFFERS.find((o) => o.popular)?.id ?? OFFERS[0]!.id;

/** Monthly price baseline used for the savings comparison = the 1-month plan. */
const BASELINE_MONTHLY = (() => {
  const oneMonth = OFFERS.find((o) => o.months === 1);
  return oneMonth ? oneMonth.price / oneMonth.months : 0;
})();

function monthlyPrice(o: Offer): number | null {
  if (o.isTrial || o.months <= 0) return null;
  return o.price / o.months;
}

function savingsPct(o: Offer): number {
  const m = monthlyPrice(o);
  if (m === null || BASELINE_MONTHLY <= 0) return 0;
  return Math.max(0, Math.round((1 - m / BASELINE_MONTHLY) * 100));
}

function formatMoney(value: number): string {
  // Trim ",00" for whole numbers, French decimal comma otherwise.
  return Number.isInteger(value)
    ? String(value)
    : value.toFixed(2).replace(".", ",");
}

function fullLabel(o: Offer): string {
  return o.screensLabel ? `${o.name} · ${o.screensLabel}` : o.name;
}

function whatsappLink(o: Offer): string {
  const message = o.isTrial
    ? `Bonjour Ciné Kin Premium ! Je souhaite démarrer l'essai gratuit 24h.`
    : `Bonjour Ciné Kin Premium ! Je souhaite commander la formule "${fullLabel(o)}" à ${o.price} $.`;
  return `https://wa.me/${SITE_CONFIG.whatsappNumber.replace(/[+\s]/g, "")}?text=${encodeURIComponent(message)}`;
}

export default function OffersSection() {
  const [selectedId, setSelectedId] = useState<string>(DEFAULT_ID);
  const selected = OFFERS.find((o) => o.id === selectedId) ?? OFFERS[0]!;

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
            {OFFERS.map((o) => {
              const isActive = o.id === selectedId;
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setSelectedId(o.id)}
                  aria-pressed={isActive}
                  className={`relative w-full text-left rounded-xl border px-5 py-4 transition-all duration-300 ${
                    isActive
                      ? "border-[#5a6b4e] bg-[#5a6b4e]/10 ring-1 ring-[#5a6b4e]/40"
                      : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.14] hover:bg-white/[0.04]"
                  }`}
                >
                  {o.popular && (
                    <span className="absolute -top-2 right-4 px-2 py-0.5 bg-[#5a6b4e] rounded-full text-[9px] font-bold text-white tracking-wider uppercase">
                      Le plus populaire
                    </span>
                  )}
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-display font-semibold text-white text-base">
                        {o.name}
                      </div>
                      {o.screensLabel && (
                        <div className="text-[#6b7c5c] text-xs font-medium mt-0.5">
                          {o.screensLabel}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-display font-bold text-white text-lg">
                        {o.isTrial ? "Gratuit" : `${o.price} $`}
                      </div>
                      {savingsPct(o) > 0 && (
                        <div className="text-emerald-400 text-[11px] font-medium">
                          −{savingsPct(o)}%
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
                      {selected.screensLabel && (
                        <p className="text-[#6b7c5c] text-sm font-medium mt-1">
                          {selected.screensLabel}
                        </p>
                      )}
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
                      {selected.isTrial ? "Gratuit" : `${selected.price} $`}
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
                    {selected.isTrial ? "Démarrer l'essai 24h" : "Commander sur WhatsApp"}
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
