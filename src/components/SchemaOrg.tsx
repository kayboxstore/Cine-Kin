import { Helmet } from "react-helmet-async";
import { CLIENT_PLANS, SITE_CONFIG } from "@/data/siteData";
import { COMMERCIAL_INFO } from "@/data/commercial";
import { getSiteOrigin } from "@/lib/siteUrl";

export default function SchemaOrg() {
  const siteUrl = getSiteOrigin();

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_CONFIG.name,
    url: siteUrl,
    logo: `${siteUrl}/favicon-512.png`,
    description: `${COMMERCIAL_INFO.catalogue.headline} Essai gratuit de 24 h.`,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: SITE_CONFIG.whatsappNumber,
      contactType: "customer service",
      availableLanguage: ["French", "English"],
      areaServed: "CD",
    },
  };

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `Abonnement IPTV ${SITE_CONFIG.name}`,
    provider: {
      "@type": "Organization",
      name: SITE_CONFIG.name,
    },
    description: COMMERCIAL_INFO.catalogue.headline,
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Forfaits IPTV",
      itemListElement: CLIENT_PLANS.map(plan => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: `${plan.name} · ${plan.screensLabel}`,
        },
        price: String(plan.price),
        priceCurrency: "USD",
      })),
    },
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_CONFIG.name,
    url: siteUrl,
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(organizationSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(serviceSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(websiteSchema)}
      </script>
    </Helmet>
  );
}
