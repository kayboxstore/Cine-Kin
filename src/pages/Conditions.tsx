import { FiFileText } from "react-icons/fi";
import SEO from "@/components/SEO";
import { SITE_CONFIG } from "@/data/siteData";
import { COMMERCIAL_INFO } from "@/data/commercial";
import ScrollReveal from "@/components/ScrollReveal";

export default function Conditions() {
  return (

    <div>

      <SEO
        title="Conditions Générales de Vente"
        description="Consultez les conditions générales de vente de Ciné Kin Premium. Abonnements IPTV et packs revendeur."
      />
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(90,107,78,0.05) 0%, transparent 50%)" }}
        />
        <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-8">
          <ScrollReveal>
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-white/[0.06] bg-white/[0.02] mb-8">
              <FiFileText className="w-4 h-4 text-[#6b7c5c]" />
              <span className="text-sm text-white/50">Mise à jour : 24 août 2026</span>
            </div>
            <h1 className="font-display font-bold text-4xl sm:text-5xl text-white mb-8 tracking-[-0.02em]">
              Conditions d'<span className="text-[#6b7c5c]">utilisation</span>
            </h1>
          </ScrollReveal>

          <ScrollReveal>
            <div className="prose prose-invert max-w-none space-y-8">
              <div className="border border-amber-400/20 rounded-xl p-6 bg-amber-400/[0.04]">
                <p className="text-white/70 text-base leading-relaxed font-light">
                  Document de préproduction : l'identité du vendeur, le droit
                  applicable, la politique de remboursement définitive et les
                  droits de distribution du catalogue doivent être validés
                  avant toute souscription payante.
                </p>
              </div>
              {[
                { title: "1. Acceptation des conditions", content: `En accédant et en utilisant les services de ${SITE_CONFIG.name}, vous acceptez d'être lié par les présentes conditions d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser nos services.` },
                { title: "2. Description du service", content: `${SITE_CONFIG.name} fournit un service d'abonnement IPTV permettant l'accès à des chaînes de télévision et du contenu vidéo via Internet. Le service est fourni « tel quel » et peut évoluer sans préavis.` },
                { title: "3. Compte utilisateur", content: `Vous êtes responsable de maintenir la confidentialité de vos identifiants de connexion. Toute activité effectuée avec votre compte est sous votre responsabilité. En cas de partage non autorisé de votre compte, nous nous réservons le droit de le suspendre.` },
                { title: "4. Paiements et remboursements", content: `Tous les paiements sont effectués en amont pour la période choisie. ${COMMERCIAL_INFO.refund.description} Un essai gratuit de 24 heures est proposé afin de vérifier le service avant une souscription payante.` },
                { title: "5. Utilisation acceptable", content: `Vous vous engagez à utiliser le service conformément aux lois en vigueur. Il est interdit de revendre, redistribuer ou partager votre accès en dehors du cadre du programme revendeur autorisé.` },
                { title: "6. Limitation de responsabilité", content: `${SITE_CONFIG.name} ne peut être tenu responsable des interruptions de service dues à des problèmes techniques, des mises à jour ou des cas de force majeure. Nous mettons en œuvre des mesures raisonnables pour maintenir le service.` },
                { title: "7. Propriété intellectuelle", content: `L'utilisation du service ne transfère aucun droit de propriété intellectuelle à l'utilisateur. Seuls des contenus dont les droits d'utilisation et de distribution ont été documentés peuvent être proposés ; cette vérification est un préalable à la commercialisation.` },
                { title: "8. Modification des conditions", content: `Nous nous réservons le droit de modifier ces conditions à tout moment. Les modifications prennent effet dès leur publication. Il est de votre responsabilité de consulter régulièrement les présentes conditions.` },
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
