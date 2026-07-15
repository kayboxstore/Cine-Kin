import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FiUsers, FiZap, FiTrendingUp } from "react-icons/fi";
import ScrollReveal from "./ScrollReveal";

function useLiveCounter(initial: number, min: number, max: number) {
  const [count, setCount] = useState(initial);
  useEffect(() => {
    const interval = setInterval(() => {
      setCount((prev) => {
        const delta = Math.random() > 0.5 ? 1 : -1;
        const next = prev + delta;
        return Math.max(min, Math.min(max, next));
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [min, max]);
  return count;
}

export default function FOMOCounter() {
  const viewers = useLiveCounter(47, 35, 62);
  const spotsLeft = 12;

  return (
    <section className="py-16 bg-[#111d32]/30">
      <div className="max-w-4xl mx-auto px-6 sm:px-8">
        <ScrollReveal>
          <div className="border border-[#5a6b4e]/10 rounded-2xl p-6 sm:p-8 bg-[#5a6b4e]/[0.02] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(90,107,78,0.06) 0%, transparent 60%)" }}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center relative z-10">
              {/* Viewers */}
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2 mb-2">
                  <FiUsers className="w-4 h-4 text-[#6b7c5c]" />
                  <span className="text-white/40 text-xs uppercase tracking-wider">En ligne</span>
                </div>
                <motion.div
                  key={viewers}
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  className="font-display font-bold text-3xl text-white"
                >
                  {viewers}
                </motion.div>
                <span className="text-white/30 text-xs">personnes consultent</span>
              </div>

              {/* Orders today */}
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2 mb-2">
                  <FiTrendingUp className="w-4 h-4 text-[#6b7c5c]" />
                  <span className="text-white/40 text-xs uppercase tracking-wider">Aujourd'hui</span>
                </div>
                <div className="font-display font-bold text-3xl text-white">128</div>
                <span className="text-white/30 text-xs">commandes passées</span>
              </div>

              {/* Spots left */}
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2 mb-2">
                  <FiZap className="w-4 h-4 text-orange-400" />
                  <span className="text-white/40 text-xs uppercase tracking-wider">Urgence</span>
                </div>
                <div className="font-display font-bold text-3xl text-orange-400">
                  {spotsLeft}
                </div>
                <span className="text-white/30 text-xs">places promo restantes</span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-6 relative z-10">
              <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: "88%" }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="h-full rounded-full bg-[#5a6b4e]"
                />
              </div>
              <p className="text-white/25 text-xs mt-2 text-center">
                88% des places promo déjà réservées aujourd'hui
              </p>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
