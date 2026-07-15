import { useState, useEffect } from "react";
import { FiStar, FiCheckCircle, FiUsers, FiTrendingUp } from "react-icons/fi";
import ScrollReveal from "./ScrollReveal";

export default function TrustBadgeReviews() {
  const [rating, setRating] = useState(0);
  const targetRating = 4.8;

  useEffect(() => {
    const timer = setTimeout(() => setRating(targetRating), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="py-16 bg-[#111d32]/30 border-y border-white/[0.03]">
      <div className="max-w-5xl mx-auto px-6 sm:px-8">
        <ScrollReveal>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Rating */}
            <div className="flex flex-col items-center text-center p-5 border border-white/[0.04] rounded-xl bg-white/[0.02]">
              <div className="flex items-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <FiStar
                    key={star}
                    className={`w-5 h-5 ${
                      star <= Math.floor(targetRating)
                        ? "text-yellow-400 fill-yellow-400"
                        : star <= targetRating
                        ? "text-yellow-400 fill-yellow-400/50"
                        : "text-white/10"
                    }`}
                  />
                ))}
              </div>
              <div className="font-display font-bold text-4xl text-white mb-1">
                {rating.toFixed(1)}
              </div>
              <p className="text-white/55 text-xs">Note moyenne sur 2 847 avis</p>
              <div className="flex items-center gap-1 mt-2 text-emerald-400 text-xs">
                <FiTrendingUp className="w-3 h-3" />
                <span>+0.3 ce mois</span>
              </div>
            </div>

            {/* Verified */}
            <div className="flex flex-col items-center text-center p-5 border border-white/[0.04] rounded-xl bg-white/[0.02]">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
                <FiCheckCircle className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="font-display font-bold text-2xl text-white mb-1">
                Avis vérifiés
              </div>
              <p className="text-white/55 text-xs max-w-[200px]">
                Tous nos avis sont authentiques, vérifiés après achat confirmé.
              </p>
              <div className="flex items-center gap-1 mt-2 text-white/20 text-xs">
                <FiCheckCircle className="w-3 h-3" />
                <span>Vérification active</span>
              </div>
            </div>

            {/* Customers */}
            <div className="flex flex-col items-center text-center p-5 border border-white/[0.04] rounded-xl bg-white/[0.02]">
              <div className="w-12 h-12 rounded-full bg-[#5a6b4e]/10 flex items-center justify-center mb-3">
                <FiUsers className="w-6 h-6 text-[#6b7c5c]" />
              </div>
              <div className="font-display font-bold text-3xl text-white mb-1">
                12 400+
              </div>
              <p className="text-white/55 text-xs">clients satisfaits</p>
              <div className="flex items-center gap-1 mt-2 text-emerald-400 text-xs">
                <FiTrendingUp className="w-3 h-3" />
                <span>+340 cette semaine</span>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
