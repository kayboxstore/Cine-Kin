import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiCalendar, FiClock, FiArrowLeft, FiTv, FiShield,
  FiWifi, FiSmartphone, FiUser, FiTag,
  FiShare2, FiTwitter, FiFacebook, FiLinkedin
} from "react-icons/fi";
import SEO from "@/components/SEO";
import ScrollReveal from "@/components/ScrollReveal";

const articles = [
  {
    id: 1,
    title: "Qu'est-ce que l'IPTV et comment ça marche ?",
    excerpt: "L'IPTV (Internet Protocol Television) révolutionne la façon dont nous regardons la télévision.",
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
        text: "L'IPTV (Internet Protocol Television) est une technologie qui permet de diffuser des contenus télévisés via Internet plutôt que par les ondes hertziennes traditionnelles, le satellite ou le câble. Contrairement à la télévision classique, l'IPTV utilise le protocole IP pour transmettre les signaux vidéo, offrant ainsi une flexibilité et une interactivité sans précédent."
      },
      {
        heading: "Comment fonctionne l'IPTV ?",
        text: "Le principe est simple : au lieu de recevoir des signaux via une antenne ou un câble, vous recevez le contenu via votre connexion Internet. Les chaînes sont encodées en numérique, compressées et envoyées sous forme de paquets de données IP. Votre décodeur ou application IPTV reçoit ces paquets, les décompresse et les affiche sur votre écran en temps réel."
      },
      {
        heading: "Les trois types d'IPTV",
        text: "Il existe trois grands types de services IPTV : le Video on Demand (VOD) qui permet de choisir ce que vous voulez regarder à tout moment, le time-shifted TV qui permet de regarder des programmes en différé, et le live IPTV qui diffuse les chaînes en direct comme la télévision traditionnelle."
      },
      {
        heading: "Avantages par rapport au câble traditionnel",
        text: "L'IPTV offre de nombreux avantages : un catalogue bien plus vaste de chaînes internationales, une qualité d'image supérieure jusqu'en 4K, la compatibilité avec tous les appareils connectés, et des fonctionnalités avancées comme le replay, le catch-up TV et l'EPG (guide électronique des programmes)."
      },
      {
        heading: "Pourquoi choisir Ciné Kin Premium ?",
        text: "Avec Ciné Kin Premium, vous accédez à plus de 15 000 chaînes, des milliers de films et séries en VOD, le tout en qualité HD, Full HD et 4K. Notre service est compatible avec tous vos appareils et notre support technique est disponible 7j/7 pour vous accompagner."
      }
    ]
  },
  {
    id: 2,
    title: "Top 10 des chaînes sportives en 4K",
    excerpt: "Le sport en ultra haute définition change l'expérience visuelle.",
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
        text: "Regarder le sport en 4K, c'est vivre l'action comme si vous y étiez. Avec une résolution quatre fois supérieure à la Full HD, chaque détail est visible : le gazon du terrain, les expressions des joueurs, la texture des maillots. L'immersion est totale."
      },
      {
        heading: "Les chaînes incontournables",
        text: "Notre sélection comprend les meilleures chaînes sportives internationales : beIN Sports, ESPN, Sky Sports, BT Sport, Canal+ Sport, RMC Sport, Eleven Sports, DAZN, Fox Sports et NBC Sports. Chacune offre une couverture complète des événements majeurs."
      },
      {
        heading: "Football, basketball, tennis et plus",
        text: "Accédez à toutes les ligues majeures : Ligue 1, Premier League, Liga, Serie A, Bundesliga, NBA, NFL, Grand Chelem tennis, F1, MotoGP et bien plus encore. Ne manquez jamais un match important."
      },
      {
        heading: "Qualité de streaming optimale",
        text: "Pour profiter pleinement du 4K, une connexion d'au moins 25 Mbps est recommandée. Notre technologie anti-freeze garantit un streaming fluide même pendant les pics d'audience des grands événements."
      }
    ]
  },
  {
    id: 3,
    title: "Sécurité IPTV : comment protéger votre connexion",
    excerpt: "La sécurité est primordiale lors de l'utilisation de services IPTV.",
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
        text: "Lorsque vous utilisez un service IPTV, votre connexion Internet transmet des données potentiellement sensibles. Protéger cette connexion est essentiel pour préserver votre vie privée et éviter toute interception malveillante."
      },
      {
        heading: "Utiliser un VPN",
        text: "Un VPN (Virtual Private Network) chiffre votre connexion Internet et masque votre adresse IP. Cela rend vos activités en ligne privées et sécurisées. Choisissez un VPN fiable avec des serveurs rapides pour ne pas dégrader la qualité du stream."
      },
      {
        heading: "Choisir un fournisseur fiable",
        text: "Optez toujours pour un fournisseur IPTV réputé et établi. Évitez les services gratuits suspects qui peuvent contenir des malwares ou vendre vos données personnelles. Ciné Kin Premium garantit la sécurité et la confidentialité de vos données."
      },
      {
        heading: "Protéger vos appareils",
        text: "Gardez vos appareils à jour avec les dernières mises à jour de sécurité. Utilisez un antivirus fiable et évitez de télécharger des applications IPTV depuis des sources non officielles."
      }
    ]
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
        text: "Une Smart TV intègre directement les applications et la connectivité Internet. Aucun appareil supplémentaire n'est nécessaire. Les marques comme Samsung (Tizen), LG (webOS) et Sony (Android TV) offrent des expériences utilisateur fluides avec des magasins d'applications dédiés."
      },
      {
        heading: "L'Android TV Box : polyvalence et performance",
        text: "Une Android TV Box se connecte à n'importe quel téléviseur avec un port HDMI. Elle offre l'écosystème Google Play complet, des mises à jour fréquentes et des performances souvent supérieures aux systèmes intégrés des téléviseurs."
      },
      {
        heading: "Comparaison des fonctionnalités",
        text: "La Smart TV offre une expérience plus épurée avec une seule télécommande. L'Android TV Box offre plus de flexibilité, des applications supplémentaires et un meilleur rapport performance/prix. Les deux solutions fonctionnent parfaitement avec Ciné Kin Premium."
      },
      {
        heading: "Notre recommandation",
        text: "Si vous avez déjà une Smart TV récente, commencez par les applications disponibles. Si vous cherchez la meilleure performance et la plus grande flexibilité, optez pour une Android TV Box comme la Nvidia Shield, Xiaomi Mi Box ou Chromecast avec Google TV."
      }
    ]
  },
  {
    id: 5,
    title: "Les nouveautés Ciné Kin Premium ce mois-ci",
    excerpt: "De nouvelles chaînes, des films récents et des séries exclusives.",
    date: "1 juillet 2026",
    readTime: "3 min",
    icon: FiTv,
    category: "Actualités",
    author: "Ciné Kin Team",
    authorRole: "Équipe Éditoriale",
    image: "/images/iptv-interface.jpg",
    content: [
      {
        heading: "Nouvelles chaînes ajoutées",
        text: "Ce mois-ci, nous avons ajouté plus de 500 nouvelles chaînes à notre catalogue, portant le total à plus de 15 000. Parmi les nouveautés : de nouvelles chaînes africaines, des chaînes de sport supplémentaires et des chaînes cinéma en plusieurs langues."
      },
      {
        heading: "Nouveautés VOD",
        text: "Notre bibliothèque VOD s'enrichit chaque semaine avec les dernières sorties cinéma et les nouveaux épisodes de séries populaires. Retrouvez les blockbusters du moment et les séries les plus regardées."
      },
      {
        heading: "Améliorations techniques",
        text: "Nous avons optimisé nos serveurs pour une latence réduite et une qualité de stream encore meilleure. Notre système anti-freeze a été mis à jour pour garantir une expérience sans interruption."
      },
      {
        heading: "Prochainement",
        text: "Dans les semaines à venir, nous déploierons une nouvelle interface utilisateur plus intuitive, des fonctionnalités de personnalisation avancées et une application mobile dédiée. Restez connectés !"
      }
    ]
  },
  {
    id: 6,
    title: "Comment devenir revendeur IPTV",
    excerpt: "Le marché de l'IPTV connaît une croissance exponentielle.",
    date: "28 juin 2026",
    readTime: "8 min",
    icon: FiWifi,
    category: "Business",
    author: "Ciné Kin Team",
    authorRole: "Expert Business",
    image: "/images/iptv-interface.jpg",
    content: [
      {
        heading: "Un marché en pleine expansion",
        text: "Le marché mondial de l'IPTV devrait atteindre plus de 100 milliards de dollars d'ici 2028. Cette croissance exponentielle crée des opportunités exceptionnelles pour les entrepreneurs qui souhaitent se positionner sur ce marché en plein essor."
      },
      {
        heading: "Pourquoi devenir revendeur ?",
        text: "Devenir revendeur IPTV vous permet de générer des revenus récurrents avec des marges supérieures à 150%. Vous travaillez à votre propre rythme, depuis n'importe où dans le monde, avec des investissements initiaux minimes."
      },
      {
        heading: "Nos packs revendeur",
        text: "Ciné Kin Premium propose quatre packs adaptés à vos ambitions : Starter (20 codes), Business (50 codes), Pro (100 codes) et VIP (500 codes). Chaque pack inclut un panneau revendeur, un support dédié et des outils de gestion complets."
      },
      {
        heading: "Comment démarrer",
        text: "Rendez-vous sur notre page Revendeurs, choisissez le pack qui vous convient et créez votre compte. Notre équipe vous accompagne dans la configuration de votre panneau et vous fournit tous les guides nécessaires pour réussir."
      }
    ]
  },
];

