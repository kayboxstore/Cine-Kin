import { Link, useSearchParams } from "react-router-dom";
import SEO from "@/components/SEO";
import { motion } from "framer-motion";
import { FiCheck, FiWifi, FiMonitor, FiHeadphones, FiShield, FiStar } from "react-icons/fi";
import { CLIENT_PLANS, SITE_CONFIG } from "@/data/siteData";
import ScrollReveal from "@/components/ScrollReveal";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" as const },
  }),
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

export default function Offres() {
  const [searchParams] = useSearchParams();
  const highlightPlan = searchParams.get("plan");

  return (


    <div>


      <SEO
        title="Nos Offres IPTV - Abonnements à partir de $9.99"
        description="Découvrez nos abonnements IPTV premium : Essai gratuit, 1 mois, 3 mois, 6 mois, 12 mois et 24 mois. 15000+ chaînes en 4K UHD."
      />
      {/* Hero */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(90,107,78,0.06) 0%, transparent 50%)" }}
        />

        <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8 text-center">
          <ScrollReveal>
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-white/[0.06] bg-white/[0.02] mb-8">
              <FiStar className="w-4 h-4 text-[#6b7c5c]" />
              <span className="text-sm text-white/50">Formules adaptées à tous les besoins</span>
            </div>
            <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl text-white mb-5 tracking-[-0.02em]">
              Nos <span className="text-[#6b7c5c]">offres</span>
            </h1>
            <p className="text-white/45 text-lg max-w-2xl mx-auto font-light">
              Choisissez l'abonnement qui correspond à vos besoins. Tous nos plans incluent l'accès complet à notre catalogue.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Plans */}
      <section className="relative py-16 pb-24">
        <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {CLIENT_PLANS.map((plan, i) => (
              <motion.div
                key={plan.id}
                variants={fadeInUp}
                custom={i}
                className={`relative border rounded-2xl p-7 transition-all duration-300 bg-[#111d32]/40 ${
                  highlightPlan === plan.id ? "ring-2 ring-[#5a6b4e] border-[#5a6b4e]/30" : "border-white/[0.04] hover:border-white/[0.08]"
                } ${plan.popular ? "lg:scale-105" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#5a6b4e] rounded-full text-xs font-bold text-white tracking-wide">
                    Populaire
                  </div>
                )}
                {plan.bestDeal && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#7a8f6a] rounded-full text-xs font-bold text-white tracking-wide">
                    Meilleure offre
                  </div>
                )}

                <div className="text-center mb-6 pt-2">
                  <h3 className="font-display font-semibold text-xl text-white mb-1">{plan.name}</h3>
                  <div className="font-display font-bold text-4xl text-white">{plan.priceLabel}</div>
                  <div className="text-white/35 text-sm mt-1">{plan.duration}</div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="flex items-center gap-2 text-sm text-white/50 bg-white/[0.03] rounded-lg p-2.5">
                    <FiMonitor className="w-4 h-4 text-[#6b7c5c]" />
                    <span>{plan.quality}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/50 bg-white/[0.03] rounded-lg p-2.5">
                    <FiWifi className="w-4 h-4 text-[#6b7c5c]" />
                    <span>{plan.channels} chaînes</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/50 bg-white/[0.03] rounded-lg p-2.5">
                    <FiMonitor className="w-4 h-4 text-[#6b7c5c]" />
                    <span>{plan.screens} écran{plan.screens > 1 ? "s" : ""}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/50 bg-white/[0.03] rounded-lg p-2.5">
                    <FiHeadphones className="w-4 h-4 text-[#6b7c5c]" />
                    <span>{plan.support}</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-7">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-2.5 text-sm text-white/50">
                      <FiCheck className="w-4 h-4 text-[#5a6b4e] flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  to={`/commande?plan=${plan.id}&type=client`}
                  className={`block w-full py-4 text-center text-sm font-bold rounded-xl transition-all duration-300 tracking-wide ${
                    plan.popular
                      ? "bg-[#5a6b4e] text-white hover:bg-[#4d5d42]"
                      : "bg-white/[0.05] text-white/70 hover:bg-white/[0.10] border border-white/[0.08]"
                  }`}
                >
                  Commander
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Quality & Support info */}
      <section className="relative py-16 pb-24">
        <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8">
          <ScrollReveal>
            <div className="border border-white/[0.04] rounded-2xl p-8 sm:p-12 bg-[#111d32]/30">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#5a6b4e]/10 flex items-center justify-center flex-shrink-0">
                    <FiMonitor className="w-6 h-6 text-[#6b7c5c]" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-white mb-1">Qualité garantie</h3>
                    <p className="text-white/40 text-sm font-light">HD, Full HD et 4K selon votre formule. Technologie anti-freeze intégrée.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#5a6b4e]/10 flex items-center justify-center flex-shrink-0">
                    <FiShield className="w-6 h-6 text-[#6b7c5c]" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-white mb-1">Sécurisé</h3>
                    <p className="text-white/40 text-sm font-light">Compatible VPN. Vos données sont protégées et votre confidentialité respectée.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#5a6b4e]/10 flex items-center justify-center flex-shrink-0">
                    <FiHeadphones className="w-6 h-6 text-[#6b7c5c]" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-white mb-1">Support réactif</h3>
                    <p className="text-white/40 text-sm font-light">Notre équipe est disponible {SITE_CONFIG.supportHours.toLowerCase()} pour vous aider.</p>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
