import { motion } from "framer-motion";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiInfo,
  FiMessageCircle,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import { SITE_CONFIG } from "@/data/siteData";
import { COMMERCIAL_INFO } from "@/data/commercial";

const steps = [
  {
    title: "Choisissez une formule",
    description: "Le tarif et la durée sont affichés sur la page des offres.",
  },
  {
    title: "Préparez la demande",
    description:
      "Le site compose un message que vous choisissez ensuite d’envoyer dans WhatsApp.",
  },
  {
    title: "Vérifiez les conditions",
    description:
      "L’équipe confirme le montant, le moyen de paiement disponible et les conditions applicables avant tout règlement.",
  },
  {
    title: "Activation après confirmation",
    description: COMMERCIAL_INFO.activation.description,
  },
];

export default function Paiement() {
  const whatsappUrl = `https://wa.me/${SITE_CONFIG.whatsappNumber.replace(/[+\s]/g, "")}`;

  return (
    <div className="min-h-screen bg-[#0a1628] pt-20">
      <SEO
        title="Paiement et activation"
        description="Comprenez comment le prix, le moyen de paiement et les conditions sont confirmés avant l’activation de votre formule Ciné Kin."
      />

      <section className="relative py-16 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 50% 30%, rgba(90,107,78,0.06) 0%, transparent 50%)",
          }}
        />
        <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-8 text-center">
          <Link
            to="/commande"
            className="mb-6 inline-flex items-center gap-2 text-sm text-white/55 transition-colors hover:text-[#8ba26f]"
          >
            <FiArrowLeft className="h-4 w-4" />
            Retour à la commande
          </Link>
          <h1 className="font-display font-bold text-4xl sm:text-5xl text-white mb-4">
            Paiement et <span className="text-[#6b7c5c]">activation</span>
          </h1>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-white/60">
            {COMMERCIAL_INFO.payment.description}
          </p>
        </div>
      </section>

      <section className="pb-24">
        <div className="max-w-4xl mx-auto px-6 sm:px-8">
          <div className="mb-10 rounded-2xl border border-amber-300/15 bg-amber-300/[0.04] p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-amber-300/10">
                <FiInfo className="h-5 w-5 text-amber-200" />
              </div>
              <div>
                <h2 className="font-display font-semibold text-white mb-1">
                  Aucun paiement intégré au site
                </h2>
                <p className="text-sm leading-relaxed text-white/60">
                  Aucun bouton de cette page ne débite une carte ou un portefeuille. N’envoyez jamais de code PIN, de mot de passe ou de donnée bancaire complète dans WhatsApp.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6"
              >
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-[#5a6b4e]/12 text-sm font-bold text-[#8ba26f]">
                  {index + 1}
                </div>
                <h3 className="font-display font-semibold text-white mb-2">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-white/60">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>

          <div className="mt-10 rounded-2xl border border-[#5a6b4e]/20 bg-[#5a6b4e]/[0.05] p-7 text-center">
            <FiCheckCircle className="mx-auto mb-3 h-7 w-7 text-[#8ba26f]" />
            <h2 className="font-display font-semibold text-white mb-2">
              Une question avant de payer ?
            </h2>
            <p className="mb-5 text-sm text-white/60">
              Demandez une confirmation écrite du prix, de la durée et des conditions applicables.
            </p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-6 py-3 text-sm font-semibold text-[#0a1628] transition-opacity hover:opacity-90"
            >
              <FiMessageCircle className="h-4 w-4" />
              Ouvrir WhatsApp
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
