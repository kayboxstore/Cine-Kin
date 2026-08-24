import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiCalendar,
  FiClock,
  FiArrowLeft,
  FiTv,
  FiShield,
  FiWifi,
  FiSmartphone,
  FiUser,
  FiTag,
  FiShare2,
  FiTwitter,
  FiFacebook,
  FiLinkedin,
} from "react-icons/fi";
import SEO from "@/components/SEO";
import ScrollReveal from "@/components/ScrollReveal";
import { COMMERCIAL_INFO } from "@/data/commercial";
import ResponsiveImage from "@/components/ResponsiveImage";

const articles = [
  {
    id: 1,
    title: "Qu'est-ce que l'IPTV et comment ça marche ?",
    excerpt:
      "L'IPTV (Internet Protocol Television) révolutionne la façon dont nous regardons la télévision.",
    date: "10 juillet 2026",
    readTime: "5 min",
    icon: FiTv,
    category: "Guide",
    author: "Ciné Kin Team",
    authorRole: "Expert IPTV",
    image: "/images/tv-sports.jpg",
    content: [
      {
        heading: "Définition de l'IPTV",
        text: "L'IPTV (Internet Protocol Television) est une technologie qui permet de diffuser des contenus télévisés via Internet plutôt que par les ondes hertziennes traditionnelles, le satellite ou le câble. Contrairement à la télévision classique, l'IPTV utilise le protocole IP pour transmettre les signaux vidéo, offrant ainsi une flexibilité et une interactivité sans précédent.",
      },
      {
        heading: "Comment fonctionne l'IPTV ?",
        text: "Le principe est simple : au lieu de recevoir des signaux via une antenne ou un câble, vous recevez le contenu via votre connexion Internet. Les chaînes sont encodées en numérique, compressées et envoyées sous forme de paquets de données IP. Votre décodeur ou application IPTV reçoit ces paquets, les décompresse et les affiche sur votre écran en temps réel.",
      },
      {
        heading: "Les trois types d'IPTV",
        text: "Il existe trois grands types de services IPTV : le Video on Demand (VOD) qui permet de choisir ce que vous voulez regarder à tout moment, le time-shifted TV qui permet de regarder des programmes en différé, et le live IPTV qui diffuse les chaînes en direct comme la télévision traditionnelle.",
      },
      {
        heading: "Avantages par rapport au câble traditionnel",
        text: "L'IPTV peut proposer un catalogue à la demande, plusieurs niveaux de qualité et des fonctions comme le replay ou l'EPG. Leur disponibilité dépend toutefois du fournisseur, de la source, de l'appareil et de la formule.",
      },
      {
        heading: "Pourquoi choisir Ciné Kin Premium ?",
        text: `${COMMERCIAL_INFO.catalogue.headline} ${COMMERCIAL_INFO.support.description}`,
      },
    ],
  },
  {
    id: 2,
    title: "Bien préparer le streaming sportif en 4K",
    excerpt:
      "Les points à vérifier avant de regarder un contenu sportif en ultra haute définition.",
    date: "8 juillet 2026",
    readTime: "4 min",
    icon: FiWifi,
    category: "Sport",
    author: "Ciné Kin Team",
    authorRole: "Expert Sport",
    image: "/images/tv-sports.jpg",
    content: [
      {
        heading: "L'expérience sport en 4K",
        text: "Regarder le sport en 4K, c'est vivre l'action comme si vous y étiez. Avec une résolution quatre fois supérieure à la Full HD, chaque détail est visible : le gazon du terrain, les expressions des joueurs, la texture des maillots. L'immersion est totale.",
      },
      {
        heading: "Vérifier la disponibilité",
        text: "Une chaîne ou un événement n'est pas systématiquement disponible en 4K. Vérifiez le catalogue pendant l'essai et demandez confirmation au support avant de choisir une formule.",
      },
      {
        heading: "Connexion et stabilité",
        text: "Le débit utile, la stabilité du Wi-Fi et la charge du réseau influencent la lecture. Une connexion Ethernet peut être préférable lorsque le téléviseur est éloigné du routeur.",
      },
      {
        heading: "Équipement compatible",
        text: "Le téléviseur, l'application, le câble HDMI et le boîtier doivent tous prendre en charge la définition visée. Utilisez l'essai gratuit pour contrôler l'ensemble de la chaîne de lecture.",
      },
    ],
  },
  {
    id: 3,
    title: "Sécurité IPTV : comment protéger votre connexion",
    excerpt:
      "La sécurité est primordiale lors de l'utilisation de services IPTV.",
    date: "5 juillet 2026",
    readTime: "6 min",
    icon: FiShield,
    category: "Sécurité",
    author: "Ciné Kin Team",
    authorRole: "Expert Sécurité",
    image: "/images/devices.jpg",
    content: [
      {
        heading: "Pourquoi la sécurité est importante",
        text: "Lorsque vous utilisez un service IPTV, votre connexion Internet transmet des données potentiellement sensibles. Protéger cette connexion est essentiel pour préserver votre vie privée et éviter toute interception malveillante.",
      },
      {
        heading: "Utiliser un VPN",
        text: "Un VPN (Virtual Private Network) peut chiffrer le trafic entre votre appareil et le serveur VPN et masquer votre adresse IP publique au service consulté. Il ne remplace pas les mises à jour, des mots de passe robustes ni la prudence face aux applications non officielles.",
      },
      {
        heading: "Choisir un fournisseur fiable",
        text: "Vérifiez l'identité du fournisseur, les conditions, la politique de confidentialité et les moyens de contact avant de payer. Aucun service ne peut garantir une sécurité absolue.",
      },
      {
        heading: "Protéger vos appareils",
        text: "Gardez vos appareils à jour avec les dernières mises à jour de sécurité. Utilisez un antivirus fiable et évitez de télécharger des applications IPTV depuis des sources non officielles.",
      },
    ],
  },
  {
    id: 4,
    title: "Comparatif : Smart TV vs Android TV Box",
    excerpt: "Vous hésitez entre une Smart TV et une Android TV Box ?",
    date: "2 juillet 2026",
    readTime: "7 min",
    icon: FiSmartphone,
    category: "Matériel",
    author: "Ciné Kin Team",
    authorRole: "Expert Matériel",
    image: "/images/devices.jpg",
    content: [
      {
        heading: "La Smart TV : simplicité intégrée",
        text: "Une Smart TV intègre directement les applications et la connectivité Internet. Aucun appareil supplémentaire n'est nécessaire. Les marques comme Samsung (Tizen), LG (webOS) et Sony (Android TV) offrent des expériences utilisateur fluides avec des magasins d'applications dédiés.",
      },
      {
        heading: "L'Android TV Box : polyvalence et performance",
        text: "Une Android TV Box se connecte à n'importe quel téléviseur avec un port HDMI. Elle offre l'écosystème Google Play complet, des mises à jour fréquentes et des performances souvent supérieures aux systèmes intégrés des téléviseurs.",
      },
      {
        heading: "Comparaison des fonctionnalités",
        text: "La Smart TV offre une expérience plus épurée avec une seule télécommande. L'Android TV Box peut offrir davantage de flexibilité. La compatibilité dépend du modèle, du système et de l'application disponible.",
      },
      {
        heading: "Notre recommandation",
        text: "Si vous avez déjà une Smart TV récente, commencez par les applications disponibles. Si vous cherchez la meilleure performance et la plus grande flexibilité, optez pour une Android TV Box comme la Nvidia Shield, Xiaomi Mi Box ou Chromecast avec Google TV.",
      },
    ],
  },
  {
    id: 5,
    title: "Comment vérifier le catalogue avant de souscrire",
    excerpt:
      "Une méthode simple pour vérifier contenus, qualité et compatibilité pendant l'essai.",
    date: "1 juillet 2026",
    readTime: "3 min",
    icon: FiTv,
    category: "Guide",
    author: "Ciné Kin Team",
    authorRole: "Équipe Éditoriale",
    image: "/images/iptv-interface.jpg",
    content: [
      {
        heading: "Préparez votre liste",
        text: "Notez les chaînes, langues, catégories et appareils qui comptent pour vous. Une liste concrète permet de vérifier l'offre sans se fier à un volume global.",
      },
      {
        heading: "Utilisez l'essai gratuit",
        text: "Testez les contenus prioritaires, les heures de forte audience, la qualité disponible et votre appareil habituel pendant les 24 heures d'essai.",
      },
      {
        heading: "Vérifiez les limites",
        text: "Contrôlez le nombre d'écrans simultanés, la présence de l'EPG et les fonctions de replay dont vous avez réellement besoin.",
      },
      {
        heading: "Demandez une confirmation",
        text: "Avant de payer, demandez au support de confirmer la formule, le prix, la durée et les conditions applicables à votre commande.",
      },
    ],
  },
  {
    id: 6,
    title: "Comment devenir revendeur IPTV",
    excerpt:
      "Comprendre les outils, les coûts et les responsabilités d'un pack revendeur.",
    date: "28 juin 2026",
    readTime: "8 min",
    icon: FiWifi,
    category: "Business",
    author: "Ciné Kin Team",
    authorRole: "Expert Business",
    image: "/images/iptv-interface.jpg",
    content: [
      {
        heading: "Évaluer le projet",
        text: "Avant d'acheter un pack, estimez vos coûts, votre prix de vente, le support que vous devrez fournir et les obligations applicables dans votre pays.",
      },
      {
        heading: "Pourquoi devenir revendeur ?",
        text: `Le portail permet de gérer des codes et des activations pour vos clients. ${COMMERCIAL_INFO.reseller.description}`,
      },
      {
        heading: "Nos packs revendeur",
        text: "Ciné Kin Premium affiche quatre packs : Starter (20 codes), Business (50 codes), Pro (100 codes) et VIP (500 codes). Consultez la page Revendeurs pour voir les prix et les fonctions actuellement annoncées.",
      },
      {
        heading: "Comment démarrer",
        text: "Rendez-vous sur la page Revendeurs, comparez les packs et préparez une demande WhatsApp. Vérifiez le prix, les fonctions, le support et les conditions avant paiement.",
      },
    ],
  },
];

