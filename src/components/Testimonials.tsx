import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiStar, FiChevronLeft, FiChevronRight, FiMessageSquare } from "react-icons/fi";
import ScrollReveal from "./ScrollReveal";

const testimonials = [
  {
    name: "Jean-Pierre M.",
    location: "Kinshasa",
    avatar: "JP",
    rating: 5,
    text: "Service impeccable ! J'ai accès à toutes les chaînes françaises et sportives. La qualité 4K est bluffante. Je recommande à 100%.",
    plan: "12 Mois",
  },
  {
    name: "Marie-Claire K.",
    location: "Lubumbashi",
    avatar: "MC",
    rating: 5,
    text: "L'installation a pris 3 minutes sur ma Smart TV. Le support WhatsApp est ultra réactif. Mes enfants adorent les chaînes de dessins animés !",
    plan: "6 Mois",
  },
  {
    name: "Patrick N.",
    location: "Brazzaville",
    avatar: "PN",
    rating: 5,
    text: "Revendeur depuis 6 mois, j'ai déjà plus de 50 clients satisfaits. Les marges sont excellentes et le panneau d'admin est très pratique.",
    plan: "Pack Business",
  },
  {
    name: "Sophie B.",
    location: "Goma",
    avatar: "SB",
    rating: 4,
    text: "J'ai testé l'essai gratuit de 24h et j'ai immédiatement pris l'abonnement 3 mois. La stabilité est impressionnante, aucun lag.",
    plan: "3 Mois",
  },
  {
    name: "David T.",
    location: "Matadi",
    avatar: "DT",
    rating: 5,
    text: "Le meilleur IPTV que j'ai essayé. La VOD avec les films récents est un vrai plus. Mon Fire Stick fonctionne parfaitement avec le service.",
    plan: "24 Mois",
  },
];

export default function Testimonials() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1);
      setCurrent((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const prev = () => {
    setDirection(-1);
    setCurrent((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const next = () => {
    setDirection(1);
    setCurrent((prev) => (prev + 1) % testimonials.length);
  };

  const t = testimonials[current];

  return (
    <section className="py-20 overflow-hidden">
      <div className="max-w-4xl mx-auto px-6 sm:px-8">
        <ScrollReveal>
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-white/[0.06] bg-white/[0.02] mb-6">
              <FiMessageSquare className="w-4 h-4 text-[#6b7c5c]" />
              <span className="text-sm text-white/50">Témoignages clients</span>
            </div>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-white">
              Ils nous <span className="text-[#6b7c5c]">font confiance</span>
            </h2>
          </div>
        </ScrollReveal>

        <div className="relative">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={current}
              custom={direction}
              initial={{ opacity: 0, x: direction * 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -50 }}
              transition={{ duration: 0.4 }}
              className="border border-white/[0.06] rounded-2xl p-8 sm:p-10 bg-white/[0.02] text-center"
            >
              {/* Stars */}
              <div className="flex items-center justify-center gap-1 mb-6">
                {Array.from({ length: 5 }).map((_, i) => (
                  <FiStar
                    key={i}
                    className={`w-5 h-5 ${i < t.rating ? "text-amber-400 fill-amber-400" : "text-white/10"}`}
                  />
                ))}
              </div>

              {/* Quote */}
              <p className="text-white/60 text-lg sm:text-xl font-light leading-relaxed mb-8 max-w-2xl mx-auto">
                "{t.text}"
              </p>

              {/* Author */}
              <div className="flex items-center justify-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#5a6b4e]/15 flex items-center justify-center text-[#6b7c5c] font-semibold text-sm">
                  {t.avatar}
                </div>
                <div className="text-left">
                  <div className="text-white font-medium text-sm">{t.name}</div>
                  <div className="text-white/40 text-xs">
                    {t.location} — {t.plan}
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={prev}
              className="w-10 h-10 rounded-full bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.08] transition-all"
            >
              <FiChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setDirection(i > current ? 1 : -1);
                    setCurrent(i);
                  }}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === current ? "bg-[#5a6b4e] w-6" : "bg-white/15 hover:bg-white/25"
                  }`}
                />
              ))}
            </div>
            <button
              onClick={next}
              className="w-10 h-10 rounded-full bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.08] transition-all"
            >
              <FiChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
