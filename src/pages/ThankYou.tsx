import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiCheckCircle, FiMessageCircle, FiSmartphone, FiMail,
  FiClock, FiArrowRight, FiCopy, FiCheck
} from "react-icons/fi";
import SEO from "@/components/SEO";

const STEPS = [
  { icon: FiCheckCircle, text: "Votre demande a été reçue", done: true },
  { icon: FiClock, text: "Notre équipe prépare vos accès", done: true },
  { icon: FiMessageCircle, text: "Vous recevrez un message WhatsApp sous 5 min", done: false },
  { icon: FiSmartphone, text: "Suivez les instructions d'activation", done: false },
];

export default function ThankYou() {
  const [searchParams] = useSearchParams();
  const plan = searchParams.get("plan") || "monthly";
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState(300); // 5 minutes

  const whatsappNumber = "+243830240073";
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=Bonjour%20Ciné%20Kin%20Premium%2C%20j'ai%20passé%20commande%20(plan%3A%20${plan})`;

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleCopy = () => {
    navigator.clipboard.writeText(whatsappNumber).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-[#0a1628] pt-20 flex items-center">
      <SEO
        title="Commande confirmée - Ciné Kin Premium"
        description="Votre commande a été reçue. Notre équipe vous contactera sous 5 minutes via WhatsApp."
      />

      <div className="w-full max-w-2xl mx-auto px-6 sm:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          {/* Success icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-20 h-20 rounded-full bg-[#5a6b4e]/15 flex items-center justify-center mx-auto mb-6"
          >
            <FiCheckCircle className="w-10 h-10 text-[#6b7c5c]" />
          </motion.div>

          <h1 className="font-display font-bold text-3xl sm:text-4xl text-white mb-3">
            Commande <span className="text-[#6b7c5c]">confirmée</span> !
          </h1>
          <p className="text-white/45 text-base font-light max-w-md mx-auto mb-8">
            Merci pour votre confiance. Notre équipe prépare vos accès et vous contactera très rapidement.
          </p>

          {/* Steps */}
          <div className="border border-white/[0.06] rounded-2xl p-6 bg-white/[0.02] mb-8 text-left">
            <h2 className="font-display font-semibold text-white text-base mb-5 text-center">
              Prochaines étapes
            </h2>
            <div className="space-y-4">
              {STEPS.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.15 }}
                  className="flex items-center gap-4"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      step.done ? "bg-[#5a6b4e]/20" : "bg-white/[0.04]"
                    }`}
                  >
                    <step.icon
                      className={`w-4 h-4 ${step.done ? "text-[#6b7c5c]" : "text-white/20"}`}
                    />
                  </div>
                  <span className={`text-sm ${step.done ? "text-white/60" : "text-white/35"}`}>
                    {step.text}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* WhatsApp CTA */}
          <div className="border border-[#5a6b4e]/15 rounded-2xl p-6 bg-[#5a6b4e]/[0.03] mb-8">
            <div className="flex items-center justify-center gap-2 mb-3">
              <FiClock className="w-4 h-4 text-[#6b7c5c]" />
              <span className="text-[#6b7c5c] text-sm font-medium">
                Temps estimé : {formatTime(countdown)}
              </span>
            </div>

            <p className="text-white/45 text-sm mb-5">
              Pour accélérer le processus, contactez-nous directement sur WhatsApp :
            </p>

            <div className="flex items-center gap-2 justify-center mb-5">
              <div className="px-4 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white font-mono text-base">
                {whatsappNumber}
              </div>
              <button
                onClick={handleCopy}
                className="px-3 py-2.5 bg-white/[0.05] border border-white/[0.08] rounded-xl text-white/50 hover:text-white transition-colors"
              >
                {copied ? <FiCheck className="w-4 h-4" /> : <FiCopy className="w-4 h-4" />}
              </button>
            </div>

            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#25D366] text-white font-semibold rounded-xl hover:bg-[#128C7E] transition-all text-sm"
            >
              <FiMessageCircle className="w-5 h-5" />
              Nous contacter sur WhatsApp
              <FiArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* Tutoriels */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/tutoriels"
              className="px-6 py-3 border border-white/[0.08] text-white/60 rounded-xl hover:bg-white/[0.03] transition-all text-sm flex items-center gap-2"
            >
              <FiSmartphone className="w-4 h-4" />
              Guides d'installation
            </Link>
            <Link
              to="/"
              className="px-6 py-3 border border-white/[0.08] text-white/60 rounded-xl hover:bg-white/[0.03] transition-all text-sm flex items-center gap-2"
            >
              <FiMail className="w-4 h-4" />
              Retour à l'accueil
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
