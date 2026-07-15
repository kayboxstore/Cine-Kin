import { motion } from "framer-motion";
import SEO from "@/components/SEO";
import { FiMonitor, FiUsers, FiGlobe, FiTrendingUp, FiAward } from "react-icons/fi";
import { SITE_CONFIG } from "@/data/siteData";
import ScrollReveal from "@/components/ScrollReveal";

const values = [
  { icon: FiMonitor, title: "Qualité avant tout", desc: "Nous privilégions la stabilité et la qualité de diffusion. Notre infrastructure est optimisée pour garantir une expérience sans interruption." },
  { icon: FiUsers, title: "Client au centre", desc: "Chaque décision est prise en pensant à l'expérience utilisateur. Notre support est réactif et à l'écoute." },
  { icon: FiGlobe, title: "Accessibilité mondiale", desc: "Notre service est disponible partout dans le monde, avec des serveurs optimisés pour chaque région." },
  { icon: FiTrendingUp, title: "Innovation continue", desc: "Nous investissons constamment dans les nouvelles technologies pour offrir toujours plus de contenu et de fonctionnalités." },
];

const stats = [
  { value: "15 000+", label: "Chaînes TV" },
  { value: "50 000+", label: "Films & Séries" },
  { value: "15 000+", label: "Clients satisfaits" },
  { value: "1 000+", label: "Revendeurs actifs" },
  { value: "40", label: "Pays couverts" },
  { value: "99.9%", label: "Uptime garanti" },
];

const milestones = [
  { year: "2020", title: "Création", desc: "Lancement de Ciné Kin Premium avec une vision claire : offrir la meilleure expérience IPTV." },
  { year: "2021", title: "Croissance", desc: "Expansion à 5000+ chaînes et premiers 1000 clients. Lancement du programme revendeur." },
  { year: "2022", title: "Innovation", desc: "Ajout du catalogue VOD 4K, applications natives et système anti-freeze de nouvelle génération." },
  { year: "2023", title: "Expansion", desc: "Présence dans 30+ pays, 1000+ revendeurs actifs et lancement du support 24/7." },
  { year: "2024", title: "Excellence", desc: "15 000+ chaînes, 50 000+ contenus VOD, infrastructure mondiale et communauté de 15 000+ clients." },
];

export default function APropos() {
  return (

    <div>

      <SEO
        title="À Propos - Ciné Kin Premium"
        description="Ciné Kin Premium : leader de l'IPTV premium depuis 2020. 15000+ clients dans 40 pays. Qualité 4K UHD."
      />
      {/* Hero */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0">
          <img src="/images/about-hero.jpg" alt="" className="w-full h-full object-cover opacity-15" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a1628]/80 via-[#0a1628]/60 to-[#0a1628]" />
        </div>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(90,107,78,0.08) 0%, transparent 50%)" }}
        />
        <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8 text-center">
          <ScrollReveal>
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-white/[0.06] bg-white/[0.02] mb-8">
              <FiAward className="w-4 h-4 text-[#6b7c5c]" />
              <span className="text-sm text-white/50">Notre histoire</span>
            </div>
            <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl text-white mb-5 tracking-[-0.02em]">
              À propos de <span className="text-[#6b7c5c]">{SITE_CONFIG.name}</span>
            </h1>
            <p className="text-white/45 text-lg max-w-3xl mx-auto font-light leading-relaxed">
              Depuis 2020, nous redéfinissons l'expérience de télévision avec une technologie de pointe et un catalogue exceptionnel.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Stats */}
      <section className="relative py-16 bg-[#111d32]/30">
        <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8">
          <ScrollReveal>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
              {stats.map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="font-display font-bold text-2xl sm:text-3xl text-white mb-1">{stat.value}</div>
                  <div className="text-white/40 text-sm tracking-wide">{stat.label}</div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Mission */}
      <section className="relative py-24">
        <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-8 text-center">
          <ScrollReveal>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-white mb-6 tracking-[-0.02em]">
              Notre <span className="text-[#6b7c5c]">mission</span>
            </h2>
            <p className="text-white/45 text-lg leading-relaxed font-light">
              {SITE_CONFIG.name} a été fondé avec une conviction simple : le divertissement devrait être accessible, de qualité et sans limites. 
              Nous construisons la plateforme IPTV la plus complète et fiable, où chaque utilisateur trouve son contenu préféré 
              en quelques clics, où qu'il soit dans le monde.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Values */}
      <section className="relative py-24 bg-[#111d32]/30">
        <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8">
          <ScrollReveal className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-white mb-4 tracking-[-0.02em]">
              Nos <span className="text-[#6b7c5c]">valeurs</span>
            </h2>
          </ScrollReveal>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-5"
          >
            {values.map((val, i) => (
              <motion.div key={i} variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6 } } }}
                className="border border-white/[0.04] rounded-2xl p-6 bg-[#0a1628]/50 hover:border-white/[0.08] transition-all">
                <div className="w-12 h-12 rounded-xl bg-[#5a6b4e]/10 flex items-center justify-center mb-4">
                  <val.icon className="w-6 h-6 text-[#6b7c5c]" />
                </div>
                <h3 className="font-display font-semibold text-lg text-white mb-2">{val.title}</h3>
                <p className="text-white/40 text-base leading-relaxed font-light">{val.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Timeline */}
      <section className="relative py-24 pb-24">
        <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-8">
          <ScrollReveal className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-white mb-4 tracking-[-0.02em]">
              Notre <span className="text-[#6b7c5c]">parcours</span>
            </h2>
          </ScrollReveal>

          <div className="relative">
            <div className="absolute left-4 sm:left-1/2 top-0 bottom-0 w-px bg-white/[0.06]" />
            {milestones.map((milestone, i) => (
              <ScrollReveal key={i} delay={i * 0.1}>
                <div className={`relative flex items-start gap-6 mb-10 ${i % 2 === 0 ? "sm:flex-row" : "sm:flex-row-reverse"}`}>
                  <div className={`flex-1 ${i % 2 === 0 ? "sm:text-right" : "sm:text-left"}`}>
                    <div className="ml-12 sm:ml-0">
                      <div className="font-display font-bold text-xl text-[#6b7c5c] mb-1">{milestone.year}</div>
                      <h3 className="font-display font-semibold text-lg text-white mb-1">{milestone.title}</h3>
                      <p className="text-white/40 text-base font-light leading-relaxed">{milestone.desc}</p>
                    </div>
                  </div>
                  <div className="absolute left-4 sm:left-1/2 w-3 h-3 rounded-full bg-[#5a6b4e] -translate-x-1/2 mt-2 ring-4 ring-[#0a1628]" />
                  <div className="hidden sm:block flex-1" />
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
