import { FiShield, FiLock, FiHeadphones, FiRefreshCw, FiCheckCircle } from "react-icons/fi";
import ScrollReveal from "./ScrollReveal";
import { COMMERCIAL_INFO } from "@/data/commercial";

const badges = [
  { icon: FiShield, label: "Conditions claires", desc: "Avant paiement" },
  { icon: FiLock, label: "Aucune carte saisie", desc: "Sur ce site" },
  { icon: FiHeadphones, label: "Support 7j/7", desc: COMMERCIAL_INFO.support.hoursShort },
  { icon: FiRefreshCw, label: "Formules fixes", desc: "Prix affichés" },
  { icon: FiCheckCircle, label: "Activation", desc: "Après validation" },
];

export default function TrustBadges() {
  return (
    <section className="py-12 bg-[#111d32]/30 border-y border-white/[0.04]">
      <div className="max-w-6xl mx-auto px-6 sm:px-8">
        <ScrollReveal>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {badges.map((badge, i) => (
              <div
                key={i}
                className="flex flex-col items-center text-center p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-[#5a6b4e]/20 transition-all"
              >
                <badge.icon className="w-6 h-6 text-[#6b7c5c] mb-2" />
                <span className="text-white text-sm font-medium">{badge.label}</span>
                <span className="text-white/60 text-xs mt-0.5">{badge.desc}</span>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
