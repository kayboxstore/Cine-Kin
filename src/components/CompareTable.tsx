import { Link } from "react-router-dom";
import { FiCheck, FiX, FiArrowRight } from "react-icons/fi";
import ScrollReveal from "./ScrollReveal";

const plans = [
  { name: "Essai 24h", price: "Gratuit", period: "24h", color: "text-white/50" },
  { name: "1 Mois", price: "$9.99", period: "/mois", color: "text-white", popular: false },
  { name: "3 Mois", price: "$24.99", period: "/3mois", color: "text-white", popular: true },
  { name: "6 Mois", price: "$44.99", period: "/6mois", color: "text-white", popular: false },
  { name: "12 Mois", price: "$69.99", period: "/an", color: "text-[#6b7c5c]", popular: false },
  { name: "24 Mois", price: "$119.99", period: "/2ans", color: "text-[#6b7c5c]", popular: false },
];

const features = [
  { label: "15 000+ chaînes", trial: true, all: true },
  { label: "Films & Séries VOD", trial: true, all: true },
  { label: "Qualité 4K UHD", trial: true, all: true },
  { label: "Guide EPG", trial: true, all: true },
  { label: "Catch-up TV", trial: false, all: true },
  { label: "Multi-appareils", trial: false, all: true },
  { label: "Support 7j/7", trial: true, all: true },
  { label: "Mise à jour auto", trial: false, all: true },
  { label: "Sans engagement", trial: true, all: true },
];

export default function CompareTable() {
  return (
    <section className="py-20">
      <div className="max-w-6xl mx-auto px-6 sm:px-8">
        <ScrollReveal>
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-white mb-3">
              Comparez nos <span className="text-[#6b7c5c]">offres</span>
            </h2>
            <p className="text-white/60 text-base max-w-lg mx-auto font-light">
              Toutes nos formules incluent l'accès complet au catalogue. Choisissez simplement la durée qui vous convient.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <div className="border border-white/[0.06] rounded-2xl overflow-hidden bg-white/[0.02]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left text-white/60 text-xs font-medium px-5 py-4 w-48">Fonctionnalité</th>
                    {plans.map((plan) => (
                      <th key={plan.name} className="text-center px-3 py-4 relative">
                        {plan.popular && (
                          <span className="absolute -top-0 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-[#5a6b4e] text-white text-[9px] font-bold rounded-b-md">
                            POPULAIRE
                          </span>
                        )}
                        <div className={`font-display font-bold text-base ${plan.color}`}>{plan.price}</div>
                        <div className="text-white/55 text-xs">{plan.period}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {features.map((feature, i) => (
                    <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.01] transition-colors">
                      <td className="text-white/60 text-sm px-5 py-3.5">{feature.label}</td>
                      <td className="text-center px-3 py-3.5">
                        {feature.trial ? (
                          <FiCheck className="w-4 h-4 text-[#6b7c5c] mx-auto" />
                        ) : (
                          <FiX className="w-4 h-4 text-white/15 mx-auto" />
                        )}
                      </td>
                      {plans.slice(1).map((_, j) => (
                        <td key={j} className="text-center px-3 py-3.5">
                          {feature.all ? (
                            <FiCheck className="w-4 h-4 text-[#6b7c5c] mx-auto" />
                          ) : (
                            <FiX className="w-4 h-4 text-white/15 mx-auto" />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* CTA */}
            <div className="p-6 border-t border-white/[0.06] text-center">
              <Link
                to="/offres"
                className="inline-flex items-center gap-2 px-8 py-4 bg-[#5a6b4e] text-white font-semibold rounded-xl hover:bg-[#4d5d42] transition-all text-sm"
              >
                Voir les offres détaillées <FiArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
