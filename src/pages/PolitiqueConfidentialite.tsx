import { FiShield } from "react-icons/fi";
import SEO from "@/components/SEO";
import { SITE_CONFIG } from "@/data/siteData";
import ScrollReveal from "@/components/ScrollReveal";

export default function PolitiqueConfidentialite() {
  return (

    <div>

      <SEO
        title="Politique de Confidentialité"
        description="Politique de confidentialité et protection des données personnelles de Ciné Kin Premium."
      />
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(90,107,78,0.05) 0%, transparent 50%)" }}
        />
        <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-8">
          <ScrollReveal>
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-white/[0.06] bg-white/[0.02] mb-8">
              <FiShield className="w-4 h-4 text-[#6b7c5c]" />
              <span className="text-sm text-white/50">Vos données sont protégées</span>
            </div>
            <h1 className="font-display font-bold text-4xl sm:text-5xl text-white mb-8 tracking-[-0.02em]">
              Politique de <span className="text-[#6b7c5c]">confidentialité</span>
            </h1>
          </ScrollReveal>

          <ScrollReveal>
            <div className="prose prose-invert max-w-none space-y-8">
              <div className="border border-white/[0.04] rounded-xl p-6 bg-[#111d32]/30">
                <p className="text-white/45 text-base leading-relaxed font-light">
                  Chez {SITE_CONFIG.name}, nous prenons la protection de vos données personnelles très au sérieux. 
                  Cette politique décrit comment nous collectons, utilisons et protégeons vos informations.
                </p>
              </div>

              {[
                { title: "1. Collecte des informations", content: `Nous collectons les informations que vous nous fournissez directement : nom, adresse email, numéro de téléphone, et informations de paiement. Nous collectons également des données techniques (IP, appareil utilisé) pour assurer la qualité du service.` },
                { title: "2. Utilisation des informations", content: `Vos données sont utilisées pour : fournir et maintenir le service, traiter vos paiements, vous contacter concernant votre compte, améliorer nos services, et respecter nos obligations légales.` },
                { title: "3. Protection des données", content: `Nous mettons en oeuvre des mesures de sécurité techniques et organisationnelles pour protéger vos données contre tout accès non autorisé, modification, divulgation ou destruction.` },
                { title: "4. Partage des informations", content: `Nous ne vendons ni ne louons vos données personnelles à des tiers. Nous pouvons partager des informations avec des prestataires de services qui nous assistent dans nos opérations, sous réserve de obligations de confidentialité strictes.` },
                { title: "5. Cookies et technologies similaires", content: `Nous utilisons des cookies pour améliorer votre expérience, analyser l'utilisation du service et personnaliser le contenu. Vous pouvez configurer votre navigateur pour refuser les cookies.` },
                { title: "6. Vos droits", content: `Vous avez le droit d'accéder à vos données, de les rectifier, de demander leur suppression, et de vous opposer à leur traitement. Contactez-nous pour exercer ces droits.` },
                { title: "7. Conservation des données", content: `Nous conservons vos données aussi longtemps que nécessaire pour fournir le service et respecter nos obligations légales. Les données de compte sont supprimées 12 mois après la résiliation.` },
                { title: "8. Modifications de la politique", content: `Nous pouvons modifier cette politique à tout moment. Les modifications seront publiées sur cette page avec la date de mise à jour.` },
              ].map((section, i) => (
                <div key={i} className="border border-white/[0.04] rounded-xl p-6 bg-[#111d32]/30">
                  <h2 className="font-display font-semibold text-xl text-white mb-3">{section.title}</h2>
                  <p className="text-white/45 text-base leading-relaxed font-light">{section.content}</p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
