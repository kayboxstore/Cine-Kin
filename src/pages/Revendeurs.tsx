import { useState } from "react";
import SEO from "@/components/SEO";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiCheck, FiTrendingUp, FiZap, FiBarChart2, FiHeadphones,
  FiPackage, FiChevronDown, FiChevronUp, FiArrowRight, FiSend,
  FiUser, FiMail, FiPhone, FiMessageSquare
} from "react-icons/fi";
import { RESELLER_PLANS, RESELLER_FAQ, SITE_CONFIG } from "@/data/siteData";
import ScrollReveal from "@/components/ScrollReveal";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" as const },
  }),
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const advantages = [
  { icon: FiTrendingUp, title: "Marge attractive", desc: "Plus de 150% de marge sur chaque vente. Plus vous vendez, plus vous gagnez." },
  { icon: FiZap, title: "Activation rapide", desc: "Créez des comptes clients en temps réel via votre panneau d'administration dédié." },
  { icon: FiBarChart2, title: "Tableau de bord", desc: "Suivez vos ventes, codes restants et performances en temps réel." },
  { icon: FiHeadphones, title: "Support dédié", desc: "Bénéficiez d'un support prioritaire et d'une formation complète." },
  { icon: FiPackage, title: "Packs flexibles", desc: "Choisissez le pack qui correspond à votre ambition et évoluez à votre rythme." },
];

