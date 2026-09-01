import { FiShield } from "react-icons/fi";
import SEO from "@/components/SEO";
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
                <p className="text-white/60 text-base leading-relaxed font-light">
                  Version de préproduction : cette politique décrit les
                  traitements présents dans l'application auditée. L'identité
                  légale du responsable du traitement, les durées de
                  conservation définitives et la liste complète des
                  sous-traitants doivent être validées avant toute mise en
                  production commerciale.
                </p>
              </div>

              {[
                { title: "1. Données traitées", content: `Selon le portail utilisé, l'application peut enregistrer des données de compte ou de contact (nom, email, téléphone ou contact revendeur), une adresse MAC, les informations de formule et d'activation, ainsi que les écritures du registre de crédits. Les requêtes techniques utilisent aussi l'adresse IP pour la limitation de débit et la sécurité. Aucun numéro de carte ni autre donnée bancaire n'est saisi ou conservé par le site, qui ne traite aucun paiement en ligne.` },
                { title: "2. Utilisation des informations", content: `Ces données servent à administrer les comptes, licences, activations et crédits, à sécuriser les accès, à répondre aux demandes et à assurer le fonctionnement technique du service. Les modalités de paiement sont confirmées séparément avant tout règlement.` },
                { title: "3. Protection des données", content: `Nous mettons en oeuvre des mesures de sécurité techniques et organisationnelles pour protéger vos données contre tout accès non autorisé, modification, divulgation ou destruction.` },
                { title: "4. Prestataires et échanges externes", content: `Le staging technique utilise Render pour l'application et Aiven pour MySQL. L'authentification Kimi peut être utilisée lorsqu'elle est configurée. Les échanges initiés par WhatsApp ou email sont traités par ces services externes, hors du site. La liste définitive des prestataires, leurs localisations et les garanties de transfert doivent être confirmées avant la production.` },
                { title: "5. Cookies et technologies similaires", content: `La version auditée utilise des cookies nécessaires à l'authentification, à la sécurité de la transaction OAuth et à la mémorisation d'une préférence d'interface. Elle n'intègre aucun cookie publicitaire ni outil d'analyse d'audience. Refuser les cookies de session empêche l'utilisation des portails authentifiés.` },
                { title: "6. Vos droits", content: `Vous avez le droit d'accéder à vos données, de les rectifier, de demander leur suppression, et de vous opposer à leur traitement. Contactez-nous pour exercer ces droits.` },
                { title: "7. Conservation des données", content: `Aucune suppression automatique des comptes après une durée fixe n'est actuellement implémentée. Une politique de conservation par catégorie de données doit être approuvée et mise en oeuvre avant la production commerciale. Les demandes de suppression peuvent être adressées au contact publié sur le site.` },
                { title: "8. Modifications de la politique", content: `Nous pouvons modifier cette politique à tout moment. Les modifications seront publiées sur cette page avec la date de mise à jour.` },
              ].map((section, i) => (
                <div key={i} className="border border-white/[0.04] rounded-xl p-6 bg-[#111d32]/30">
                  <h2 className="font-display font-semibold text-xl text-white mb-3">{section.title}</h2>
                  <p className="text-white/60 text-base leading-relaxed font-light">{section.content}</p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
