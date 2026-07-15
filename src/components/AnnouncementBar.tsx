import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiPercent } from "react-icons/fi";
import { Link } from "react-router-dom";

export default function AnnouncementBar() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="bg-[#5a6b4e] relative z-[60]"
      >
        <div className="max-w-6xl mx-auto px-6 sm:px-8 py-2 flex items-center justify-center gap-3">
          <FiPercent className="w-3.5 h-3.5 text-white/80 flex-shrink-0" />
          <p className="text-white text-xs sm:text-sm font-medium text-center">
            Promo Flash : -20% sur tous les abonnements 12 & 24 mois avec le code{" "}
            <span className="font-bold underline underline-offset-2">CKPREMIUM20</span>
          </p>
          <Link
            to="/offres"
            className="text-white text-xs font-semibold underline underline-offset-2 hover:text-white/80 transition-colors flex-shrink-0 hidden sm:block"
          >
            En profiter
          </Link>
          <button
            onClick={() => setIsVisible(false)}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-white/50 hover:text-white transition-colors"
          >
            <FiX className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
