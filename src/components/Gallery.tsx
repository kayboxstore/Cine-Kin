import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiTv, FiFilm, FiMonitor, FiGrid } from "react-icons/fi";
import ScrollReveal from "./ScrollReveal";
import LazyImage from "./LazyImage";

const galleryItems = [
  {
    id: 1,
    title: "Guide Électronique des Programmes",
    description: "Consultez facilement les programmes de toutes vos chaînes avec notre EPG intuitif.",
    icon: FiTv,
    image: "/images/gallery-epg.jpg",
  },
  {
    id: 2,
    title: "Catalogue VOD Films & Séries",
    description: "Des milliers de films et séries disponibles à la demande, organisés par genre.",
    icon: FiFilm,
    image: "/images/gallery-vod.jpg",
  },
  {
    id: 3,
    title: "Multi-écrans simultanés",
    description: "Regardez sur jusqu'à 5 appareils en simultané avec un seul abonnement.",
    icon: FiMonitor,
    image: "/images/gallery-multi.jpg",
  },
  {
    id: 4,
    title: "Grille de chaînes complète",
    description: "15 000+ chaînes organisées par pays et catégorie pour un accès rapide.",
    icon: FiGrid,
    image: "/images/gallery-grid.jpg",
  },
];

export default function Gallery() {
  const [selected, setSelected] = useState<number | null>(null);

  const selectedItem = galleryItems.find((g) => g.id === selected);

  return (
    <section className="py-20 bg-[#0a1628]">
      <div className="max-w-6xl mx-auto px-6 sm:px-8">
        <ScrollReveal>
          <div className="text-center mb-12">
            <p className="text-[#6b7c5c]/50 text-xs font-medium tracking-[0.2em] uppercase mb-3">
              Interface
            </p>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-white mb-3">
              Découvrez <span className="text-[#6b7c5c]">l'expérience</span>
            </h2>
            <p className="text-white/45 text-base font-light max-w-lg mx-auto">
              Une interface moderne et intuitive pour accéder à tout votre contenu.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {galleryItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <ScrollReveal key={item.id} delay={i * 0.1}>
                <motion.div
                  whileHover={{ y: -4 }}
                  className="group relative border border-white/[0.06] rounded-2xl overflow-hidden cursor-pointer hover:border-[#5a6b4e]/20 transition-all bg-white/[0.02]"
                  onClick={() => setSelected(item.id)}
                >
                  <div className="aspect-video relative">
                    <LazyImage src={item.image} alt={item.title} className="w-full h-full" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628]/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-[#5a6b4e]/20 flex items-center justify-center">
                          <Icon className="w-4 h-4 text-[#6b7c5c]" />
                        </div>
                        <h3 className="font-display font-semibold text-white text-base group-hover:text-[#6b7c5c] transition-colors">
                          {item.title}
                        </h3>
                      </div>
                      <p className="text-white/50 text-sm font-light">{item.description}</p>
                    </div>
                  </div>
                </motion.div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selected !== null && selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[90] flex items-center justify-center p-4 sm:p-8"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-4xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelected(null)}
                className="absolute -top-10 right-0 w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.1] text-white/60 hover:text-white transition-all"
              >
                <FiX className="w-4 h-4" />
              </button>
              <div className="rounded-2xl overflow-hidden border border-white/[0.08]">
                <img
                  src={selectedItem.image}
                  alt={selectedItem.title}
                  className="w-full h-auto"
                />
              </div>
              <div className="mt-3 text-center">
                <h3 className="font-display font-semibold text-white text-lg">{selectedItem.title}</h3>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
