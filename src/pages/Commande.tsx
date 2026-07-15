import { useState } from "react";
import SEO from "@/components/SEO";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { FiCheck, FiMessageCircle, FiSmartphone, FiMonitor, FiShield, FiArrowRight, FiZap } from "react-icons/fi";
import { CLIENT_PLANS, RESELLER_PLANS, SITE_CONFIG } from "@/data/siteData";
import ScrollReveal from "@/components/ScrollReveal";

export default function Commande() {
  const [searchParams] = useSearchParams();
  const [planType, setPlanType] = useState<"client" | "reseller">(
    (searchParams.get("type") as "client" | "reseller") || "client"
  );
  const [selectedPlan, setSelectedPlan] = useState(searchParams.get("plan") || "");
  const [formData, setFormData] = useState({ name: "", phone: "" });

  const plans = planType === "client" ? CLIENT_PLANS : RESELLER_PLANS;
  const selectedPlanData = plans.find(p => p.id === selectedPlan);

  const getWhatsAppLink = () => {
    const message = `Bonjour Ciné Kin Premium !\n\nJe souhaite commander :\n- Formule : ${selectedPlanData?.name}${planType === "client" ? ` (${(selectedPlanData as typeof CLIENT_PLANS[0])?.duration || ""})` : ""}\n- Type : ${planType}${formData.name ? `\n- Nom : ${formData.name}` : ""}${formData.phone ? `\n- WhatsApp : ${formData.phone}` : ""}\n\nMerci de me guider pour la suite.`;
    return `https://wa.me/${SITE_CONFIG.whatsappNumber.replace(/[+\s]/g, "")}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="min-h-screen bg-[#0a1628] pt-20">
      <SEO
        title="Commander - Abonnement IPTV Premium"
        description="Commandez votre abonnement IPTV en 1 clic via WhatsApp. Activation rapide, support 7j/7."
      />

      {/* Hero */}
      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(90,107,78,0.06) 0%, transparent 50%)" }}
        />
        <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-8 text-center">
          <ScrollReveal>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#5a6b4e]/15 bg-white/[0.02] mb-5">
              <FiZap className="w-4 h-4 text-[#6b7c5c]" />
              <span className="text-xs text-[#6b7c5c] font-medium tracking-wider uppercase">Commande rapide</span>
            </div>
            <h1 className="font-display font-bold text-4xl sm:text-5xl text-white mb-4 tracking-[-0.02em]">
              Commandez en <span className="text-[#6b7c5c]">1 clic</span>
            </h1>
            <p className="text-white/45 text-base font-light max-w-md mx-auto">
              Sélectionnez votre formule et envoyez-nous un message WhatsApp. Notre équipe vous répond sous 5 min.
            </p>
          </ScrollReveal>
        </div>
      </section>

      <section className="relative py-8 pb-24">
        <div className="relative z-10 max-w-3xl mx-auto px-6 sm:px-8">
          {/* Toggle */}
          <div className="flex justify-center mb-8">
                <div className="inline-flex bg-white/[0.03] rounded-full p-1 border border-white/[0.06]">
                  <button onClick={() => { setPlanType("client"); setSelectedPlan(""); }} className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all ${planType === "client" ? "bg-[#5a6b4e] text-white" : "text-white/45 hover:text-white/65"}`}>
                    Client
                  </button>
                  <button onClick={() => { setPlanType("reseller"); setSelectedPlan(""); }} className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all ${planType === "reseller" ? "bg-[#5a6b4e] text-white" : "text-white/45 hover:text-white/65"}`}>
                    Revendeur
                  </button>
                </div>
              </div>

              {/* Plans */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {plans.map((plan) => (
                  <button key={plan.id} onClick={() => setSelectedPlan(plan.id)}
                    className={`relative border rounded-xl p-5 text-left transition-all duration-300 bg-[#111d32]/30 ${
                      selectedPlan === plan.id ? "ring-2 ring-[#5a6b4e] border-[#5a6b4e]/30" : "border-white/[0.04] hover:border-white/[0.08]"
                    }`}>
                    {plan.popular && (
                      <div className="absolute -top-2.5 left-3 px-2.5 py-0.5 bg-[#5a6b4e] rounded-full text-[10px] font-bold text-white tracking-wider">POPULAIRE</div>
                    )}
                    <h3 className="font-display font-semibold text-base text-white mb-1">{plan.name}</h3>
                    {planType === "client" ? (
                      <div>
                        <div className="font-display font-bold text-2xl text-white">{(plan as typeof CLIENT_PLANS[0]).priceLabel}</div>
                        <div className="text-white/35 text-xs">{(plan as typeof CLIENT_PLANS[0]).duration}</div>
                      </div>
                    ) : (
                      <div>
                        <div className="font-display font-bold text-xl text-white">{(plan as typeof RESELLER_PLANS[0]).credits}</div>
                        <div className="text-[#6b7c5c]/70 text-xs font-medium">codes inclus</div>
                      </div>
                    )}
                    {selectedPlan === plan.id && (
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#5a6b4e] flex items-center justify-center">
                        <FiCheck className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Quick Info Form */}
              {selectedPlanData && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="border border-white/[0.06] rounded-xl p-6 mb-6 bg-white/[0.02]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="flex items-center gap-2 text-sm text-white/55 mb-2"><FiSmartphone className="w-4 h-4" /> Votre nom</label>
                      <input type="text" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white placeholder-white/25 focus:outline-none focus:border-[#5a6b4e]/40 transition-all text-sm"
                        placeholder="Prénom" />
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-sm text-white/55 mb-2"><FiSmartphone className="w-4 h-4" /> WhatsApp</label>
                      <input type="tel" value={formData.phone} onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white placeholder-white/25 focus:outline-none focus:border-[#5a6b4e]/40 transition-all text-sm"
                        placeholder="+243..." />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-[#5a6b4e]/5 rounded-lg mb-4">
                    <FiShield className="w-4 h-4 text-[#6b7c5c] flex-shrink-0" />
                    <span className="text-white/45 text-xs">Paiement sécurisé via WhatsApp. Aucune donnée bancaire requise.</span>
                  </div>

                  <a
                    href={getWhatsAppLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full py-4 text-base font-bold text-white bg-[#25D366] rounded-xl hover:bg-[#128C7E] transition-all text-center flex items-center justify-center gap-2"
                  >
                    <FiMessageCircle className="w-5 h-5" />
                    Commander sur WhatsApp
                    <FiArrowRight className="w-4 h-4" />
                  </a>
                </motion.div>
              )}

          {/* Trust badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
            {[
              { icon: FiCheck, text: "Activation < 5 min" },
              { icon: FiShield, text: "Satisfait ou remboursé" },
              { icon: FiMessageCircle, text: "Support 7j/7" },
              { icon: FiMonitor, text: "Tous appareils" },
            ].map((badge, i) => (
              <div key={i} className="flex items-center gap-2 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <badge.icon className="w-4 h-4 text-[#6b7c5c] flex-shrink-0" />
                <span className="text-white/50 text-xs">{badge.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
