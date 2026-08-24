// ============================================
// Ciné Kin Premium - Données du site
// Modifier les valeurs ci-dessous selon vos besoins
// ============================================

import { COMMERCIAL_INFO } from "./commercial";

export const SITE_CONFIG = {
  name: "Ciné Kin Premium",
  tagline: "Vos contenus sur vos appareils compatibles",
  description: "Accédez à des milliers de chaînes TV, films et séries en haute définition. Une solution premium pour toute la famille.",
  whatsappNumber: "+243830240073", // ← WhatsApp Ciné Kin Premium
  email: "kayboxstore@outlook.fr",
  supportHours: COMMERCIAL_INFO.support.hours,
  year: new Date().getFullYear(),
} as const;

// Offres clients (abonnements)
// Real pricing grid (single source of truth). `months` drives the dynamic
// monthly-equivalent / savings calculation in OffersSection.
export const CLIENT_PLANS = [
  {
    id: "trial",
    name: "Essai 24h",
    duration: "24 heures",
    months: 0,
    price: 0,
    priceLabel: "Gratuit",
    quality: "HD / FHD / jusqu’à 4K",
    channels: COMMERCIAL_INFO.catalogue.planLabel,
    screens: 1,
    screensLabel: "1 écran",
    support: "Standard",
    vpnFriendly: true,
    popular: false,
    bestDeal: false,
    features: [
      "Accès complet pendant 24h",
      COMMERCIAL_INFO.catalogue.feature,
      "Films & séries (VOD)",
      "1 écran simultané",
      "Support standard",
    ],
  },
  {
    id: "1month",
    name: "1 mois",
    duration: "1 mois",
    months: 1,
    price: 10,
    priceLabel: "10 $",
    quality: "HD / FHD / jusqu’à 4K",
    channels: COMMERCIAL_INFO.catalogue.planLabel,
    screens: 1,
    screensLabel: "1 écran",
    support: "Standard",
    vpnFriendly: true,
    popular: false,
    bestDeal: false,
    features: [
      COMMERCIAL_INFO.catalogue.feature,
      "Films & séries (VOD)",
      "Qualité jusqu'à 4K",
      "1 écran simultané",
      "Support standard",
      "Mise à jour auto",
    ],
  },
  {
    id: "3months",
    name: "3 mois",
    duration: "3 mois",
    months: 3,
    price: 25,
    priceLabel: "25 $",
    quality: "HD / FHD / jusqu’à 4K",
    channels: COMMERCIAL_INFO.catalogue.planLabel,
    screens: 1,
    screensLabel: "1 écran",
    support: "Standard",
    vpnFriendly: true,
    popular: false,
    bestDeal: false,
    features: [
      COMMERCIAL_INFO.catalogue.feature,
      "Films & séries (VOD)",
      "Qualité jusqu'à 4K",
      "1 écran simultané",
      "Support standard",
      "EPG + Catch-up",
    ],
  },
  {
    id: "6months",
    name: "6 mois",
    duration: "6 mois",
    months: 6,
    price: 45,
    priceLabel: "45 $",
    quality: "HD / FHD / jusqu’à 4K",
    channels: COMMERCIAL_INFO.catalogue.planLabel,
    screens: 1,
    screensLabel: "1 écran",
    support: "Standard",
    vpnFriendly: true,
    popular: false,
    bestDeal: false,
    features: [
      COMMERCIAL_INFO.catalogue.feature,
      "Films & séries (VOD)",
      "Qualité jusqu'à 4K",
      "1 écran simultané",
      "Support standard",
      "EPG + Catch-up",
      "Assistance à l’installation",
      COMMERCIAL_INFO.refund.label,
    ],
  },
  {
    id: "12months-1screen",
    name: "12 mois",
    duration: "12 mois",
    months: 12,
    price: 70,
    priceLabel: "70 $",
    quality: "HD / FHD / jusqu’à 4K",
    channels: COMMERCIAL_INFO.catalogue.planLabel,
    screens: 1,
    screensLabel: "1 écran",
    support: "Standard",
    vpnFriendly: true,
    popular: true,
    bestDeal: true,
    features: [
      COMMERCIAL_INFO.catalogue.feature,
      "Films & séries (VOD)",
      "Qualité jusqu'à 4K",
      "1 écran simultané",
      "Support standard",
      "EPG + Catch-up",
      "Assistance à l’installation",
      COMMERCIAL_INFO.refund.label,
    ],
  },
  {
    id: "12months-2screens",
    name: "12 mois",
    duration: "12 mois",
    months: 12,
    price: 120,
    priceLabel: "120 $",
    quality: "HD / FHD / jusqu’à 4K",
    channels: COMMERCIAL_INFO.catalogue.planLabel,
    screens: 2,
    screensLabel: "2 écrans",
    support: "Prioritaire",
    vpnFriendly: true,
    popular: false,
    bestDeal: false,
    features: [
      COMMERCIAL_INFO.catalogue.feature,
      "Films & séries (VOD)",
      "Qualité jusqu'à 4K",
      "2 écrans simultanés",
      "Support prioritaire",
      "EPG + Catch-up",
      "Assistance à l’installation",
      COMMERCIAL_INFO.refund.label,
    ],
  },
] as const;

