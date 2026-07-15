import { useState } from "react";
import { motion } from "framer-motion";
import { FiTrendingDown, FiDollarSign } from "react-icons/fi";
import ScrollReveal from "./ScrollReveal";

const CABLE_PRICES = [
  { label: "Canal+ (France)", monthly: 45 },
  { label: "BeIN Sports", monthly: 15 },
  { label: "Netflix Premium", monthly: 18 },
  { label: "Disney+", monthly: 9 },
  { label: "Amazon Prime", monthly: 7 },
  { label: "Autre abonnement", monthly: 30 },
];

export default function SavingsCalculator() {
  const [selected, setSelected] = useState<number[]>([0, 2]);
  const cineKinYearly = 69.99;

  const toggle = (i: number) => {
    setSelected((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]
    );
  };

  const cableMonthly = selected.reduce(
    (sum, i) => sum + CABLE_PRICES[i].monthly,
    0
  );
  const cableYearly = cableMonthly * 12;
  const savings = cableYearly - cineKinYearly;
  const percentage = cableYearly > 0 ? Math.round((savings / cableYearly) * 100) : 0;

  return (
    <section className="py-20 bg-[#111d32]/50">
      <div className="max-w-4xl mx-auto px-6 sm:px-8">
        <ScrollReveal>
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#5a6b4e]/15 bg-white/[0.02] mb-5">
              <FiDollarSign className="w-4 h-4 text-[#6b7c5c]" />
              <span className="text-xs text-[#6b7c5c] font-medium tracking-wider uppercase">
                Calculateur
              </span>
            </div>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-white mb-3">
              Comparez et <span className="text-[#6b7c5c]">économisez</span>
            </h2>
            <p className="text-white/45 text-base font-light max-w-lg mx-auto">
              Sélectionnez vos abonnements actuels et voyez combien vous pourriez économiser.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <div className="border border-white/[0.06] rounded-2xl p-6 sm:p-8 bg-white/[0.02]">
            {/* Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              {CABLE_PRICES.map((option, i) => (
                <button
                  key={i}
                  onClick={() => toggle(i)}
                  className={`flex items-center justify-between p-4 rounded-xl border text-left transition-all ${
                    selected.includes(i)
                      ? "border-[#5a6b4e]/30 bg-[#5a6b4e]/10"
                      : "border-white/[0.04] bg-white/[0.01] hover:border-white/[0.08]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                        selected.includes(i)
                          ? "bg-[#5a6b4e] border-[#5a6b4e]"
                          : "border-white/20"
                      }`}
                    >
                      {selected.includes(i) && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="text-white/70 text-sm">{option.label}</span>
                  </div>
                  <span className="text-white/40 text-xs">${option.monthly}/mois</span>
                </button>
              ))}
            </div>

            {/* Result */}
            <div className="border-t border-white/[0.06] pt-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                  <div className="text-white/35 text-xs mb-1">Vos abonnements actuels</div>
                  <div className="font-display font-bold text-2xl text-white/60">
                    ${cableYearly.toFixed(0)}/an
                  </div>
                </div>

                <FiTrendingDown className="w-5 h-5 text-[#6b7c5c] hidden sm:block" />

                <div className="text-center sm:text-left">
                  <div className="text-[#6b7c5c] text-xs mb-1">Ciné Kin Premium 12 mois</div>
                  <div className="font-display font-bold text-2xl text-white">
                    ${cineKinYearly}/an
                  </div>
                </div>

                <div className="h-px w-full sm:w-px sm:h-12 bg-white/[0.06]" />

                <motion.div
                  className="text-center"
                  key={savings}
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                >
                  <div className="text-[#6b7c5c] text-xs mb-1">Vous économisez</div>
                  <div className="font-display font-bold text-3xl text-[#6b7c5c]">
                    ${savings.toFixed(0)}/an
                  </div>
                  <div className="text-white/30 text-xs">({percentage}% de moins)</div>
                </motion.div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
