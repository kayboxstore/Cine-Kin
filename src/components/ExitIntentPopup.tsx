import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiGift, FiClock } from "react-icons/fi";
import { Link } from "react-router-dom";

export default function ExitIntentPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  const handleMouseLeave = useCallback(
    (e: MouseEvent) => {
      if (e.clientY <= 10 && !hasShown) {
        setIsVisible(true);
        setHasShown(true);
      }
    },
    [hasShown]
  );

  useEffect(() => {
    // Also show after 30 seconds if not shown yet
    const timer = setTimeout(() => {
      if (!hasShown) {
        setIsVisible(true);
        setHasShown(true);
      }
    }, 30000);

    document.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      document.removeEventListener("mouseleave", handleMouseLeave);
      clearTimeout(timer);
    };
  }, [handleMouseLeave, hasShown]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsVisible(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[95]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 30 }}
            transition={{ type: "spring", damping: 22 }}
            className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md bg-[#0d1b2f] border border-[#5a6b4e]/20 rounded-2xl z-[96] overflow-hidden shadow-2xl shadow-[#5a6b4e]/10"
          >
            {/* Header */}
            <div className="relative p-8 text-center border-b border-white/[0.04]">
              <button
                onClick={() => setIsVisible(false)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.05] text-white/30 hover:text-white transition-all"
              >
                <FiX className="w-4 h-4" />
              </button>

              <div className="w-16 h-16 rounded-2xl bg-[#5a6b4e]/15 flex items-center justify-center mx-auto mb-4">
                <FiGift className="w-8 h-8 text-[#6b7c5c]" />
              </div>

              <h3 className="font-display font-bold text-2xl text-white mb-2">
                Ne partez pas sans votre essai !
              </h3>
              <p className="text-white/45 text-sm font-light">
                Essayez Ciné Kin Premium gratuitement pendant 24h.
              </p>
            </div>

            {/* Content */}
            <div className="p-8 space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <FiClock className="w-5 h-5 text-[#6b7c5c] flex-shrink-0" />
                <div>
                  <div className="text-white text-sm font-medium">Essai gratuit 24h</div>
                  <div className="text-white/35 text-xs">Accès complet, aucun engagement</div>
                </div>
              </div>

              <div className="space-y-2">
                {[
                  "15 000+ chaînes en direct",
                  "Films et séries en VOD",
                  "Qualité 4K UHD",
                  "Support WhatsApp 7j/7",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-white/50 text-sm">
                    <span className="w-1 h-1 rounded-full bg-[#5a6b4e]" />
                    {item}
                  </div>
                ))}
              </div>

              <Link
                to="/commande?plan=trial"
                onClick={() => setIsVisible(false)}
                className="block w-full py-4 bg-[#5a6b4e] text-white font-bold text-sm rounded-xl hover:bg-[#4d5d42] transition-all text-center mt-6"
              >
                Démarrer mon essai gratuit
              </Link>

              <button
                onClick={() => setIsVisible(false)}
                className="block w-full text-white/25 text-xs hover:text-white/50 transition-colors text-center"
              >
                Non merci, je préfère payer plus cher ailleurs
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