// Packs revendeurs
export const RESELLER_PLANS = [
  {
    id: "starter",
    name: "Starter",
    credits: 20,
    price: 199.99,
    priceLabel: "$199.99",
    popular: false,
    features: [
      "20 codes",
      "Panneau revendeur",
      "Gestion des activations",
      "Support dédié",
      "Guides de démarrage",
    ],
  },
  {
    id: "business",
    name: "Business",
    credits: 50,
    price: 499.99,
    priceLabel: "$499.99",
    popular: true,
    features: [
      "50 codes",
      "Panneau revendeur pro",
      "Gestion des activations",
      "Support prioritaire",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    credits: 100,
    price: 1299.99,
    priceLabel: "$1299.99",
    popular: false,
    features: [
      "100 codes",
      "Panneau revendeur VIP",
      "Gestion des activations",
      "Support prioritaire",
    ],
  },
  {
    id: "vip",
    name: "VIP",
    credits: 500,
    price: 2299.99,
    priceLabel: "$2299.99",
    popular: false,
    features: [
      "500 codes",
      "Panneau revendeur VIP+",
      "Gestion des activations",
      "Support prioritaire",
    ],
  },
] as const;

// Avantages
export const ADVANTAGES = [
  {
    icon: "FiMonitor",
    title: "Large catalogue",
    description: COMMERCIAL_INFO.catalogue.caveat,
  },
  {
    icon: "FiFilm",
    title: "Films & Séries",
    description: "Des films et séries sont proposés à la demande selon le catalogue disponible.",
  },
  {
    icon: "FiZap",
    title: "Jusqu’à 4K",
    description: "La qualité dépend du contenu, de la formule, de l’appareil et de la connexion.",
  },
  {
    icon: "FiSmartphone",
    title: "Multi-appareils",
    description: "Regardez sur TV, smartphone, tablette et ordinateur.",
  },
  {
    icon: "FiShield",
    title: "Formules multi-écrans",
    description: COMMERCIAL_INFO.screens.label,
  },
  {
    icon: "FiHeadphones",
    title: COMMERCIAL_INFO.support.label,
    description: COMMERCIAL_INFO.support.description,
  },
] as const;

// Appareils compatibles
export const DEVICES = [
  { name: "Smart TV", icon: "FiMonitor" },
  { name: "Android TV", icon: "FiTv" },
  { name: "Apple TV", icon: "FiAirplay" },
  { name: "Smartphone", icon: "FiSmartphone" },
  { name: "Tablette", icon: "FiTablet" },
  { name: "Ordinateur", icon: "FiCpu" },
  { name: "Chromecast", icon: "FiCast" },
  { name: "Fire Stick", icon: "FiWifi" },
] as const;

// Comment ça marche
export const HOW_IT_WORKS = [
  {
    step: 1,
    title: "Choisissez votre formule",
    description: "Sélectionnez l'abonnement qui correspond à vos besoins parmi nos offres.",
  },
  {
    step: 2,
    title: "Recevez vos accès",
    description: "Après confirmation, vous recevez vos identifiants sous quelques minutes.",
  },
  {
    step: 3,
    title: "Profitez du contenu",
    description: "Installez l'application et accédez immédiatement à tout le contenu.",
  },
] as const;

// FAQ
export const FAQ = [
  {
    question: "Qu'est-ce que Ciné Kin Premium ?",
    answer: `Ciné Kin Premium donne accès à un catalogue de chaînes TV, films et séries sur les appareils compatibles. ${COMMERCIAL_INFO.catalogue.caveat}`,
  },
  {
    question: "Comment puis-je commencer ?",
    answer: "Choisissez simplement l'offre qui vous convient, remplissez le formulaire de commande et notre équipe vous contactera rapidement pour finaliser votre activation.",
  },
  {
    question: "Sur quels appareils puis-je regarder ?",
    answer: "Ciné Kin Premium fonctionne sur Smart TV, Android TV, Apple TV, smartphones (iOS & Android), tablettes, ordinateurs, Chromecast et Fire Stick.",
  },
  {
    question: "Puis-je utiliser un VPN ?",
    answer: "Oui, notre service est compatible avec les VPN. Vous pouvez utiliser un VPN pour sécuriser votre connexion.",
  },
  {
    question: "Quelle est la qualité des streams ?",
    answer: "Nous proposons des qualités HD, Full HD et jusqu’à 4K selon le contenu et la formule. La fluidité dépend aussi de votre connexion et de votre appareil.",
  },
  {
    question: "Comment fonctionne le support ?",
    answer: `${COMMERCIAL_INFO.support.description} Selon votre formule, vous bénéficiez d’un support standard ou prioritaire.`,
  },
  {
    question: "Puis-je devenir revendeur ?",
    answer: "Oui ! Nous proposons un programme revendeur avec des packs adaptés à tous les niveaux. Contactez-nous via la page Revendeurs pour en savoir plus.",
  },
  {
    question: "Quelle est la politique de remboursement ?",
    answer: `${COMMERCIAL_INFO.refund.description} Un essai gratuit de 24 h permet de vérifier le service avant une souscription payante.`,
  },
] as const;

// FAQ Revendeurs
export const RESELLER_FAQ = [
  {
    question: "Comment fonctionne le programme revendeur ?",
    answer: "Achetez un pack de codes et utilisez-les pour créer des abonnements pour vos propres clients depuis le portail revendeur.",
  },
  {
    question: "Quelle est la marge des revendeurs ?",
    answer: COMMERCIAL_INFO.reseller.description,
  },
  {
    question: "Quels outils sont inclus ?",
    answer: "Les packs donnent accès au portail revendeur, au suivi des codes et à la gestion des activations. Les éléments exacts figurent sur chaque pack.",
  },
  {
    question: "Comment se passe l'activation ?",
    answer: "Les activations se gèrent depuis le portail revendeur. Leur disponibilité et leur délai sont confirmés au moment de la commande du pack.",
  },
  {
    question: "Y a-t-il un engagement ?",
    answer: "Les packs correspondent à un nombre défini de codes. Le prix et les éventuelles conditions complémentaires sont confirmés avant paiement.",
  },
] as const;

// Guide d'installation
export const INSTALL_GUIDES = [
  {
    device: "Smart TV / Android TV",
    steps: [
      "Téléchargez l'application IPTV depuis le Play Store",
      "Ouvrez l'application et cliquez sur 'Ajouter une playlist'",
      "Entrez les identifiants fournis par notre équipe",
      "Profitez de votre contenu !",
    ],
  },
  {
    device: "Smartphone / Tablette",
    steps: [
      "Installez l'application recommandée depuis l'App Store ou Play Store",
      "Lancez l'application et accédez aux paramètres",
      "Saisissez votre nom d'utilisateur et mot de passe",
      "Rechargez la liste et commencez à regarder",
    ],
  },
  {
    device: "Ordinateur",
    steps: [
      "Utilisez VLC Media Player ou l'application web",
      "Chargez la playlist M3U fournie",
      "Ou connectez-vous avec vos identifiants",
      "Le contenu est accessible immédiatement",
    ],
  },
] as const;

// Problèmes fréquents
export const COMMON_ISSUES = [
  {
    problem: "Le stream ne charge pas",
    solution: "Vérifiez votre connexion internet. Essayez de redémarrer l'application ou votre appareil. Si le problème persiste, contactez le support.",
  },
  {
    problem: "Image saccadée / buffering",
    solution: "Réduisez la qualité du stream dans les paramètres. Vérifiez que votre connexion dépasse 10 Mbps. Essayez d'utiliser un câble Ethernet.",
  },
  {
    problem: "Chaîne indisponible",
    solution: "Certaines chaînes peuvent être temporairement indisponibles pour maintenance. Essayez de recharger la playlist ou contactez le support.",
  },
  {
    problem: "Identifiants incorrects",
    solution: "Vérifiez que vous avez bien saisi votre nom d'utilisateur et mot de passe. Respectez les majuscules et minuscules.",
  },
] as const;

// Navigation (single source of truth, consumed by Navbar)
export const NAV_LINKS = [
  { name: "Accueil", path: "/" },
  { name: "Offres", path: "/offres" },
  { name: "Revendeurs", path: "/revendeurs" },
  { name: "Tutoriels", path: "/tutoriels" },
  { name: "Contact", path: "/contact" },
] as const;

// Pays pour le formulaire
export const COUNTRIES = [
  "Afrique du Sud",
  "Algérie",
  "Allemagne",
  "Belgique",
  "Bénin",
  "Burkina Faso",
  "Cameroun",
  "Canada",
  "Côte d'Ivoire",
  "Espagne",
  "États-Unis",
  "France",
  "Gabon",
  "Guinée",
  "Italie",
  "Mali",
  "Maroc",
  "Niger",
  "Nigeria",
  "RDC",
  "Royaume-Uni",
  "Sénégal",
  "Tchad",
  "Togo",
  "Tunisie",
  "Autre",
] as const;

// Types d'appareils pour le formulaire
export const DEVICE_TYPES = [
  "Smart TV (Samsung/LG)",
  "Android TV",
  "Apple TV",
  "Smartphone Android",
  "iPhone/iPad",
  "Ordinateur (Windows/Mac)",
  "Fire Stick",
  "Chromecast",
  "Autre",
] as const;

// Applications IPTV
export const IPTV_APPS = [
  "IPTV Smarters Pro",
  "TiviMate",
  "Smart IPTV",
  "SS IPTV",
  "Perfect Player",
  "VLC Media Player",
  "Kodi",
  "Autre / Je ne sais pas",
] as const;
