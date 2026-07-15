import { FiShield, FiLock, FiHeadphones, FiRefreshCw, FiCheckCircle, FiStar } from "react-icons/fi";
import ScrollReveal from "./ScrollReveal";

const badges = [
  { icon: FiShield, label: "Satisfait ou remboursé", desc: "30 jours" },
  { icon: FiLock, label: "Paiement sécurisé", desc: "SSL 256-bit" },
  { icon: FiHeadphones, label: "Support 7j/7", desc: "08h - 23h" },
  { icon: FiRefreshCw, label: "Mise à jour", desc: "Automatique" },
  { icon: FiCheckCircle, label: "Activation", desc: "< 5 minutes" },
  { icon: FiStar, label: "Note clients", desc: "4.8 / 5" },
];

export default function TrustBadges() {
  return (
    <section className="py-12 bg-[#111d32]/30 border-y border-white/[0.04]">
      <div className="max-w-6xl mx-auto px-6 sm:px-8">
        <ScrollReveal>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
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
