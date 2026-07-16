import { useState, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiMonitor, FiFilm, FiZap, FiSmartphone, FiShield, FiHeadphones,
  FiChevronDown, FiChevronUp, FiArrowRight, FiUsers,
  FiTv, FiAirplay, FiTablet, FiCpu, FiCast, FiWifi, FiPlay
} from "react-icons/fi";
import {
  ADVANTAGES, HOW_IT_WORKS, FAQ
} from "@/data/siteData";
import ScrollReveal from "@/components/ScrollReveal";
import MagneticButton from "@/components/MagneticButton";
import AnimatedCounter from "@/components/AnimatedCounter";
const TestimonialCarousel = lazy(() => import("@/components/TestimonialCarousel"));
import TrustBadges from "@/components/TrustBadges";
import Gallery from "@/components/Gallery";
import SavingsCalculator from "@/components/SavingsCalculator";
import ReferralSection from "@/components/ReferralSection";
import PromoCode from "@/components/PromoCode";
import ServerStatus from "@/components/ServerStatus";
import ParallaxHero from "@/components/ParallaxHero";
import HeroSection from "@/components/HeroSection";
import OffersSection from "@/components/OffersSection";
import SEO from "@/components/SEO";
import SchemaOrg from "@/components/SchemaOrg";

const iconMap: Record<string, React.ElementType> = {
  FiMonitor, FiFilm, FiZap, FiSmartphone, FiShield, FiHeadphones,
  FiTv, FiAirplay, FiTablet, FiCpu, FiCast, FiWifi, FiUsers, FiPlay,
};

const featureImages = [
  "/images/feature-channels.jpg",
  "/images/feature-movies.jpg",
  "/images/feature-4k.jpg",
  "/images/feature-devices.jpg",
  "/images/feature-antifreeze.jpg",
  "/images/feature-support.jpg",
];

/* ─── Color tokens ───
   bg-night:      #0a1628  (bleu de nuit profond)
   bg-night-alt:  #111d32  (bleu de nuit plus clair)
   text-white:    #ffffff
   text-cream:    #e8e6e1  (blanc cassé)
   accent-olive:  #5a6b4e  (vert olive)
   accent-light:  #6b7c5c  (vert olive clair)
   text-muted:    white/45
   border-light:  white/[0.06]
*/


/* ═══════════════════════════════════════════
   STATS BAR — Bleu de nuit alt
   ═══════════════════════════════════════════ */
