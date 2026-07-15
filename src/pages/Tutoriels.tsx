import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiMonitor, FiSmartphone, FiTv, FiBox, FiChevronDown, FiChevronUp,
  FiDownload, FiSettings, FiWifi, FiPlay, FiCheckCircle
} from "react-icons/fi";
import ScrollReveal from "@/components/ScrollReveal";
import SEO from "@/components/SEO";

const tutorials = [
  {
    id: "smarttv",
    icon: FiTv,
    name: "Smart TV (Samsung / LG)",
    steps: [
      "Ouvrez le magasin d'applications de votre TV (Smart Hub / LG Content Store)",
      "Recherchez l'application IPTV recommandée (Smart IPTV ou IPTV Smarters)",
      "Installez et ouvrez l'application",
      "Notez la MAC ADDRESS affichée à l'écran",
      "Envoyez-nous la MAC ADDRESS via WhatsApp, nous activons votre compte",
      "Redémarrez l'application, vos chaînes apparaissent automatiquement",
    ],
    tips: "Pour les TV Samsung, utilisez Smart IPTV. Pour les TV LG, IPTV Smarters Pro est recommandé.",
  },
  {
    id: "androidtv",
    icon: FiMonitor,
    name: "Android TV / Box",
    steps: [
      "Ouvrez le Google Play Store sur votre Android TV",
      "Recherchez 'IPTV Smarters Pro' et installez l'application",
      "Ouvrez l'application et sélectionnez 'Login with Xtream Codes API'",
      "Entrez les identifiants que nous vous avons envoyés (Username, Password, URL)",
      "Cliquez sur 'Add User' puis 'Live TV' pour accéder aux chaînes",
    ],
    tips: "Toutes les box Android (Mi Box, Nvidia Shield, Chromecast with Google TV) fonctionnent de la même manière.",
  },
  {
    id: "firestick",
    icon: FiBox,
    name: "Amazon Fire Stick",
    steps: [
      "Sur l'écran d'accueil, allez dans 'Rechercher' et tapez 'Downloader'",
      "Installez l'application 'Downloader'",
      "Dans Downloader, entrez l'URL de l'application IPTV Smarters Pro (bit.ly/iptvsmarters)",
      "Installez l'application APK",
      "Ouvrez IPTV Smarters et sélectionnez 'Login with Xtream Codes API'",
      "Entrez vos identifiants fournis par Ciné Kin Premium",
    ],
    tips: "Activez 'Apps from Unknown Sources' dans Settings > My Fire TV > Developer Options avant l'installation.",
  },
  {
    id: "iphone",
    icon: FiSmartphone,
    name: "iPhone / iPad",
    steps: [
      "Ouvrez l'App Store et recherchez 'IPTV Smarters Player'",
      "Installez l'application officielle",
      "Ouvrez l'app et acceptez les conditions d'utilisation",
      "Sélectionnez 'Xtream Codes API'",
      "Entrez vos identifiants (Username, Password, Server URL)",
      "Appuyez sur 'Add User' et accédez à vos chaînes, films et séries",
    ],
    tips: "L'application fonctionne aussi en mode paysage sur iPad pour un meilleur confort.",
  },
  {
    id: "androidphone",
    icon: FiSmartphone,
    name: "Android Phone",
    steps: [
      "Téléchargez IPTV Smarters Pro depuis le Google Play Store",
      "Ouvrez l'application après installation",
      "Choisissez 'Login with Xtream Codes API'",
      "Saisissez les identifiants envoyés par notre équipe",
      "Ajoutez l'utilisateur et profitez du contenu",
    ],
    tips: "Vous pouvez aussi utiliser VLC Media Player avec le lien M3U fourni.",
  },
  {
    id: "pc",
    icon: FiMonitor,
    name: "PC / Mac",
    steps: [
      "Téléchargez VLC Media Player (gratuit) depuis videolan.org",
      "Ouvrez VLC et allez dans 'Media' > 'Open Network Stream'",
      "Collez le lien M3U que nous vous avons fourni",
      "Cliquez sur 'Play' — la liste des chaînes se charge automatiquement",
      "Utilisez la playlist view pour naviguer entre les chaînes",
    ],
    tips: "Vous pouvez aussi utiliser l'application IPTV Smarters Pro disponible sur le Microsoft Store.",
  },
];

