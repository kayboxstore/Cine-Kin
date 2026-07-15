import { motion } from "framer-motion";
import { FiCalendar, FiClock, FiArrowRight, FiTv, FiShield, FiWifi, FiSmartphone } from "react-icons/fi";
import SEO from "@/components/SEO";
import ScrollReveal from "@/components/ScrollReveal";
import { Link } from "react-router-dom";

const articles = [
  {
    id: 1,
    title: "Qu'est-ce que l'IPTV et comment ça marche ?",
    excerpt: "L'IPTV (Internet Protocol Television) révolutionne la façon dont nous regardons la télévision. Découvrez comment cette technologie fonctionne et pourquoi elle remplace progressivement le câble traditionnel.",
    date: "10 juillet 2026",
    readTime: "5 min",
    icon: FiTv,
    category: "Guide",
  },
  {
    id: 2,
    title: "Top 10 des chaînes sportives en 4K",
    excerpt: "Le sport en ultra haute définition change l'expérience visuelle. Voici notre sélection des meilleures chaînes sportives disponibles en 4K sur Ciné Kin Premium.",
    date: "8 juillet 2026",
    readTime: "4 min",
    icon: FiWifi,
    category: "Sport",
  },
  {
    id: 3,
    title: "Sécurité IPTV : comment protéger votre connexion",
    excerpt: "La sécurité est primordiale lors de l'utilisation de services IPTV. Apprenez les meilleures pratiques pour sécuriser votre connexion et protéger vos données personnelles.",
    date: "5 juillet 2026",
    readTime: "6 min",
    icon: FiShield,
    category: "Sécurité",
  },
  {
    id: 4,
    title: "Comparatif : Smart TV vs Android TV Box",
    excerpt: "Vous hésitez entre une Smart TV et une Android TV Box ? Nous analysons les avantages et inconvénients de chaque solution pour l'IPTV.",
    date: "2 juillet 2026",
    readTime: "7 min",
    icon: FiSmartphone,
    category: "Matériel",
  },
  {
    id: 5,
    title: "Les nouveautés Ciné Kin Premium ce mois-ci",
    excerpt: "De nouvelles chaînes, des films récents et des séries exclusives ont été ajoutés à notre catalogue. Découvrez toutes les nouveautés du mois de juillet 2026.",
    date: "1 juillet 2026",
    readTime: "3 min",
    icon: FiTv,
    category: "Actualités",
  },
  {
    id: 6,
    title: "Comment devenir revendeur IPTV",
    excerpt: "Le marché de l'IPTV connaît une croissance exponentielle. Découvrez comment lancer votre propre business avec nos packs revendeur et générer des revenus récurrents.",
    date: "28 juin 2026",
    readTime: "8 min",
    icon: FiWifi,
    category: "Business",
  },
];

export default function Blog() {
  return (
    <div className="min-h-screen bg-[#0a1628] pt-20">
      <SEO
        title="Blog - Actualités et Guides IPTV"
        description="Guides, actualités et conseils sur l'IPTV. Découvrez nos articles sur les chaînes 4K, la sécurité, le matériel et les nouveautés."
      />

      {/* Hero */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(90,107,78,0.06) 0%, transparent 50%)" }}
        />
        <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-8 text-center">
          <ScrollReveal>
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-white/[0.06] bg-white/[0.02] mb-8">
              <FiCalendar className="w-4 h-4 text-[#6b7c5c]" />
              <span className="text-sm text-white/50">Blog & Actualités</span>
            </div>
            <h1 className="font-display font-bold text-4xl sm:text-5xl text-white mb-5 tracking-[-0.02em]">
              Le <span className="text-[#6b7c5c]">blog</span> Ciné Kin
            </h1>
            <p className="text-white/45 text-lg max-w-2xl mx-auto font-light leading-relaxed">
              Guides, conseils et actualités sur l'IPTV et le streaming. Tout ce qu'il faut savoir pour profiter pleinement de votre abonnement.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="relative py-8 pb-24">
        <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {articles.map((article, index) => (
              <motion.article
                key={article.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="border border-white/[0.06] rounded-2xl p-6 bg-white/[0.02] hover:border-white/[0.10] transition-all duration-300 group cursor-pointer"
                onClick={() => window.location.href = `/blog/${article.id}`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#5a6b4e]/10 flex items-center justify-center">
                    <article.icon className="w-5 h-5 text-[#6b7c5c]" />
                  </div>
                  <span className="text-[#6b7c5c] text-xs font-semibold uppercase tracking-wider">{article.category}</span>
                </div>

                <h2 className="font-display font-semibold text-lg text-white mb-3 group-hover:text-[#6b7c5c] transition-colors">
                  {article.title}
                </h2>

                <p className="text-white/40 text-sm leading-relaxed mb-4">
                  {article.excerpt}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-white/[0.04]">
                  <div className="flex items-center gap-3 text-white/30 text-xs">
                    <span className="flex items-center gap-1">
                      <FiCalendar className="w-3 h-3" />
                      {article.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <FiClock className="w-3 h-3" />
                      {article.readTime}
                    </span>
                  </div>
                  <FiArrowRight className="w-4 h-4 text-white/20 group-hover:text-[#6b7c5c] group-hover:translate-x-1 transition-all" />
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-16 pb-24 bg-[#111d32]/30">
        <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-8 text-center">
          <ScrollReveal>
            <h2 className="font-display font-bold text-3xl text-white mb-4">
              Prêt à <span className="text-[#6b7c5c]">commencer</span> ?
            </h2>
            <p className="text-white/45 text-lg mb-8 max-w-xl mx-auto font-light">
              Essayez notre service gratuitement pendant 24h. Aucun engagement.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/offres"
                className="px-8 py-4 bg-[#5a6b4e] text-white font-semibold rounded-xl hover:bg-[#4d5d42] transition-all text-base"
              >
                Découvrir nos offres
              </Link>
              <Link
                to="/tutoriels"
                className="px-8 py-4 bg-white/[0.05] text-white/70 border border-white/[0.08] font-semibold rounded-xl hover:bg-white/[0.08] transition-all text-base"
              >
                Guides d'installation
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
