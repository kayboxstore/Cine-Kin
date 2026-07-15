import { useState } from "react";
import { FiUsers, FiCopy, FiCheck } from "react-icons/fi";
import ScrollReveal from "./ScrollReveal";

export default function ReferralSection() {
  const [copied, setCopied] = useState(false);
  const referralCode = "CK-FRIEND-2026";
  const referralLink = `https://cinekinpremium.com/?ref=${referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="py-20 bg-[#0a1628]">
      <div className="max-w-4xl mx-auto px-6 sm:px-8">
        <ScrollReveal>
          <div className="border border-[#5a6b4e]/15 rounded-2xl p-8 sm:p-12 text-center relative overflow-hidden bg-[#5a6b4e]/[0.03]">
            <div className="absolute top-0 right-0 w-48 h-48 pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(90,107,78,0.08) 0%, transparent 60%)" }}
            />

            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#5a6b4e]/15 bg-white/[0.02] mb-6">
              <FiUsers className="w-4 h-4 text-[#6b7c5c]" />
              <span className="text-xs text-[#6b7c5c] font-medium tracking-wider uppercase">Parrainage</span>
            </div>

            <h2 className="font-display font-bold text-3xl sm:text-4xl text-white mb-4">
              1 mois <span className="text-[#6b7c5c]">gratuit</span> par ami parrainé
            </h2>

            <p className="text-white/60 text-base font-light max-w-md mx-auto mb-8">
              Partagez votre lien avec vos amis. Pour chaque ami qui souscrit un abonnement, vous recevez 1 mois gratuit.
            </p>

            {/* Referral Link */}
            <div className="flex items-center gap-2 max-w-md mx-auto mb-8">
              <div className="flex-1 px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-left">
                <span className="text-white/60 text-xs">Votre lien de parrainage</span>
                <div className="text-white/60 text-sm truncate">{referralLink}</div>
              </div>
              <button
                onClick={handleCopy}
                className="px-4 py-3 bg-[#5a6b4e] text-white rounded-xl hover:bg-[#4d5d42] transition-all flex items-center gap-2 text-sm font-medium"
              >
                {copied ? <FiCheck className="w-4 h-4" /> : <FiCopy className="w-4 h-4" />}
                {copied ? "Copié" : "Copier"}
              </button>
            </div>

            {/* Steps */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
              {[
                { step: "1", text: "Partagez votre lien" },
                { step: "2", text: "Votre ami souscrit" },
                { step: "3", text: "Recevez 1 mois gratuit" },
              ].map((s, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-[#5a6b4e]/15 flex items-center justify-center text-[#6b7c5c] font-bold text-sm">
                    {s.step}
                  </div>
                  <span className="text-white/50 text-sm">{s.text}</span>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
