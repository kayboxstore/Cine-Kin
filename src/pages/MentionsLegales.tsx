import { FiBookOpen } from "react-icons/fi";
import SEO from "@/components/SEO";
import { SITE_CONFIG } from "@/data/siteData";
import ScrollReveal from "@/components/ScrollReveal";

export default function MentionsLegales() {
  return (

    <div>

      <SEO
        title="Mentions Légales"
        description="Mentions légales du site Ciné Kin Premium. Informations sur l'éditeur et l'hébergeur."
      />
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(90,107,78,0.05) 0%, transparent 50%)" }}
        />
        <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-8">
          <ScrollReveal>
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-white/[0.06] bg-white/[0.02] mb-8">
              <FiBookOpen className="w-4 h-4 text-[#6b7c5c]" />
              <span className="text-sm text-white/50">Informations légales</span>
            </div>
            <h1 className="font-display font-bold text-4xl sm:text-5xl text-white mb-8 tracking-[-0.02em]">
              Mentions <span className="text-[#6b7c5c]">légales</span>
            </h1>
          </ScrollReveal>

          <ScrollReveal>
            <div className="prose prose-invert max-w-none space-y-8">
              <div className="border border-amber-400/20 rounded-xl p-6 bg-amber-400/[0.04]">
                <p className="text-white/70 text-base leading-relaxed font-light">
                  Version de préproduction : les informations d'identification
                  obligatoires ci-dessous doivent être complétées et validées
                  avant toute exploitation commerciale du site.
                </p>
              </div>
              {[
                { title: "Éditeur du site — à compléter", content: `${SITE_CONFIG.name} est le nom commercial affiché par le service. La dénomination légale, la forme juridique, l'adresse, l'identité du représentant et les numéros d'enregistrement applicables doivent être ajoutés ici avant la mise en production commerciale.` },
                { title: "Hébergement de staging", content: `La version de staging auditée est hébergée sur Render et utilise une base MySQL Aiven. La plateforme de production n'est pas encore arrêtée ; cette rubrique devra être mise à jour avec l'identité et les coordonnées de l'hébergeur finalement retenu.` },
                { title: "Contact", content: `Pour toute question ou réclamation, vous pouvez nous contacter via WhatsApp au ${SITE_CONFIG.whatsappNumber} ou par email à ${SITE_CONFIG.email}. Notre support est disponible ${SITE_CONFIG.supportHours.toLowerCase()}.` },
                { title: "Propriété intellectuelle", content: `Toute reproduction d'un élément protégé exige l'autorisation de son titulaire. Les sources et licences des textes, images, logos, vidéos et catalogues proposés doivent être inventoriées et validées avant la commercialisation.` },
                { title: "Responsabilité", content: `${SITE_CONFIG.name} s'efforce d'assurer l'exactitude des informations publiées sur le site. Cependant, nous ne pouvons garantir l'absence d'erreurs ou d'omissions. Le service peut être momentanément indisponible pour des raisons de maintenance.` },
                { title: "Liens externes", content: `Le site peut contenir des liens vers des sites tiers. ${SITE_CONFIG.name} n'a aucun contrôle sur ces sites et décline toute responsabilité quant à leur contenu.` },
                { title: "Droit applicable — à compléter", content: `Le pays, la juridiction applicable et la procédure de règlement des litiges doivent être précisés et validés avant toute mise en production commerciale.` },
                { title: "Crédits — à compléter", content: `Conception et développement : ${SITE_CONFIG.name}. Les auteurs, sources et licences des visuels et autres contenus doivent être renseignés après vérification de leurs droits d'utilisation.` },
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
