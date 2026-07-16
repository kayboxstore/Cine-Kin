import { Helmet } from "react-helmet-async";

export default function SchemaOrg() {
  const siteUrl = "https://7a5czmte3r3ri.kimi.page";

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Ciné Kin Premium",
    url: siteUrl,
    logo: `${siteUrl}/favicon.png`,
    description: "Service IPTV premium avec 15000+ chaînes TV, films et séries en 4K UHD. Essai gratuit 24h.",
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+243-830-240-073",
      contactType: "customer service",
      availableLanguage: ["French", "English"],
      areaServed: "CD",
    },
    sameAs: [],
  };

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Abonnement IPTV Ciné Kin Premium",
    provider: {
      "@type": "Organization",
      name: "Ciné Kin Premium",
    },
    description: "Accès à 15000+ chaînes TV, films et séries en 4K UHD. Compatible Smart TV, Android, iPhone, PC.",
    areaServed: {
      "@type": "Place",
      name: "Monde entier",
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Forfaits IPTV",
      itemListElement: [
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Essai 24h",
          },
          price: "0",
          priceCurrency: "USD",
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "1 mois",
          },
          price: "10",
          priceCurrency: "USD",
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "3 mois",
          },
          price: "25",
          priceCurrency: "USD",
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "12 mois",
          },
          price: "70",
          priceCurrency: "USD",
        },
      ],
    },
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Ciné Kin Premium",
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/#/offres`,
      "query-input": "required name=search_term_string",
    },
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
