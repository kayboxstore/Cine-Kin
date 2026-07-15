import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiPercent, FiCheck, FiTag } from "react-icons/fi";
import ScrollReveal from "./ScrollReveal";

const PROMO_CODES = [
  { code: "CKPREMIUM20", discount: 20, label: "-20% sur 12+ mois" },
  { code: "WELCOME", discount: 15, label: "-15% première commande" },
  { code: "FAMILY", discount: 10, label: "-10% abonnement famille" },
];

export default function PromoCode() {
  const [applied, setApplied] = useState<string | null>(null);

  return (
    <section className="py-16 bg-[#0a1628]">
      <div className="max-w-4xl mx-auto px-6 sm:px-8">
        <ScrollReveal>
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#5a6b4e]/15 bg-white/[0.02] mb-5">
              <FiPercent className="w-4 h-4 text-[#6b7c5c]" />
              <span className="text-xs text-[#6b7c5c] font-medium tracking-wider uppercase">Codes promo</span>
            </div>
            <h2 className="font-display font-bold text-3xl text-white mb-3">
              Codes promo <span className="text-[#6b7c5c]">actifs</span>
            </h2>
            <p className="text-white/45 text-base font-light max-w-md mx-auto">
              Copiez un code et mentionnez-le lors de votre commande WhatsApp.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {PROMO_CODES.map((promo, i) => (
            <ScrollReveal key={promo.code} delay={i * 0.1}>
              <motion.button
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  navigator.clipboard.writeText(promo.code).catch(() => {});
                  setApplied(promo.code);
                  setTimeout(() => setApplied(null), 2000);
                }}
                className={`w-full relative border rounded-xl p-5 text-left transition-all ${
                  applied === promo.code
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-white/[0.06] bg-white/[0.02] hover:border-[#5a6b4e]/20"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FiTag className="w-4 h-4 text-[#6b7c5c]" />
                    <span className="text-white/45 text-xs">CODE</span>
                  </div>
                  <AnimatePresence>
                    {applied === promo.code && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-1 text-emerald-400 text-xs"
                      >
                        <FiCheck className="w-3 h-3" />
                        Copié
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="font-display font-bold text-xl text-white tracking-wider mb-1">
                  {promo.code}
                </div>
                <div className="text-[#6b7c5c] text-sm font-medium">
                  {promo.label}
                </div>

                {promo.code === "CKPREMIUM20" && (
                  <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-[#5a6b4e] rounded-full text-[9px] font-bold text-white tracking-wider">
                    POPULAIRE
                  </div>
                )}
              </motion.button>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
