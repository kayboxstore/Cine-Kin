import { useState } from "react";
import SEO from "@/components/SEO";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FiMail, FiPhone, FiMapPin, FiClock, FiSend, FiCheck, FiUser, FiMessageSquare } from "react-icons/fi";
import { SITE_CONFIG } from "@/data/siteData";
import ScrollReveal from "@/components/ScrollReveal";

export default function Contact() {
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Orders/leads go through WhatsApp only: forward the message there so it
    // is actually delivered instead of being silently dropped.
    const lines = [
      "Bonjour Ciné Kin Premium ! (via formulaire de contact)",
      formData.name && `Nom : ${formData.name}`,
      formData.email && `Email : ${formData.email}`,
      formData.subject && `Sujet : ${formData.subject}`,
      formData.message && `Message : ${formData.message}`,
    ].filter(Boolean);
    const url = `https://wa.me/${SITE_CONFIG.whatsappNumber.replace(/[+\s]/g, "")}?text=${encodeURIComponent(lines.join("\n"))}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setSubmitted(true);
  };

  return (


    <div>


      <SEO
        title="Contactez-nous - Ciné Kin Premium"
        description="Contactez l'équipe Ciné Kin Premium par WhatsApp ou email. Support disponible Lun-Dim 08h-23h."
      />
      {/* Hero */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(90,107,78,0.06) 0%, transparent 50%)" }}
        />
        <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8 text-center">
          <ScrollReveal>
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-white/[0.06] bg-white/[0.02] mb-8">
              <FiMail className="w-4 h-4 text-[#6b7c5c]" />
              <span className="text-sm text-white/50">Contactez-nous</span>
            </div>
            <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl text-white mb-5 tracking-[-0.02em]">
              Nous <span className="text-[#6b7c5c]">contacter</span>
            </h1>
            <p className="text-white/60 text-lg max-w-2xl mx-auto font-light">
              Notre équipe est à votre disposition pour répondre à toutes vos questions.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Contact Info + Form */}
      <section className="relative py-16 pb-24">
        <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Info */}
            <div className="lg:col-span-2 space-y-5">
              {[
                { icon: FiPhone, title: "WhatsApp", value: SITE_CONFIG.whatsappNumber, href: `https://wa.me/${SITE_CONFIG.whatsappNumber.replace(/[+\s]/g, "")}` },
                { icon: FiMail, title: "Email", value: SITE_CONFIG.email, href: `mailto:${SITE_CONFIG.email}` },
                { icon: FiClock, title: "Horaires", value: SITE_CONFIG.supportHours, href: null },
                { icon: FiMapPin, title: "Support", value: "Assistance technique disponible 7j/7", href: null },
              ].map((item, i) => (
                <div key={i} className="border border-white/[0.04] rounded-xl p-5 bg-[#111d32]/30 hover:border-white/[0.08] transition-all">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-[#5a6b4e]/10 flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-[#6b7c5c]" />
                    </div>
                    <h3 className="font-display font-semibold text-base text-white">{item.title}</h3>
                  </div>
                  {item.href ? (
                    <a href={item.href} target="_blank" rel="noopener noreferrer" className="text-white/50 text-base hover:text-[#6b7c5c] transition-colors ml-[52px]">
                      {item.value}
                    </a>
                  ) : (
                    <p className="text-white/50 text-base ml-[52px]">{item.value}</p>
                  )}
                </div>
              ))}

              <div className="border border-[#5a6b4e]/15 rounded-xl p-5 bg-[#5a6b4e]/5">
                <h3 className="font-display font-semibold text-base text-white mb-2">Temps de réponse</h3>
                <p className="text-white/60 text-base font-light">Nous répondons généralement en moins de 2 heures pendant les heures de support.</p>
              </div>
            </div>

            {/* Form */}
            <div className="lg:col-span-3">
              <div className="border border-white/[0.04] rounded-2xl p-6 sm:p-8 bg-[#111d32]/30">
                {!submitted ? (
                  <>
                    <h2 className="font-display font-semibold text-2xl text-white mb-6">Envoyez-nous un message</h2>
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div>
                        <label className="flex items-center gap-2 text-base text-white/55 mb-2"><FiUser className="w-4 h-4" /> Nom</label>
                        <input type="text" required value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-4 py-3.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white placeholder-white/25 focus:outline-none focus:border-[#5a6b4e]/40 transition-all text-base"
                          placeholder="Votre nom" />
                      </div>
                      <div>
                        <label className="flex items-center gap-2 text-base text-white/55 mb-2"><FiMail className="w-4 h-4" /> Email</label>
                        <input type="email" required value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full px-4 py-3.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white placeholder-white/25 focus:outline-none focus:border-[#5a6b4e]/40 transition-all text-base"
                          placeholder="votre@email.com" />
                      </div>
                      <div>
                        <label className="text-base text-white/55 mb-2 block">Sujet</label>
                        <select value={formData.subject} onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                          className="w-full px-4 py-3.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white focus:outline-none focus:border-[#5a6b4e]/40 transition-all appearance-none text-base">
                          <option value="" className="bg-[#0a1628]">Choisir un sujet</option>
                          <option value="technical" className="bg-[#0a1628]">Support technique</option>
                          <option value="billing" className="bg-[#0a1628]">Facturation</option>
                          <option value="reseller" className="bg-[#0a1628]">Programme revendeur</option>
                          <option value="other" className="bg-[#0a1628]">Autre</option>
                        </select>
                      </div>
                      <div>
                        <label className="flex items-center gap-2 text-base text-white/55 mb-2"><FiMessageSquare className="w-4 h-4" /> Message</label>
                        <textarea rows={5} required value={formData.message} onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                          className="w-full px-4 py-3.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white placeholder-white/25 focus:outline-none focus:border-[#5a6b4e]/40 transition-all resize-none text-base"
                          placeholder="Décrivez votre demande..." />
                      </div>
                      <button type="submit" className="w-full py-4 text-base font-semibold text-white bg-[#5a6b4e] rounded-xl hover:bg-[#4d5d42] transition-all flex items-center justify-center gap-2">
                        <FiSend className="w-5 h-5" /> Envoyer
                      </button>
                    </form>
                  </>
                ) : (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-[#5a6b4e]/10 flex items-center justify-center mx-auto mb-4">
                      <FiCheck className="w-8 h-8 text-[#6b7c5c]" />
                    </div>
                    <h3 className="font-display font-bold text-2xl text-white mb-2">Message envoyé !</h3>
                    <p className="text-white/50 text-base mb-6 font-light">Nous vous répondrons dans les plus brefs délais.</p>
                    <Link to="/" className="text-[#6b7c5c] hover:text-[#8aaf8a] transition-colors text-base">Retour à l'accueil</Link>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