export default function Tutoriels() {
  const [openTutorial, setOpenTutorial] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#0a1628] pt-20">
      <SEO
        title="Guides d'Installation - Tous Appareils"
        description="Guides d'installation étape par étape pour Smart TV, Android TV, Fire Stick, iPhone, iPad, PC et Mac."
      />

      {/* Hero */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(90,107,78,0.06) 0%, transparent 50%)" }}
        />
        <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-8 text-center">
          <ScrollReveal>
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-white/[0.06] bg-white/[0.02] mb-8">
              <FiSettings className="w-4 h-4 text-[#6b7c5c]" />
              <span className="text-sm text-white/50">Guides d'installation</span>
            </div>
            <h1 className="font-display font-bold text-4xl sm:text-5xl text-white mb-5 tracking-[-0.02em]">
              Comment <span className="text-[#6b7c5c]">installer</span> IPTV
            </h1>
            <p className="text-white/60 text-lg max-w-2xl mx-auto font-light leading-relaxed">
              Suivez nos guides étape par étape pour installer et configurer votre abonnement IPTV sur n'importe quel appareil. L'installation prend moins de 5 minutes.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Prerequisites */}
      <section className="relative py-8 pb-16">
        <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-8">
          <ScrollReveal>
            <div className="border border-[#5a6b4e]/15 rounded-2xl p-6 sm:p-8 bg-[#5a6b4e]/5">
              <h2 className="font-display font-semibold text-xl text-white mb-5 flex items-center gap-3">
                <FiCheckCircle className="w-6 h-6 text-[#6b7c5c]" /> Avant de commencer
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { icon: FiWifi, text: "Connexion internet stable (min 10 Mbps)" },
                  { icon: FiDownload, text: "Vos identifiants reçus par WhatsApp" },
                  { icon: FiPlay, text: "L'application IPTV recommandée" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                    <item.icon className="w-5 h-5 text-[#6b7c5c] flex-shrink-0 mt-0.5" />
                    <span className="text-white/60 text-sm">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Tutorials Accordion */}
      <section className="relative py-8 pb-24">
        <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-8">
          <div className="space-y-4">
            {tutorials.map((tutorial) => (
              <div
                key={tutorial.id}
                className="border border-white/[0.06] rounded-2xl overflow-hidden bg-white/[0.02] hover:border-white/[0.10] transition-all duration-300"
              >
                <button
                  onClick={() => setOpenTutorial(openTutorial === tutorial.id ? null : tutorial.id)}
                  className="w-full flex items-center justify-between p-5 sm:p-6 text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#5a6b4e]/10 flex items-center justify-center flex-shrink-0">
                      <tutorial.icon className="w-6 h-6 text-[#6b7c5c]" />
                    </div>
                    <span className="font-display font-semibold text-lg text-white">{tutorial.name}</span>
                  </div>
                  {openTutorial === tutorial.id ? (
                    <FiChevronUp className="w-5 h-5 text-[#5a6b4e] flex-shrink-0" />
                  ) : (
                    <FiChevronDown className="w-5 h-5 text-white/55 flex-shrink-0" />
                  )}
                </button>

                <AnimatePresence>
                  {openTutorial === tutorial.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="px-5 sm:px-6 pb-6">
                        <div className="border-t border-white/[0.04] pt-5">
                          <ol className="space-y-4">
                            {tutorial.steps.map((step, i) => (
                              <motion.li
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.08 }}
                                className="flex items-start gap-4"
                              >
                                <span className="w-7 h-7 rounded-full bg-[#5a6b4e]/15 text-[#6b7c5c] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                                  {i + 1}
                                </span>
                                <span className="text-white/55 text-sm leading-relaxed">{step}</span>
                              </motion.li>
                            ))}
                          </ol>

                          <div className="mt-5 p-4 bg-[#5a6b4e]/8 rounded-xl border border-[#5a6b4e]/10">
                            <p className="text-[#6b7c5c]/80 text-sm">
                              <strong className="text-[#6b7c5c]">Astuce :</strong> {tutorial.tips}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Video placeholder */}
      <section className="relative py-16 pb-24 bg-[#111d32]/30">
        <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-8 text-center">
          <ScrollReveal>
            <h2 className="font-display font-bold text-3xl text-white mb-4">
              Besoin d'<span className="text-[#6b7c5c]">aide</span> ?
            </h2>
            <p className="text-white/60 text-lg mb-8 max-w-xl mx-auto font-light">
              Notre équipe de support est disponible 7j/7 pour vous accompagner dans l'installation.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="https://wa.me/243830240073"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 bg-[#5a6b4e] text-white font-semibold rounded-xl hover:bg-[#4d5d42] transition-all text-base"
              >
                Contacter le support
              </a>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