function StatsBar() {
  const stats = [
    { target: 15000, suffix: "+", label: "Chaînes TV" },
    { target: 50000, suffix: "+", label: "Films & Séries" },
    { target: 99, suffix: "%", label: "Uptime SLA" },
    { target: 24, suffix: "/7", label: "Support" },
  ];

  return (
    <section className="relative py-14 bg-[#111d32] border-y border-white/[0.03]">
      <div className="max-w-5xl mx-auto px-6 sm:px-8">
        <ScrollReveal>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-10">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="font-display font-bold text-2xl sm:text-3xl text-white tracking-tight mb-1">
                  <AnimatedCounter end={stat.target} suffix={stat.suffix} />
                </div>
                <div className="text-white/60 text-[11px] tracking-[0.15em] uppercase">{stat.label}</div>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   ADVANTAGES SECTION
   ═══════════════════════════════════════════ */
function AdvantagesSection() {
  return (
    <section className="relative py-32 bg-[#0a1628] overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(90,107,78,0.06) 0%, transparent 60%)" }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8">
        <ScrollReveal className="text-center mb-20">
          <p className="text-[#6b7c5c]/50 text-sm font-medium tracking-[0.2em] uppercase mb-5">
            Pourquoi nous choisir
          </p>
          <h2 className="font-display font-bold text-4xl sm:text-5xl md:text-6xl text-white tracking-[-0.02em] mb-5 leading-tight">
            Sans <span className="text-white/55">compromis</span>
          </h2>
          <p className="text-white/60 text-base max-w-md mx-auto font-light">
            Tout ce dont vous avez besoin pour un divertissement illimité.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ADVANTAGES.map((adv, i) => {
            const Icon = iconMap[adv.icon] || FiMonitor;
            return (
              <ScrollReveal key={i} delay={i * 0.08} direction="up" distance={30}>
                <div className="group border border-white/[0.04] rounded-xl overflow-hidden hover:border-[#5a6b4e]/20 transition-all duration-500 hover:-translate-y-1 bg-[#111d32]/50">
                  <div className="h-32 overflow-hidden relative">
                    <img
                      src={featureImages[i]}
                      alt={adv.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-75"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111d32] via-[#111d32]/40 to-transparent" />
                  </div>
                  <div className="p-5">
                    <div className="w-8 h-8 rounded-lg border border-white/[0.06] flex items-center justify-center mb-3 group-hover:border-[#5a6b4e]/25 group-hover:bg-[#5a6b4e]/10 transition-colors">
                      <Icon className="w-3.5 h-3.5 text-[#6b7c5c]" />
                    </div>
                    <h3 className="font-display font-semibold text-base text-white mb-2">{adv.title}</h3>
                    <p className="text-white/60 text-sm leading-relaxed font-light">{adv.description}</p>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   HOW IT WORKS
   ═══════════════════════════════════════════ */
function HowItWorksSection() {
  return (
    <section className="relative py-32 bg-[#111d32] overflow-hidden">
      <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-8">
        <ScrollReveal className="text-center mb-20">
          <p className="text-[#6b7c5c]/50 text-sm font-medium tracking-[0.2em] uppercase mb-5">
            Comment ça marche
          </p>
          <h2 className="font-display font-bold text-4xl sm:text-5xl md:text-6xl text-white tracking-[-0.02em] leading-tight">
            En <span className="text-white/55">3 étapes</span>
          </h2>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          <div className="hidden md:block absolute top-8 left-[25%] right-[25%] h-px bg-white/[0.03]" />

          {HOW_IT_WORKS.map((step, i) => (
            <ScrollReveal key={i} delay={i * 0.15} direction="up" distance={30}>
              <div className="relative text-center group">
                <div className="relative inline-flex items-center justify-center w-16 h-16 mb-6">
                  <div className="absolute inset-0 rounded-xl border border-white/[0.06] group-hover:border-[#5a6b4e]/20 transition-colors bg-[#0a1628]" />
                  <div className="relative font-display font-bold text-2xl text-white/50">
                    {String(step.step).padStart(2, "0")}
                  </div>
                </div>
                <h3 className="font-display font-semibold text-lg text-white mb-2">{step.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed max-w-[16rem] mx-auto font-light">{step.description}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}


/* ═══════════════════════════════════════════
   RESELLER CTA
   ═══════════════════════════════════════════ */
function ResellerCTASection() {
  return (
    <section className="relative py-32 bg-[#111d32] overflow-hidden">
      <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-8">
        <ScrollReveal>
          <div className="border border-white/[0.03] rounded-2xl p-10 sm:p-14 lg:p-16 text-center relative overflow-hidden hover:border-[#5a6b4e]/10 transition-colors duration-500 bg-[#0a1628]/60">
            <div className="absolute top-0 right-0 w-64 h-64 pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(90,107,78,0.08) 0%, transparent 60%)" }}
            />
            <div className="absolute bottom-0 left-0 w-64 h-64 pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(107,124,92,0.04) 0%, transparent 60%)" }}
            />

            <div className="relative max-w-xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#5a6b4e]/12 bg-white/[0.02] mb-8">
                <FiUsers className="w-4 h-4 text-[#6b7c5c]/60" />
                <span className="text-xs text-[#6b7c5c]/60 font-medium tracking-[0.15em] uppercase">Programme Revendeur</span>
              </div>

              <h2 className="font-display font-bold text-4xl sm:text-5xl text-white mb-5 tracking-[-0.02em] leading-tight">
                Devenez <span className="text-white/55">revendeur</span>
              </h2>
              <p className="text-white/50 text-base mb-10 leading-relaxed max-w-md mx-auto font-light">
                Rejoignez notre réseau et bénéficiez de marges de plus de 150%.
              </p>

              <Link to="/revendeurs">
                <MagneticButton
                  className="inline-flex items-center gap-2 px-7 py-3.5 text-sm font-semibold text-white border border-[#5a6b4e]/15 rounded-full hover:bg-[#5a6b4e]/10 hover:border-[#5a6b4e]/25 transition-all tracking-wide bg-white/[0.02]"
                  strength={0.15}
                >
                  Découvrir
                  <FiArrowRight className="w-3.5 h-3.5" />
                </MagneticButton>
              </Link>

              <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-8">
                {[
                  { value: "150%+", label: "Marge" },
                  { value: "1 000+", label: "Revendeurs" },
                  { value: "Instantané", label: "Activation" },
                  { value: "24/7", label: "Support" },
                ].map((stat, i) => (
                  <div key={i} className="text-center">
                    <div className="font-display font-bold text-xl text-white/70">{stat.value}</div>
                    <div className="text-white/60 text-xs mt-1 tracking-[0.1em] uppercase">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   TESTIMONIALS
   ═══════════════════════════════════════════ */
function TestimonialsSection() {
  return (
    <section className="relative py-32 bg-[#0a1628] overflow-hidden">
      <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8">
        <ScrollReveal className="text-center mb-16">
          <p className="text-[#6b7c5c]/50 text-sm font-medium tracking-[0.2em] uppercase mb-5">
            Témoignages
          </p>
          <h2 className="font-display font-bold text-4xl sm:text-5xl md:text-6xl text-white tracking-[-0.02em] leading-tight">
            Ils nous <span className="text-white/55">font confiance</span>
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={0.15}>
          <Suspense fallback={<div className="h-64" />}>
            <TestimonialCarousel />
          </Suspense>
        </ScrollReveal>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   FAQ SECTION
   ═══════════════════════════════════════════ */
function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="relative py-32 bg-[#111d32] overflow-hidden">
      <div className="relative z-10 max-w-2xl mx-auto px-6 sm:px-8">
        <ScrollReveal className="text-center mb-16">
          <p className="text-white/60 text-sm font-medium tracking-[0.2em] uppercase mb-5">
            FAQ
          </p>
          <h2 className="font-display font-bold text-4xl sm:text-5xl md:text-6xl text-white tracking-[-0.02em] leading-tight">
            Questions <span className="text-white/55">fréquentes</span>
          </h2>
        </ScrollReveal>

        <div className="space-y-2">
          {FAQ.map((item, i) => (
            <ScrollReveal key={i} delay={i * 0.04} direction="up" distance={15}>
              <div className="border border-white/[0.03] rounded-lg overflow-hidden hover:border-white/[0.06] transition-colors bg-[#0a1628]/50">
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <span className="font-display font-medium text-white/65 text-base pr-4">{item.question}</span>
                  {openIndex === i ? (
                    <FiChevronUp className="w-5 h-5 text-[#5a6b4e] flex-shrink-0" />
                  ) : (
                    <FiChevronDown className="w-5 h-5 text-white/55 flex-shrink-0" />
                  )}
                </button>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="px-4 pb-4"
                  >
                    <p className="text-white/50 text-base leading-relaxed font-light">{item.answer}</p>
                  </motion.div>
                )}
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   FINAL CTA
   ═══════════════════════════════════════════ */
function FinalCTASection() {
  return (
    <section className="relative py-32 bg-[#0a1628] overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse, rgba(90,107,78,0.06) 0%, rgba(107,124,92,0.03) 50%, transparent 70%)",
        }}
      />

      <div className="relative z-10 max-w-2xl mx-auto px-6 sm:px-8 text-center">
        <ScrollReveal>
          <h2 className="font-display font-bold text-5xl sm:text-6xl text-white mb-6 tracking-[-0.02em] leading-tight">
            Prêt à <span className="text-white/55">commencer</span> ?
          </h2>
          <p className="text-white/50 text-base mb-10 max-w-md mx-auto font-light">
            Essayez gratuitement pendant 24h ou choisissez l'offre qui vous convient.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/commande?plan=trial">
              <MagneticButton
                className="px-8 py-4 text-base font-medium text-white/55 border border-white/[0.10] rounded-full hover:border-[#5a6b4e]/20 hover:text-white/75 transition-all tracking-wide bg-white/[0.02]"
                strength={0.15}
              >
                Essai gratuit 24h
              </MagneticButton>
            </Link>
            <Link to="/offres">
              <MagneticButton
                className="px-8 py-4 text-base font-semibold text-white bg-[#5a6b4e] rounded-full hover:bg-[#4d5d42] transition-all flex items-center gap-2.5 tracking-wide shadow-lg shadow-[#5a6b4e]/15"
                strength={0.15}
              >
                Voir les offres
                <FiArrowRight className="w-4 h-4" />
              </MagneticButton>
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   HOME PAGE
   ═══════════════════════════════════════════ */
export default function Home() {
  return (
    <>
      <SchemaOrg />
      <SEO
        title="Abonnement IPTV Premium - 15000+ Chaînes en 4K"
        description="Ciné Kin Premium offre le meilleur service IPTV avec 15000+ chaînes, films et séries en 4K UHD. Essai gratuit 24h. Compatible tous appareils."
      />
      <ParallaxHero>
        <HeroSection />
      </ParallaxHero>
      <TrustBadges />
      <StatsBar />
      <AdvantagesSection />
      <HowItWorksSection />
      <OffersSection />
      <PromoCode />
      <SavingsCalculator />
      <Gallery />
      <ResellerCTASection />
      <TestimonialsSection />
      <ServerStatus />
      <FAQSection />
      <ReferralSection />
      <FinalCTASection />
    </>
  );
}
