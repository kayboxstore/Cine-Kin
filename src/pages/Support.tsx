import { useState } from "react";
import SEO from "@/components/SEO";
import { motion } from "framer-motion";
import {
  FiHeadphones, FiMessageCircle, FiMail, FiClock, FiChevronDown, FiChevronUp,
  FiMonitor, FiCheck, FiAlertTriangle
} from "react-icons/fi";
import { FAQ, INSTALL_GUIDES, COMMON_ISSUES, SITE_CONFIG } from "@/data/siteData";
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

export default function Support() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [openGuide, setOpenGuide] = useState<number | null>(0);
  const [openIssue, setOpenIssue] = useState<number | null>(null);

  return (


    <div>


      <SEO
        title="Centre de Support - Aide IPTV"
        description="FAQ, guides d'installation et assistance technique pour votre abonnement IPTV Ciné Kin Premium."
      />
      {/* Hero */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(90,107,78,0.06) 0%, transparent 50%)" }}
        />
        <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8 text-center">
          <ScrollReveal>
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-white/[0.06] bg-white/[0.02] mb-8">
              <FiHeadphones className="w-4 h-4 text-[#6b7c5c]" />
              <span className="text-sm text-white/50">Nous sommes là pour vous aider</span>
            </div>
            <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl text-white mb-5 tracking-[-0.02em]">
              Centre de <span className="text-[#6b7c5c]">support</span>
            </h1>
            <p className="text-white/60 text-lg max-w-2xl mx-auto font-light">
              Trouvez des réponses à vos questions ou contactez notre équipe.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Contact Cards */}
      <section className="relative py-16 bg-[#111d32]/30">
        <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 sm:grid-cols-3 gap-5"
          >
            {[
              { icon: FiMessageCircle, title: "WhatsApp", value: SITE_CONFIG.whatsappNumber, action: `https://wa.me/${SITE_CONFIG.whatsappNumber.replace(/[+\s]/g, "")}` },
              { icon: FiMail, title: "Email", value: SITE_CONFIG.email, action: `mailto:${SITE_CONFIG.email}` },
              { icon: FiClock, title: "Horaires", value: SITE_CONFIG.supportHours, action: null },
            ].map((contact, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                custom={i}
                className="border border-white/[0.04] rounded-2xl p-6 text-center bg-[#0a1628]/50 hover:border-white/[0.08] transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-[#5a6b4e]/10 flex items-center justify-center mx-auto mb-4">
                  <contact.icon className="w-6 h-6 text-[#6b7c5c]" />
                </div>
                <h3 className="font-display font-semibold text-lg text-white mb-1">{contact.title}</h3>
                <p className="text-white/60 text-base mb-3">{contact.value}</p>
                {contact.action && (
                  <a
                    href={contact.action}
                    target={contact.action.startsWith("http") ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-base text-[#6b7c5c] hover:text-[#8aaf8a] transition-colors"
                  >
                    Contacter
                  </a>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="relative py-20">
        <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-8">
          <ScrollReveal className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-white mb-4 tracking-[-0.02em]">
              Questions <span className="text-[#6b7c5c]">fréquentes</span>
            </h2>
          </ScrollReveal>

          <div className="space-y-3">
            {FAQ.map((item, i) => (
              <div key={i} className="border border-white/[0.03] rounded-xl overflow-hidden bg-[#111d32]/30">
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
                {openFaq === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="px-5 pb-5"
                  >
                    <p className="text-white/50 text-base leading-relaxed font-light">{item.answer}</p>
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Installation Guides */}
      <section id="guides" className="relative py-20 bg-[#111d32]/30">
        <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-8">
          <ScrollReveal className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-white mb-4 tracking-[-0.02em]">
              Guides d'<span className="text-[#6b7c5c]">installation</span>
            </h2>
            <p className="text-white/60 text-base font-light">Suivez les étapes selon votre appareil.</p>
          </ScrollReveal>

          <div className="space-y-4">
            {INSTALL_GUIDES.map((guide, i) => (
              <div key={i} className="border border-white/[0.03] rounded-xl overflow-hidden bg-[#0a1628]/50">
                <button
                  onClick={() => setOpenGuide(openGuide === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#5a6b4e]/10 flex items-center justify-center">
                      <FiMonitor className="w-5 h-5 text-[#6b7c5c]" />
                    </div>
                    <span className="font-display font-medium text-base text-white">{guide.device}</span>
                  </div>
                  {openGuide === i ? (
                    <FiChevronUp className="w-5 h-5 text-[#5a6b4e] flex-shrink-0" />
                  ) : (
                    <FiChevronDown className="w-5 h-5 text-white/55 flex-shrink-0" />
                  )}
                </button>
                {openGuide === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="px-5 pb-5"
                  >
                    <ol className="space-y-3 ml-4">
                      {guide.steps.map((step, j) => (
                        <li key={j} className="flex items-start gap-3 text-base text-white/50">
                          <span className="w-6 h-6 rounded-full bg-[#5a6b4e]/10 flex items-center justify-center flex-shrink-0 text-xs text-[#6b7c5c] font-medium">
                            {j + 1}
                          </span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Common Issues */}
      <section className="relative py-20 pb-24">
        <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-8">
          <ScrollReveal className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-white mb-4 tracking-[-0.02em]">
              Problèmes <span className="text-[#6b7c5c]">fréquents</span>
            </h2>
            <p className="text-white/60 text-base font-light">Solutions aux problèmes les plus courants.</p>
          </ScrollReveal>

          <div className="space-y-3">
            {COMMON_ISSUES.map((issue, i) => (
              <div key={i} className="border border-white/[0.03] rounded-xl overflow-hidden bg-[#111d32]/30">
                <button
                  onClick={() => setOpenIssue(openIssue === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#5a6b4e]/10 flex items-center justify-center">
                      <FiAlertTriangle className="w-5 h-5 text-[#7a8f6a]" />
                    </div>
                    <span className="font-display font-medium text-base text-white">{issue.problem}</span>
                  </div>
                  {openIssue === i ? (
                    <FiChevronUp className="w-5 h-5 text-[#5a6b4e] flex-shrink-0" />
                  ) : (
                    <FiChevronDown className="w-5 h-5 text-white/55 flex-shrink-0" />
                  )}
                </button>
                {openIssue === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="px-5 pb-5"
                  >
                    <div className="flex items-start gap-2">
                      <FiCheck className="w-4 h-4 text-[#6b7c5c] flex-shrink-0 mt-0.5" />
                      <p className="text-white/50 text-base leading-relaxed font-light">{issue.solution}</p>
                    </div>
                  </motion.div>
                )}
              </div>
            ))}
          </div>

          {/* Contact CTA */}
          <ScrollReveal>
            <div className="mt-12 text-center border border-white/[0.04] rounded-2xl p-8 bg-[#0a1628]/50">
              <h3 className="font-display font-semibold text-xl text-white mb-2">
                Toujours besoin d'aide ?
              </h3>
              <p className="text-white/60 text-base mb-6 font-light">
                Notre équipe est disponible {SITE_CONFIG.supportHours.toLowerCase()} pour vous assister.
              </p>
              <a
                href={`https://wa.me/${SITE_CONFIG.whatsappNumber.replace(/[+\s]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-white bg-[#5a6b4e] rounded-xl hover:bg-[#4d5d42] transition-all shadow-lg shadow-[#5a6b4e]/15"
              >
                <FiMessageCircle className="w-5 h-5" />
                Contacter le support
              </a>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
