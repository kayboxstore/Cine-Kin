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
              {[
                { title: "Éditeur du site", content: `Le site ${SITE_CONFIG.name} est édité par ${SITE_CONFIG.name}, société enregistrée et opérant conformément aux lois en vigueur.` },
                { title: "Hébergement", content: `Le site est hébergé sur des serveurs cloud sécurisés. L'infrastructure est répartie géographiquement pour assurer une disponibilité optimale du service.` },
                { title: "Contact", content: `Pour toute question ou réclamation, vous pouvez nous contacter via WhatsApp au ${SITE_CONFIG.whatsappNumber} ou par email à ${SITE_CONFIG.email}. Notre support est disponible ${SITE_CONFIG.supportHours.toLowerCase()}.` },
                { title: "Propriété intellectuelle", content: `Tous les éléments du site (textes, images, logos, vidéos) sont la propriété exclusive de ${SITE_CONFIG.name} ou de ses partenaires. Toute reproduction ou utilisation sans autorisation préalable est strictement interdite.` },
                { title: "Responsabilité", content: `${SITE_CONFIG.name} s'efforce d'assurer l'exactitude des informations publiées sur le site. Cependant, nous ne pouvons garantir l'absence d'erreurs ou d'omissions. Le service peut être momentanément indisponible pour des raisons de maintenance.` },
                { title: "Liens externes", content: `Le site peut contenir des liens vers des sites tiers. ${SITE_CONFIG.name} n'a aucun contrôle sur ces sites et décline toute responsabilité quant à leur contenu.` },
                { title: "Droit applicable", content: `Les présentes mentions légales sont soumises au droit applicable. En cas de litige, une solution amiable sera recherchée avant toute action judiciaire.` },
                { title: "Crédits", content: `Conception et développement : ${SITE_CONFIG.name}. Visuels et images : Droits réservés ${SITE_CONFIG.name}.` },
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
