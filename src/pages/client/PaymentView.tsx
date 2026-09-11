import { CreditCard, MessageCircle, ShieldCheck } from "lucide-react";
import { SITE_CONFIG } from "@/data/siteData";
import { COMMERCIAL_INFO } from "@/data/commercial";

export default function PaymentView({ mac }: { mac?: string }) {
  const message = encodeURIComponent(
    `Bonjour Ciné Kin Premium, je souhaite connaître les options d’activation ou de renouvellement${mac ? ` pour la MAC ${mac}` : ""}. Merci de me confirmer le tarif et les conditions avant paiement.`,
  );
  const whatsappNumber = SITE_CONFIG.whatsappNumber.replace(/[+\s]/g, "");
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${message}`;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#5a6b4e]/15 text-[#8ba26f]">
          <CreditCard className="h-5 w-5" />
        </div>
        <h2 className="font-display text-xl font-semibold text-white">
          Activation ou renouvellement
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-white/60">
          Le paiement en ligne n’est pas disponible dans cet espace. L’équipe confirme la formule compatible, son prix et les conditions applicables avant tout règlement.
        </p>
      </div>

      <div className="rounded-2xl border border-amber-300/15 bg-amber-300/[0.04] p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-200" />
          <p className="text-sm leading-relaxed text-white/65">
            {COMMERCIAL_INFO.payment.description} Ne transmettez jamais de code PIN, de mot de passe ou de donnée bancaire complète dans un message.
          </p>
        </div>
      </div>

      <a
        href={whatsappLink}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-3.5 text-sm font-semibold text-[#0a1628] transition-opacity hover:opacity-90"
      >
        <MessageCircle className="h-4 w-4" />
        Demander les options sur WhatsApp
      </a>
    </div>
  );
}
