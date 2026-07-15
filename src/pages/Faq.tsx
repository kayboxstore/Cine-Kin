import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiSearch, FiChevronDown, FiChevronUp, FiHelpCircle } from "react-icons/fi";
import SEO from "@/components/SEO";
import ScrollReveal from "@/components/ScrollReveal";

const categories = ["Tous", "Général", "Installation", "Paiement", "Technique", "Revendeurs"];

const faqs = [
  { q: "Qu'est-ce que Ciné Kin Premium ?", a: "Ciné Kin Premium est un service d'abonnement IPTV qui vous donne accès à plus de 15 000 chaînes TV, films et séries en qualité HD et 4K UHD, depuis n'importe quel appareil connecté.", cat: "Général" },
  { q: "L'essai gratuit de 24h est-il vraiment gratuit ?", a: "Oui, l'essai de 24 heures est complètement gratuit et sans engagement. Vous pouvez tester toutes les fonctionnalités du service avant de souscrire un abonnement.", cat: "Général" },
  { q: "Quels appareils sont compatibles ?", a: "Notre service fonctionne sur Smart TV (Samsung, LG), Android TV, Amazon Fire Stick, Apple TV, iPhone, iPad, smartphones Android, PC, Mac, et via les navigateurs web.", cat: "Installation" },
  { q: "Comment installer le service sur ma Smart TV ?", a: "Installez l'application IPTV Smarters Pro depuis le magasin d'applications de votre TV, entrez vos identifiants (fournis après l'achat), et profitez immédiatement du contenu. Le processus prend moins de 5 minutes.", cat: "Installation" },
  { q: "Quels modes de paiement acceptez-vous ?", a: "Nous acceptons les paiements via Mobile Money (MPesa, Airtel Money, Orange Money), virement bancaire, et PayPal. Le paiement se fait en toute sécurité via WhatsApp avec confirmation.", cat: "Paiement" },
  { q: "Puis-je annuler mon abonnement ?", a: "Oui, vous pouvez annuler votre abonnement à tout moment. Aucun remboursement n'est effectué pour les périodes en cours, mais vous conservez l'accès jusqu'à la fin de votre période payée.", cat: "Paiement" },
  { q: "La qualité vidéo est-elle vraiment en 4K ?", a: "Oui, nous proposons du contenu en 4K UHD pour les chaînes et films disponibles en cette qualité. La lecture s'adapte automatiquement à votre connexion internet (minimum 10 Mbps recommandé pour le 4K).", cat: "Technique" },
  { q: "Le service fonctionne-t-il avec une connexion lente ?", a: "Une connexion de 4 Mbps minimum est recommandée pour le HD, et 10 Mbps pour le 4K. Notre service s'adapte automatiquement à votre bande passante pour offrir la meilleure qualité possible.", cat: "Technique" },
  { q: "Y a-t-il un guide des programmes (EPG) ?", a: "Oui, un guide électronique des programmes (EPG) complet est inclus, couvrant plus de 7 jours de programmation pour la plupart des chaînes.", cat: "Technique" },
  { q: "Puis-je utiliser mon abonnement sur plusieurs appareils ?", a: "Chaque abonnement client permet l'utilisation sur un appareil à la fois. Les packs revendeurs permettent de générer plusieurs codes d'accès pour différents clients.", cat: "Technique" },
  { q: "Comment devenir revendeur ?", a: "Choisissez un pack revendeur (Starter, Business, Pro ou VIP), contactez-nous via WhatsApp, et nous vous fournirons un panneau d'administration pour gérer vos codes et clients.", cat: "Revendeurs" },
  { q: "Quelle marge puis-je faire en tant que revendeur ?", a: "Nos revendeurs réalisent une marge de 150% à 300% selon le pack choisi et leur stratégie de prix. Le pack Starter à $199.99 permet déjà de générer plus de $500 de revenus.", cat: "Revendeurs" },
];

export default function Faq() {
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("Tous");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const filtered = faqs.filter((f) => {
    const matchSearch =
      search === "" ||
      f.q.toLowerCase().includes(search.toLowerCase()) ||
      f.a.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCat === "Tous" || f.cat === activeCat;
    return matchSearch && matchCat;
  });

  return (
    <div className="min-h-screen bg-[#0a1628] pt-20">
      <SEO
        title="FAQ - Questions Fréquentes"
        description="Trouvez les réponses à vos questions sur Ciné Kin Premium : installation, paiement, compatibilité, revendeurs."
      />

      {/* Hero */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(90,107,78,0.06) 0%, transparent 50%)" }}
        />
        <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-8 text-center">
          <ScrollReveal>
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-white/[0.06] bg-white/[0.02] mb-8">
              <FiHelpCircle className="w-4 h-4 text-[#6b7c5c]" />
              <span className="text-sm text-white/50">Centre d'aide</span>
            </div>
            <h1 className="font-display font-bold text-4xl sm:text-5xl text-white mb-5 tracking-[-0.02em]">
              Questions <span className="text-[#6b7c5c]">fréquentes</span>
            </h1>
            <p className="text-white/45 text-lg max-w-2xl mx-auto font-light leading-relaxed">
              Trouvez rapidement les réponses à vos questions sur notre service IPTV.
            </p>
          </ScrollReveal>

          {/* Search */}
          <ScrollReveal delay={0.1}>
            <div className="relative max-w-lg mx-auto mt-10">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher une question..."
                className="w-full pl-12 pr-4 py-4 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white placeholder-white/25 focus:outline-none focus:border-[#5a6b4e]/40 transition-all text-base"
              />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Categories + FAQ */}
      <section className="relative py-8 pb-24">
        <div className="relative z-10 max-w-3xl mx-auto px-6 sm:px-8">
          {/* Category tabs */}
          <div className="flex flex-wrap gap-2 mb-8 justify-center">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCat(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeCat === cat
                    ? "bg-[#5a6b4e] text-white"
                    : "bg-white/[0.03] text-white/45 hover:text-white/65 border border-white/[0.06]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Results count */}
          <p className="text-white/30 text-sm mb-6 text-center">
            {filtered.length} résultat{filtered.length > 1 ? "s" : ""}
          </p>

          {/* FAQ items */}
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filtered.map((faq, i) => (
                <motion.div
                  key={faq.q}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="border border-white/[0.06] rounded-xl overflow-hidden bg-white/[0.02]"
                >
                  <button
                    onClick={() => setOpenIndex(openIndex === i ? null : i)}
                    className="w-full flex items-center justify-between p-5 text-left"
                  >
                    <span className="text-white font-medium text-base pr-4">{faq.q}</span>
                    {openIndex === i ? (
                      <FiChevronUp className="w-5 h-5 text-[#5a6b4e] flex-shrink-0" />
                    ) : (
                      <FiChevronDown className="w-5 h-5 text-white/30 flex-shrink-0" />
                    )}
                  </button>
                  <AnimatePresence>
                    {openIndex === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        <div className="px-5 pb-5 border-t border-white/[0.04] pt-4">
                          <p className="text-white/50 text-sm leading-relaxed">{faq.a}</p>
                          <span className="inline-block mt-3 px-2.5 py-1 bg-white/[0.03] text-white/30 text-xs rounded-lg">
                            {faq.cat}
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-12">
              <FiSearch className="w-10 h-10 text-white/15 mx-auto mb-3" />
              <p className="text-white/35 text-base">Aucun résultat pour "{search}"</p>
              <button
                onClick={() => { setSearch(""); setActiveCat("Tous"); }}
                className="text-[#6b7c5c] text-sm mt-2 hover:underline"
              >
                Réinitialiser la recherche
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