export default function BlogArticle() {
  const { id } = useParams<{ id: string }>();
  const articleId = parseInt(id || "1");
  const article = articles.find(a => a.id === articleId);

  if (!article) {
    return (
      <div className="min-h-screen bg-[#0a1628] pt-32 text-center">
        <SEO
          title="Article non trouvé"
          description="L’article demandé n’existe pas."
          noIndex
        />
        <h1 className="text-white text-2xl font-bold mb-4">
          Article non trouvé
        </h1>
        <Link to="/blog" className="text-[#6b7c5c] hover:underline">
          Retour au blog
        </Link>
      </div>
    );
  }

  const relatedArticles = articles
    .filter(a => a.id !== article.id && a.category === article.category)
    .slice(0, 2);
  const shareUrl = encodeURIComponent(window.location.href);
  const shareTitle = encodeURIComponent(article.title);

  return (
    <div className="min-h-screen bg-[#0a1628] pt-20">
      <SEO
        title={`${article.title} - Blog Ciné Kin Premium`}
        description={article.excerpt}
        canonical={`/blog/${article.id}`}
        ogType="article"
      />

      {/* Hero */}
      <section className="relative py-16 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 50% 30%, rgba(90,107,78,0.06) 0%, transparent 50%)",
          }}
        />
        <div className="relative z-10 max-w-3xl mx-auto px-6 sm:px-8">
          <ScrollReveal>
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-white/60 hover:text-[#6b7c5c] transition-colors text-sm mb-8"
            >
              <FiArrowLeft className="w-4 h-4" />
              Retour au blog
            </Link>

            <div className="flex items-center gap-3 mb-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#5a6b4e]/15 text-[#6b7c5c] text-xs font-semibold">
                <FiTag className="w-3 h-3" />
                {article.category}
              </span>
              <span className="flex items-center gap-1 text-white/55 text-xs">
                <FiCalendar className="w-3 h-3" />
                {article.date}
              </span>
              <span className="flex items-center gap-1 text-white/55 text-xs">
                <FiClock className="w-3 h-3" />
                {article.readTime}
              </span>
            </div>

            <h1 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl text-white mb-6 tracking-[-0.02em] leading-tight">
              {article.title}
            </h1>

            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-full bg-[#5a6b4e]/15 flex items-center justify-center">
                <FiUser className="w-5 h-5 text-[#6b7c5c]" />
              </div>
              <div>
                <div className="text-white text-sm font-medium">
                  {article.author}
                </div>
                <div className="text-white/60 text-xs">
                  {article.authorRole}
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Featured Image */}
      <section className="relative pb-12">
        <div className="max-w-4xl mx-auto px-6 sm:px-8">
          <ScrollReveal>
            <div className="relative rounded-2xl overflow-hidden border border-white/[0.06]">
              <ResponsiveImage
                src={article.image}
                alt={article.title}
                sizes="(min-width: 896px) 896px, 100vw"
                className="w-full h-64 sm:h-80 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628]/60 to-transparent" />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Article Content */}
      <section className="relative pb-20">
        <div className="max-w-3xl mx-auto px-6 sm:px-8">
          <ScrollReveal>
            <div className="space-y-8">
              {article.content.map((section, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <h2 className="font-display font-bold text-xl sm:text-2xl text-white mb-3">
                    {section.heading}
                  </h2>
                  <p className="text-white/55 text-base leading-relaxed font-light">
                    {section.text}
                  </p>
                </motion.div>
              ))}
            </div>
          </ScrollReveal>

          {/* Share */}
          <ScrollReveal delay={0.2}>
            <div className="mt-12 pt-8 border-t border-white/[0.06]">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <FiShare2 className="w-4 h-4 text-white/55" />
                  <span className="text-white/60 text-sm">Partager :</span>
                  <a
                    href={`https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareTitle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Partager sur X"
                    className="w-8 h-8 rounded-full bg-white/[0.04] flex items-center justify-center text-white/55 hover:text-[#1DA1F2] hover:bg-[#1DA1F2]/10 transition-all"
                  >
                    <FiTwitter className="w-4 h-4" />
                  </a>
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Partager sur Facebook"
                    className="w-8 h-8 rounded-full bg-white/[0.04] flex items-center justify-center text-white/55 hover:text-[#4267B2] hover:bg-[#4267B2]/10 transition-all"
                  >
                    <FiFacebook className="w-4 h-4" />
                  </a>
                  <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Partager sur LinkedIn"
                    className="w-8 h-8 rounded-full bg-white/[0.04] flex items-center justify-center text-white/55 hover:text-[#0077b5] hover:bg-[#0077b5]/10 transition-all"
                  >
                    <FiLinkedin className="w-4 h-4" />
                  </a>
                </div>
                <Link
                  to="/blog"
                  className="inline-flex items-center gap-2 text-[#6b7c5c] hover:text-[#7a8f6a] transition-colors text-sm"
                >
                  <FiArrowLeft className="w-4 h-4" />
                  Tous les articles
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <section className="relative py-16 bg-[#111d32]/30">
          <div className="max-w-4xl mx-auto px-6 sm:px-8">
            <ScrollReveal>
              <h2 className="font-display font-bold text-2xl text-white mb-8">
                Articles <span className="text-[#6b7c5c]">similaires</span>
              </h2>
            </ScrollReveal>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {relatedArticles.map(related => {
                const RelatedIcon = related.icon;
                return (
                  <motion.article
                    key={related.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="border border-white/[0.06] rounded-xl p-5 bg-white/[0.02] hover:border-white/[0.10] transition-all duration-300 group"
                  >
                    <Link to={`/blog/${related.id}`}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-lg bg-[#5a6b4e]/10 flex items-center justify-center">
                          <RelatedIcon className="w-4 h-4 text-[#6b7c5c]" />
                        </div>
                        <span className="text-[#6b7c5c] text-xs font-semibold uppercase tracking-wider">
                          {related.category}
                        </span>
                      </div>
                      <h3 className="font-display font-semibold text-base text-white mb-2 group-hover:text-[#6b7c5c] transition-colors">
                        {related.title}
                      </h3>
                      <p className="text-white/60 text-sm line-clamp-2">
                        {related.excerpt}
                      </p>
                    </Link>
                  </motion.article>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="relative py-16 pb-24">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 text-center">
          <ScrollReveal>
            <h2 className="font-display font-bold text-3xl text-white mb-4">
              Prêt à <span className="text-[#6b7c5c]">commencer</span> ?
            </h2>
            <p className="text-white/60 text-lg mb-8 max-w-xl mx-auto font-light">
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
