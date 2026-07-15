import { useState } from "react";
import { FiMail, FiCheck, FiArrowRight } from "react-icons/fi";
import ScrollReveal from "./ScrollReveal";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubmitted(true);
      setEmail("");
    }
  };

  return (
    <section className="relative py-20 bg-[#111d32]/30">
      <div className="max-w-4xl mx-auto px-6 sm:px-8 text-center">
        <ScrollReveal>
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-white/[0.06] bg-white/[0.02] mb-6">
            <FiMail className="w-4 h-4 text-[#6b7c5c]" />
            <span className="text-sm text-white/50">Newsletter</span>
          </div>
          <h2 className="font-display font-bold text-3xl text-white mb-3">
            Restez <span className="text-[#6b7c5c]">informé</span>
          </h2>
          <p className="text-white/60 text-base mb-8 max-w-lg mx-auto font-light">
            Inscrivez-vous pour recevoir nos offres exclusives, les nouveautés chaînes et les promotions spéciales.
          </p>

          {submitted ? (
            <div className="flex items-center justify-center gap-2 text-[#6b7c5c]">
              <FiCheck className="w-5 h-5" />
              <span className="text-base font-medium">Merci pour votre inscription !</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                className="flex-1 px-4 py-3.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white placeholder-white/25 focus:outline-none focus:border-[#5a6b4e]/40 transition-all text-base"
              />
              <button
                type="submit"
                className="px-6 py-3.5 bg-[#5a6b4e] text-white font-semibold rounded-xl hover:bg-[#4d5d42] transition-all flex items-center justify-center gap-2 text-sm"
              >
                <FiArrowRight className="w-4 h-4" />
                S'inscrire
              </button>
            </form>
          )}

          <p className="text-white/55 text-xs mt-4">
            Aucun spam. Désinscription à tout moment.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
