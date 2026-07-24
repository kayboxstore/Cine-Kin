import { useState } from "react";
import { Check, CreditCard, MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = "243991599600"; // +243 991 599 600

const LICENSES = [
  { id: "12_months", label: "12 mois", price: "10 $", perks: ["Accès complet 1 an", "Support standard"] },
  { id: "unlimited", label: "Illimitée", price: "20 $", perks: ["Accès à vie", "Support prioritaire"] },
] as const;

export default function PaymentView({ mac }: { mac?: string }) {
  const [selected, setSelected] = useState<(typeof LICENSES)[number]["id"]>("12_months");

  const chosen = LICENSES.find((l) => l.id === selected)!;
  const waMessage = encodeURIComponent(
    `Bonjour, je souhaite activer la licence Ciné Kin "${chosen.label}"${mac ? ` pour la MAC ${mac}` : ""}.`,
  );
  const waLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${waMessage}`;

  return (
    <div className="space-y-6">
      {/* Licence choice */}
      <div className="grid gap-4 sm:grid-cols-2">
        {LICENSES.map((l) => {
          const active = l.id === selected;
          return (
            <button
              key={l.id}
              type="button"
              onClick={() => setSelected(l.id)}
              className={`rounded-2xl border p-6 text-left transition-colors ${
                active
                  ? "border-[#5a6b4e] bg-[#5a6b4e]/12"
                  : "border-white/[0.08] bg-white/[0.02] hover:border-white/20"
              }`}
            >
              <div className="flex items-baseline justify-between">
                <span className="font-display text-lg font-semibold text-white">{l.label}</span>
                <span className="font-display text-2xl font-bold text-[#8ba26f]">{l.price}</span>
              </div>
              <ul className="mt-4 space-y-2">
                {l.perks.map((p) => (
                  <li key={p} className="flex items-center gap-2 text-sm text-white/60">
                    <Check className="h-4 w-4 text-[#6b7c5c]" />
                    {p}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      {/* Payment methods — visible but inactive */}
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
        <h2 className="mb-4 font-display text-lg font-semibold text-white">Moyens de paiement</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { label: "Carte bancaire", icon: CreditCard },
            { label: "PayPal", icon: CreditCard },
          ].map((m) => (
            <div
              key={m.label}
              aria-disabled="true"
              className="flex cursor-not-allowed items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.01] px-4 py-3 opacity-60"
            >
              <span className="flex items-center gap-2 text-white/70">
                <m.icon className="h-4 w-4" />
                {m.label}
              </span>
              <span className="rounded-md bg-white/5 px-2 py-0.5 text-[11px] font-medium text-white/50">
                Bientôt disponible
              </span>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-xl border border-[#25D366]/25 bg-[#25D366]/[0.06] p-4">
          <p className="text-sm text-white/70">
            Le paiement en ligne arrive bientôt. En attendant, contactez notre support WhatsApp
            pour activer ou renouveler votre licence.
          </p>
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-[#0a1628] transition-opacity hover:opacity-90"
          >
            <MessageCircle className="h-4 w-4" />
            Contacter le support WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
