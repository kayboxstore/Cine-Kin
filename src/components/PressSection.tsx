import { FiExternalLink } from "react-icons/fi";
import ScrollReveal from "./ScrollReveal";

const pressItems = [
  {
    name: "TechAfrica",
    quote: "Le service IPTV le plus fiable du continent africain",
    date: "Juin 2026",
  },
  {
    name: "Digital Mag",
    quote: "Une qualité 4K impressionnante à prix accessible",
    date: "Mai 2026",
  },
  {
    name: "Stream Weekly",
    quote: "15 000 chaînes et zero buffering, un sans-faute",
    date: "Avril 2026",
  },
  {
    name: "IPTV Insider",
    quote: "Le meilleur rapport qualité-prix du marché en 2026",
    date: "Mars 2026",
  },
  {
    name: "TV France",
    quote: "L'alternative française au câble traditionnel",
    date: "Mars 2026",
  },
];

export default function PressSection() {
  return (
    <section className="py-16 bg-[#111d32]/30 border-y border-white/[0.03]">
      <div className="max-w-6xl mx-auto px-6 sm:px-8">
        <ScrollReveal>
          <div className="text-center mb-10">
            <p className="text-[#6b7c5c]/50 text-xs font-medium tracking-[0.2em] uppercase mb-3">
              Ils parlent de nous
            </p>
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-white">
              Vu dans la <span className="text-[#6b7c5c]">presse</span>
            </h2>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-6 mb-10">
            {pressItems.map((item, i) => (
              <div
                key={i}
                className="text-white/15 font-bold text-lg sm:text-xl tracking-tight hover:text-white/30 transition-colors cursor-default select-none"
              >
                {item.name}
              </div>
            ))}
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {pressItems.slice(0, 3).map((item, i) => (
            <ScrollReveal key={i} delay={i * 0.1}>
              <div className="border border-white/[0.04] rounded-xl p-5 hover:border-white/[0.08] transition-all bg-white/[0.01]">
                <div className="text-white/20 text-xs font-semibold tracking-wider uppercase mb-3">
                  {item.name}
                </div>
                <p className="text-white/50 text-sm font-light leading-relaxed italic mb-3">
                  "{item.quote}"
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-white/20 text-xs">{item.date}</span>
                  <FiExternalLink className="w-3 h-3 text-white/10" />
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
