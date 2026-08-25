import { useState } from "react";
import { motion } from "framer-motion";
import { FiDollarSign } from "react-icons/fi";
import ScrollReveal from "./ScrollReveal";

export default function SavingsCalculator() {
  const [monthlyBudget, setMonthlyBudget] = useState("");
  const cineKinYearly = 70;
  const parsedBudget = Number(monthlyBudget);
  const hasValidBudget =
    monthlyBudget.trim() !== "" &&
    Number.isFinite(parsedBudget) &&
    parsedBudget >= 0 &&
    parsedBudget <= 1000;
  const currentMonthly = hasValidBudget ? parsedBudget : 0;
  const currentYearly = currentMonthly * 12;
  const annualDifference = currentYearly - cineKinYearly;
  const absoluteDifference = Math.abs(annualDifference);

  return (
    <section className="py-20 bg-[#111d32]/50">
      <div className="max-w-4xl mx-auto px-6 sm:px-8">
        <ScrollReveal>
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#5a6b4e]/15 bg-white/[0.02] mb-5">
              <FiDollarSign className="w-4 h-4 text-[#6b7c5c]" />
              <span className="text-xs text-[#6b7c5c] font-medium tracking-wider uppercase">
                Calculateur
              </span>
            </div>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-white mb-3">
              Comparez votre <span className="text-[#6b7c5c]">budget</span>
            </h2>
            <p className="text-white/60 text-base font-light max-w-lg mx-auto">
              Indiquez ce que vous payez réellement aujourd’hui pour obtenir une
              comparaison annuelle simple.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <div className="border border-white/[0.06] rounded-2xl p-6 sm:p-8 bg-white/[0.02]">
            <div className="mb-8 max-w-md mx-auto">
              <label
                htmlFor="current-monthly-budget"
                className="mb-2 block text-sm font-medium text-white/75"
              >
                Votre budget mensuel actuel (USD)
              </label>
              <div className="flex items-center rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 focus-within:border-[#6b7c5c]">
                <span className="text-white/55" aria-hidden="true">
                  $
                </span>
                <input
                  id="current-monthly-budget"
                  type="number"
                  min="0"
                  max="1000"
                  step="1"
                  inputMode="decimal"
                  value={monthlyBudget}
                  onChange={event => setMonthlyBudget(event.target.value)}
                  placeholder="Ex. 60"
                  aria-describedby="budget-comparison-note"
                  className="w-full bg-transparent px-3 py-4 text-lg text-white outline-none"
                />
                <span className="text-sm text-white/55">/mois</span>
              </div>
              <p
                id="budget-comparison-note"
                className="mt-2 text-xs leading-relaxed text-white/55"
              >
                Utilisez le montant total figurant sur vos propres factures ;
                aucun tarif tiers n’est présumé.
              </p>
            </div>

            {/* Result */}
            <div className="border-t border-white/[0.06] pt-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                  <div className="text-white/55 text-xs mb-1">
                    Votre budget déclaré
                  </div>
                  <div className="font-display font-bold text-2xl text-white/60">
                    {hasValidBudget ? `$${currentYearly.toFixed(0)}/an` : "—"}
                  </div>
                </div>

                <span
                  className="hidden text-xl text-[#6b7c5c] sm:block"
                  aria-hidden="true"
                >
                  →
                </span>

                <div className="text-center sm:text-left">
                  <div className="text-[#6b7c5c] text-xs mb-1">
                    Ciné Kin Premium 12 mois
                  </div>
                  <div className="font-display font-bold text-2xl text-white">
                    ${cineKinYearly}/an
                  </div>
                </div>

                <div className="h-px w-full sm:w-px sm:h-12 bg-white/[0.06]" />

                <motion.div
                  className="text-center"
                  key={`${hasValidBudget}-${annualDifference}`}
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                >
                  <div className="text-[#6b7c5c] text-xs mb-1">
                    Différence annuelle estimée
                  </div>
                  <div className="font-display font-bold text-3xl text-[#6b7c5c]">
                    {hasValidBudget
                      ? `$${absoluteDifference.toFixed(0)}/an`
                      : "—"}
                  </div>
                  <div className="text-white/55 text-xs">
                    {!hasValidBudget
                      ? "Saisissez un montant pour comparer"
                      : annualDifference > 0
                        ? "Ciné Kin affiche un prix inférieur de ce montant"
                        : annualDifference < 0
                          ? "Votre budget déclaré est inférieur de ce montant"
                          : "Les deux montants annuels sont identiques"}
                  </div>
                </motion.div>
              </div>
            </div>

            <p className="mt-6 border-t border-white/[0.06] pt-5 text-xs leading-relaxed text-white/55">
              Comparaison budgétaire uniquement : catalogues, disponibilité,
              qualité et conditions peuvent différer. Vérifiez que la formule
              répond à vos besoins avant de souscrire.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
