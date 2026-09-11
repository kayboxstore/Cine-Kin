import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { getAbsoluteAssetUrl, getCanonicalUrl } from "@/lib/siteUrl";

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  ogImage?: string;
  ogType?: string;
  canonical?: string;
  noIndex?: boolean;
}

export default function SEO({
  title,
  description,
  keywords = "IPTV, abonnement IPTV, chaînes TV, streaming, 4K, Ciné Kin Premium, revendeur IPTV",
  ogImage = "/og-image-v2.jpg",
  ogType = "website",
  canonical,
  noIndex = false,
}: SEOProps) {
  const siteName = "Ciné Kin Premium";
  const fullTitle = title.includes(siteName) ? title : `${title} | ${siteName}`;
  const canonicalUrl = getCanonicalUrl(canonical);
  const ogImageUrl = getAbsoluteAssetUrl(ogImage);
  const robots = noIndex ? "noindex, nofollow" : "index, follow";

  useEffect(() => {
    document
      .querySelectorAll("[data-static-seo]")
      .forEach(element => element.remove());
  }, []);

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={siteName} />
      <meta name="robots" content={robots} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:image" content={ogImageUrl} />
      <meta property="og:locale" content="fr_FR" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImageUrl} />
      <meta name="twitter:url" content={canonicalUrl} />

      {/* Canonical */}
      <link rel="canonical" href={canonicalUrl} />
      <link rel="alternate" hrefLang="fr-CD" href={canonicalUrl} />
    </Helmet>
  );
}