export default function Revendeurs() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", pack: "", message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Leads go through WhatsApp only: forward the request there so it is
    // actually delivered instead of being silently dropped.
    const lines = [
      "Bonjour Ciné Kin Premium ! (demande revendeur)",
      formData.name && `Nom : ${formData.name}`,
      formData.email && `Email : ${formData.email}`,
      formData.phone && `Téléphone : ${formData.phone}`,
      formData.pack && `Pack souhaité : ${formData.pack}`,
      formData.message && `Message : ${formData.message}`,
    ].filter(Boolean);
    const url = `https://wa.me/${SITE_CONFIG.whatsappNumber.replace(/[+\s]/g, "")}?text=${encodeURIComponent(lines.join("\n"))}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setSubmitted(true);
  };

  return (


    <div>


      <SEO
        title="Devenez Revendeur IPTV - Marge 150%+"
        description="Lancez votre business IPTV avec Ciné Kin Premium. Packs revendeur de 20 à 500 codes. Panneau d'administration dédié."
      />
      {/* Hero */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0">
          <img src="/images/reseller-hero.jpg" alt="" className="w-full h-full object-cover opacity-15" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a1628]/80 via-[#0a1628]/60 to-[#0a1628]" />
        </div>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(90,107,78,0.08) 0%, transparent 50%)" }}
        />

        <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8 text-center">
          <ScrollReveal>
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-white/[0.06] bg-white/[0.02] mb-8">
              <FiTrendingUp className="w-4 h-4 text-[#6b7c5c]" />
              <span className="text-sm text-white/50">Programme revendeur exclusif</span>
            </div>
            <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl text-white mb-5 tracking-[-0.02em]">
              Devenez <span className="text-[#6b7c5c]">revendeur</span>
            </h1>
            <p className="text-white/60 text-lg max-w-2xl mx-auto font-light">
              Lancez votre propre business IPTV avec des marges de plus de 150%. Un programme complet pour les entrepreneurs ambitieux.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Why become reseller */}
      <section className="relative py-24 bg-[#111d32]/30">
        <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8">
          <ScrollReveal className="text-center mb-16">
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-white mb-4 tracking-[-0.02em]">
              Pourquoi devenir <span className="text-[#6b7c5c]">revendeur</span> ?
            </h2>
            <p className="text-white/60 text-lg max-w-2xl mx-auto font-light">
              Rejoignez un réseau de plus de 1000 revendeurs actifs et bénéficiez d'avantages exclusifs.
            </p>
          </ScrollReveal>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {advantages.map((adv, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                custom={i}
                className="border border-white/[0.04] rounded-2xl p-6 bg-[#0a1628]/50 hover:border-white/[0.08] transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-[#5a6b4e]/10 flex items-center justify-center mb-4">
                  <adv.icon className="w-6 h-6 text-[#6b7c5c]" />
                </div>
                <h3 className="font-display font-semibold text-lg text-white mb-2">{adv.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed font-light">{adv.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Packs */}
      <section className="relative py-24">
        <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8">
          <ScrollReveal className="text-center mb-16">
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-white mb-4 tracking-[-0.02em]">
              Nos packs <span className="text-[#6b7c5c]">revendeur</span>
            </h2>
            <p className="text-white/60 text-lg max-w-2xl mx-auto font-light">
              Choisissez le pack adapté à votre ambition.
            </p>
          </ScrollReveal>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5"
          >
            {RESELLER_PLANS.map((plan, i) => (
              <motion.div
                key={plan.id}
                variants={fadeInUp}
                custom={i}
                className={`relative border rounded-2xl p-6 bg-[#111d32]/40 ${
                  plan.popular ? "border-[#5a6b4e]/20 lg:scale-105" : "border-white/[0.04] hover:border-white/[0.08]"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#5a6b4e] rounded-full text-xs font-bold text-white tracking-wide">
                    Recommandé
                  </div>
                )}

                <div className="text-center mb-6 pt-2">
                  <h3 className="font-display font-semibold text-xl text-white mb-2">{plan.name}</h3>
                  <div className="text-[#6b7c5c]/70 text-sm font-medium tracking-wide">{plan.margin} de marge</div>
                </div>

                <div className="text-center py-3 mb-6 bg-white/[0.03] rounded-xl">
                  <div className="font-display font-bold text-2xl text-white">{plan.credits}</div>
                  <div className="text-white/60 text-sm">codes inclus</div>
                </div>

                <ul className="space-y-3 mb-7">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-2.5 text-sm text-white/50">
                      <FiCheck className="w-4 h-4 text-[#5a6b4e] flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => {
                    setFormData(prev => ({ ...prev, pack: plan.id }));
                    document.getElementById("devis-form")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className={`block w-full py-4 text-center text-sm font-bold rounded-xl transition-all duration-300 tracking-wide ${
                    plan.popular
                      ? "bg-[#5a6b4e] text-white hover:bg-[#4d5d42]"
                      : "bg-white/[0.05] text-white/70 hover:bg-white/[0.10] border border-white/[0.08]"
                  }`}
                >
                  Demander ce pack
                </button>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative py-24 bg-[#111d32]/30">
        <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-8">
          <ScrollReveal className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl text-white mb-4 tracking-[-0.02em]">
              FAQ <span className="text-[#6b7c5c]">Revendeur</span>
            </h2>
          </ScrollReveal>

          <div className="space-y-3">
            {RESELLER_FAQ.map((item, i) => (
              <div key={i} className="border border-white/[0.03] rounded-xl overflow-hidden bg-[#0a1628]/50">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="font-display font-medium text-white/65 text-base pr-4">{item.question}</span>
                  {openFaq === i ? (
                    <FiChevronUp className="w-5 h-5 text-[#5a6b4e] flex-shrink-0" />
                  ) : (
                    <FiChevronDown className="w-5 h-5 text-white/55 flex-shrink-0" />
                  )}
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="px-5 pb-5"
                    >
                      <p className="text-white/60 text-sm leading-relaxed font-light">{item.answer}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Formulaire de demande */}
      <section id="devis-form" className="relative py-24">
        <div className="relative z-10 max-w-2xl mx-auto px-6 sm:px-8">
          <ScrollReveal>
            <div className="border border-white/[0.04] rounded-2xl p-8 sm:p-10 bg-[#111d32]/30">
              {!submitted ? (
                <>
                  <div className="text-center mb-8">
                    <h2 className="font-display font-bold text-2xl sm:text-3xl text-white mb-2 tracking-[-0.02em]">
                      Demander un <span className="text-[#6b7c5c]">pack revendeur</span>
                    </h2>
                    <p className="text-white/60 text-base font-light">
                      Remplissez le formulaire ci-dessous. Notre équipe vous contactera rapidement.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label className="flex items-center gap-2 text-sm text-white/55 mb-2">
                        <FiUser className="w-4 h-4" /> Nom complet
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-4 py-3.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white placeholder-white/25 focus:outline-none focus:border-[#5a6b4e]/40 transition-all text-base"
                        placeholder="Votre nom"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="flex items-center gap-2 text-sm text-white/55 mb-2">
                          <FiMail className="w-4 h-4" /> Email
                        </label>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full px-4 py-3.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white placeholder-white/25 focus:outline-none focus:border-[#5a6b4e]/40 transition-all text-base"
                          placeholder="votre@email.com"
                        />
                      </div>
                      <div>
                        <label className="flex items-center gap-2 text-sm text-white/55 mb-2">
                          <FiPhone className="w-4 h-4" /> WhatsApp
                        </label>
                        <input
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                          className="w-full px-4 py-3.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white placeholder-white/25 focus:outline-none focus:border-[#5a6b4e]/40 transition-all text-base"
                          placeholder="+243..."
                        />
                      </div>
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-sm text-white/55 mb-2">
                        <FiPackage className="w-4 h-4" /> Pack souhaité
                      </label>
                      <select
                        value={formData.pack}
                        onChange={(e) => setFormData(prev => ({ ...prev, pack: e.target.value }))}
                        className="w-full px-4 py-3.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white focus:outline-none focus:border-[#5a6b4e]/40 transition-all appearance-none text-base"
                      >
                        <option value="" className="bg-[#0a1628]">Choisir un pack</option>
                        {RESELLER_PLANS.map(plan => (
                          <option key={plan.id} value={plan.id} className="bg-[#0a1628]">
                            {plan.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-sm text-white/55 mb-2">
                        <FiMessageSquare className="w-4 h-4" /> Message (optionnel)
                      </label>
                      <textarea
                        rows={4}
                        value={formData.message}
                        onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                        className="w-full px-4 py-3.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white placeholder-white/25 focus:outline-none focus:border-[#5a6b4e]/40 transition-all resize-none text-base"
                        placeholder="Dites-nous en plus sur votre projet..."
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-4 text-base font-semibold text-white bg-[#5a6b4e] rounded-xl hover:bg-[#4d5d42] transition-all duration-300 flex items-center justify-center gap-2 tracking-wide"
                    >
                      <FiSend className="w-5 h-5" />
                      Envoyer ma demande
                    </button>
                  </form>
                </>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <div className="w-16 h-16 rounded-full bg-[#5a6b4e]/10 flex items-center justify-center mx-auto mb-4">
                    <FiCheck className="w-8 h-8 text-[#6b7c5c]" />
                  </div>
                  <h3 className="font-display font-bold text-2xl text-white mb-2">Demande envoyée !</h3>
                  <p className="text-white/50 text-base mb-6 font-light">
                    L'équipe {SITE_CONFIG.name} vous contactera rapidement pour finaliser votre inscription.
                  </p>
                  <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-[#6b7c5c] hover:text-[#8aaf8a] transition-colors"
                  >
                    Retour à l'accueil
                    <FiArrowRight className="w-4 h-4" />
                  </Link>
                </motion.div>
              )}
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
