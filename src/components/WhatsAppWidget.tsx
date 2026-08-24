import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiMessageCircle } from "react-icons/fi";
import { SITE_CONFIG } from "@/data/siteData";

export default function WhatsAppWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const chatLinkRef = useRef<HTMLAnchorElement>(null);

  const whatsappUrl = `https://wa.me/${SITE_CONFIG.whatsappNumber.replace(/[+\s]/g, "")}?text=${encodeURIComponent("Bonjour Ciné Kin Premium ! Je suis intéressé par vos offres IPTV. Pouvez-vous m'en dire plus ?")}`;

  useEffect(() => {
    if (!isOpen) return;
    chatLinkRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <>
      {/* Floating Button */}
      <motion.button
        ref={triggerRef}
        type="button"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 2, type: "spring" }}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={
          isOpen ? "Fermer l’aide WhatsApp" : "Ouvrir l’aide WhatsApp"
        }
        aria-expanded={isOpen}
        aria-controls="whatsapp-help"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-lg shadow-[#25D366]/30 hover:scale-110 transition-transform"
      >
        {isOpen ? (
          <FiX className="w-6 h-6 text-white" />
        ) : (
          <FiMessageCircle className="w-6 h-6 text-white" />
        )}
      </motion.button>

      {/* Chat Popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="whatsapp-help"
            role="dialog"
            aria-label="Aide WhatsApp"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", damping: 25 }}
            className="fixed bottom-24 right-6 z-50 w-80 bg-[#0d1b2f] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-[#25D366] px-5 py-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <FiMessageCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">
                  Ciné Kin Premium
                </h3>
                <p className="text-white/70 text-xs flex items-center gap-1">
                  Support par WhatsApp
                </p>
              </div>
            </div>

            {/* Body */}
            <div className="p-5">
              <p className="text-white/60 text-sm mb-4 leading-relaxed">
                Bonjour ! Comment pouvons-nous vous aider aujourd'hui ?
              </p>
              <a
                ref={chatLinkRef}
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-3 bg-[#25D366] text-white font-semibold text-sm rounded-xl text-center hover:bg-[#20bd5a] transition-all"
              >
                Discuter sur WhatsApp
              </a>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-white/[0.04] text-center">
              <p className="text-white/55 text-xs">
                Horaires : {SITE_CONFIG.supportHours}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
