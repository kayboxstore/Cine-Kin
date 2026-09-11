import { motion } from "framer-motion";
import {
  FiAward,
  FiEye,
  FiHeadphones,
  FiMonitor,
  FiSettings,
} from "react-icons/fi";
import SEO from "@/components/SEO";
import ScrollReveal from "@/components/ScrollReveal";
import ResponsiveImage from "@/components/ResponsiveImage";
import { SITE_CONFIG } from "@/data/siteData";
import { COMMERCIAL_INFO } from "@/data/commercial";

const facts = [
  { value: "24 h", label: "Essai gratuit" },
  { value: "1 ou 2", label: "Écrans selon la formule" },
  { value: "Jusqu’à 4K", label: "Selon le contenu" },
  { value: "7j/7", label: COMMERCIAL_INFO.support.hoursShort },
];

const commitments = [
  {
    icon: FiEye,
    title: "Informations vérifiables",
    description:
      "Nous publions les prix, durées et limites de chaque formule sans promettre de volume, de disponibilité ou de résultat non mesuré.",
  },
  {
    icon: FiMonitor,
    title: "Compatibilité expliquée",
    description:
      "Le support aide à vérifier l’appareil et l’application à utiliser avant l’activation.",
  },
  {
    icon: FiHeadphones,
    title: "Support identifiable",
    description: COMMERCIAL_INFO.support.description,
  },
  {
    icon: FiSettings,
    title: "Processus manuel assumé",
    description:
      "La commande se prépare sur le site puis se finalise avec l’équipe sur WhatsApp, après confirmation des conditions.",
  },
];

export default function APropos() {
  return (
    <div>
      <SEO
        title="À propos"
        description="Découvrez le fonctionnement de Ciné Kin Premium, ses formules et ses engagements de transparence."
      />

      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0">
          <ResponsiveImage
            src="/images/about-hero.jpg"
            alt=""
            loading="eager"
            fetchPriority="high"
            className="w-full h-full object-cover opacity-15"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a1628]/80 via-[#0a1628]/60 to-[#0a1628]" />
        </div>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 50% 30%, rgba(90,107,78,0.08) 0%, transparent 50%)",
          }}
        />
        <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8 text-center">
          <ScrollReveal>
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-white/[0.06] bg-white/[0.02] mb-8">
              <FiAward className="w-4 h-4 text-[#6b7c5c]" />
              <span className="text-sm text-white/50">Notre service</span>
            </div>
            <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl text-white mb-5 tracking-[-0.02em]">
              À propos de{" "}
              <span className="text-[#6b7c5c]">{SITE_CONFIG.name}</span>
            </h1>
            <p className="text-white/60 text-lg max-w-3xl mx-auto font-light leading-relaxed">
              Une offre IPTV à durée fixe, accompagnée d’un support WhatsApp et
              d’un espace distinct pour les clients, les revendeurs et
              l’administration.
            </p>
          </ScrollReveal>
        </div>
      </section>

      <section className="relative py-16 bg-[#111d32]/30">
        <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-8">
          <ScrollReveal>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {facts.map(fact => (
                <div key={fact.label} className="text-center">
                  <div className="font-display font-bold text-2xl sm:text-3xl text-white mb-1">
                    {fact.value}
                  </div>
                  <div className="text-white/60 text-sm tracking-wide">
                    {fact.label}
                  </div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section className="relative py-24">
        <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-8 text-center">
          <ScrollReveal>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-white mb-6 tracking-[-0.02em]">
              Ce que nous <span className="text-[#6b7c5c]">proposons</span>
            </h2>
            <p className="text-white/60 text-lg leading-relaxed font-light">
              {COMMERCIAL_INFO.catalogue.headline} Les disponibilités exactes
              sont vérifiées pendant l’essai et confirmées avant toute
              souscription payante.
            </p>
          </ScrollReveal>
        </div>
      </section>

      <section className="relative py-24 bg-[#111d32]/30">
        <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8">
          <ScrollReveal className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-white mb-4 tracking-[-0.02em]">
              Nos engagements de{" "}
              <span className="text-[#6b7c5c]">transparence</span>
            </h2>
          </ScrollReveal>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
            }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-5"
          >
            {commitments.map((commitment, index) => (
              <motion.div
                key={commitment.title}
                variants={{
                  hidden: { opacity: 0, y: 30 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: { delay: index * 0.1, duration: 0.6 },
                  },
                }}
                className="border border-white/[0.04] rounded-2xl p-6 bg-[#0a1628]/50 hover:border-white/[0.08] transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-[#5a6b4e]/10 flex items-center justify-center mb-4">
                  <commitment.icon className="w-6 h-6 text-[#6b7c5c]" />
                </div>
                <h3 className="font-display font-semibold text-lg text-white mb-2">
                  {commitment.title}
                </h3>
                <p className="text-white/60 text-base leading-relaxed font-light">
                  {commitment.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