export default function BlogArticle() {
  const { id } = useParams<{ id: string }>();
  const articleId = parseInt(id || "1");
  const article = articles.find(a => a.id === articleId);

  if (!article) {
    return (
      <div className="min-h-screen bg-[#0a1628] pt-32 text-center">
        <h1 className="text-white text-2xl font-bold mb-4">Article non trouvé</h1>
        <Link to="/blog" className="text-[#6b7c5c] hover:underline">
          Retour au blog
        </Link>
      </div>
    );
  }

  const relatedArticles = articles
    .filter(a => a.id !== article.id && a.category === article.category)
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-[#0a1628] pt-20">
      <SEO
        title={`${article.title} - Blog Ciné Kin Premium`}
        description={article.excerpt}
      />

      {/* Hero */}
      <section className="relative py-16 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at 50% 30%, rgba(90,107,78,0.06) 0%, transparent 50%)",
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
                <div className="text-white text-sm font-medium">{article.author}</div>
                <div className="text-white/60 text-xs">{article.authorRole}</div>
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
              <img
                src={article.image}
                alt={article.title}
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
                  <button className="w-8 h-8 rounded-full bg-white/[0.04] flex items-center justify-center text-white/55 hover:text-[#1DA1F2] hover:bg-[#1DA1F2]/10 transition-all">
                    <FiTwitter className="w-4 h-4" />
                  </button>
                  <button className="w-8 h-8 rounded-full bg-white/[0.04] flex items-center justify-center text-white/55 hover:text-[#4267B2] hover:bg-[#4267B2]/10 transition-all">
                    <FiFacebook className="w-4 h-4" />
                  </button>
                  <button className="w-8 h-8 rounded-full bg-white/[0.04] flex items-center justify-center text-white/55 hover:text-[#0077b5] hover:bg-[#0077b5]/10 transition-all">
                    <FiLinkedin className="w-4 h-4" />
                  </button>
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
              {relatedArticles.map((related) => {
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
                      <p className="text-white/60 text-sm line-clamp-2">{related.excerpt}</p>
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
