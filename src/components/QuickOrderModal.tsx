import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiZap, FiMessageCircle } from "react-icons/fi";
import { CLIENT_PLANS, SITE_CONFIG } from "@/data/siteData";

interface QuickOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickOrderModal({ isOpen, onClose }: QuickOrderModalProps) {
  const [selected, setSelected] = useState("monthly");

  const plans = [
    { id: "trial", name: "Essai 24h", price: "Gratuit", duration: "24 heures", popular: false },
    ...CLIENT_PLANS.filter(p => p.id !== "trial"),
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[90]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25 }}
            className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-lg bg-[#0d1b2f] border border-white/[0.08] rounded-2xl z-[100] overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/[0.06] flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#5a6b4e]/15 flex items-center justify-center">
                  <FiZap className="w-5 h-5 text-[#6b7c5c]" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-lg text-white">Commander en 1 clic</h3>
                  <p className="text-white/60 text-xs">Choisissez votre formule</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.05] text-white/60 hover:text-white transition-all"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>

            {/* Plans */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => setSelected(plan.id)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all ${
                    selected === plan.id
                      ? "border-[#5a6b4e]/40 bg-[#5a6b4e]/10"
                      : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.10]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selected === plan.id ? "border-[#5a6b4e]" : "border-white/20"
                    }`}>
                      {selected === plan.id && <div className="w-2.5 h-2.5 rounded-full bg-[#5a6b4e]" />}
                    </div>
                    <div>
                      <span className="text-white font-medium text-sm">{plan.name}</span>
                      <span className="text-white/55 text-xs ml-2">{(plan as any).duration || ""}</span>
                    </div>
                  </div>
                  <span className="font-display font-bold text-white text-sm">{(plan as any).priceLabel || (plan as any).price}</span>
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/[0.06] flex-shrink-0">
              <a
                href={`https://wa.me/${SITE_CONFIG.whatsappNumber.replace(/[+ \s]/g, "")}?text=${encodeURIComponent(
                  `Bonjour Ciné Kin Premium ! Je souhaite commander le forfait : ${plans.find(p => p.id === selected)?.name || selected}. Pouvez-vous m'aider avec la procédure ?`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className="block w-full py-4 bg-[#25D366] text-white font-bold text-base rounded-xl hover:bg-[#128C7E] transition-all text-center flex items-center justify-center gap-2"
              >
                <FiMessageCircle className="w-5 h-5" />
                Commander sur WhatsApp
              </a>
              <p className="text-white/55 text-xs text-center mt-3">
                Réponse sous 5 minutes garantie
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
