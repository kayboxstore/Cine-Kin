// ============================================
// Ciné Kin Premium - Données du site
// Modifier les valeurs ci-dessous selon vos besoins
// ============================================

export const SITE_CONFIG = {
  name: "Ciné Kin Premium",
  tagline: "L'expérience TV ultime, sans limites",
  description: "Accédez à des milliers de chaînes TV, films et séries en haute définition. Une solution premium pour toute la famille.",
  whatsappNumber: "+243830240073", // ← WhatsApp Ciné Kin Premium
  email: "kayboxstore@outlook.fr",
  supportHours: "Lun - Dim : 08h00 - 23h00",
  year: new Date().getFullYear(),
} as const;

// Offres clients (abonnements)
export const CLIENT_PLANS = [
  {
    id: "trial",
    name: "Essai 24h",
    duration: "24 heures",
    price: 0,
    priceLabel: "Gratuit",
    quality: "HD",
    channels: "5000+",
    screens: 1,
    vpnFriendly: true,
    support: "Email",
    popular: false,
    bestDeal: false,
    features: [
      "Accès complet 24h",
      "5000+ chaînes",
      "Qualité HD",
      "1 écran simultané",
      "Support par email",
    ],
  },
  {
    id: "1month",
    name: "1 Mois",
    duration: "1 mois",
    price: 9.99,
    priceLabel: "$9.99",
    quality: "HD / FHD",
    channels: "8000+",
    screens: 2,
    vpnFriendly: true,
    support: "WhatsApp + Email",
    popular: false,
    bestDeal: false,
    features: [
      "8000+ chaînes",
      "Films & séries inclus",
      "Qualité HD & Full HD",
      "2 écrans simultanés",
      "Support prioritaire",
      "Mise à jour auto",
    ],
  },
  {
    id: "3months",
    name: "3 Mois",
    duration: "3 mois",
    price: 24.99,
    priceLabel: "$24.99",
    quality: "HD / FHD",
    channels: "10000+",
    screens: 3,
    vpnFriendly: true,
    support: "WhatsApp + Email",
    popular: false,
    bestDeal: false,
    features: [
      "10000+ chaînes",
      "Films & séries inclus",
      "Qualité HD & Full HD",
      "3 écrans simultanés",
      "Support prioritaire",
      "Mise à jour auto",
      "EPG inclus",
    ],
  },
  {
    id: "6months",
    name: "6 Mois",
    duration: "6 mois",
    price: 44.99,
    priceLabel: "$44.99",
    quality: "HD / FHD / 4K",
    channels: "12000+",
    screens: 4,
    vpnFriendly: true,
    support: "WhatsApp + Email",
    popular: false,
    bestDeal: false,
    features: [
      "12000+ chaînes",
      "Films & séries inclus",
      "Qualité jusqu'à 4K",
      "4 écrans simultanés",
      "Support VIP",
      "Mise à jour auto",
      "EPG + Catch-up",
      "Anti-freeze",
    ],
  },
  {
    id: "12months",
    name: "12 Mois",
    duration: "12 mois",
    price: 69.99,
    priceLabel: "$69.99",
    quality: "HD / FHD / 4K",
    channels: "15000+",
    screens: 5,
    vpnFriendly: true,
    support: "WhatsApp + Email + Téléphone",
    popular: true,
    bestDeal: true,
    features: [
      "15000+ chaînes",
      "Films & séries inclus",
      "Qualité jusqu'à 4K",
      "5 écrans simultanés",
      "Support VIP dédié",
      "Mise à jour auto",
      "EPG + Catch-up",
      "Anti-freeze premium",
      "VOD illimité",
    ],
  },
  {
    id: "24months",
    name: "24 Mois",
    duration: "24 mois",
    price: 119.99,
    priceLabel: "$119.99",
    quality: "HD / FHD / 4K",
    channels: "15000+",
    screens: 5,
    vpnFriendly: true,
    support: "WhatsApp + Email + Téléphone",
    popular: false,
    bestDeal: false,
    features: [
      "15000+ chaînes",
      "Films & séries inclus",
      "Qualité jusqu'à 4K",
      "5 écrans simultanés",
      "Support VIP dédié",
      "Mise à jour auto",
      "EPG + Catch-up",
      "Anti-freeze premium",
      "VOD illimité",
      "Meilleur rapport qualité/prix",
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
    margin: "150%+",
    popular: false,
    features: [
      "20 codes",
      "Panneau revendeur",
      "Activation instantanée",
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
    margin: "150%+",
    popular: true,
    features: [
      "50 codes",
      "Panneau revendeur pro",
      "Activation instantanée",
      "Support prioritaire",
      "Site web personnalisé",
      "API d'accès",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    credits: 100,
    price: 1299.99,
    priceLabel: "$1299.99",
    margin: "150%+",
    popular: false,
    features: [
      "100 codes",
      "Panneau revendeur VIP",
      "Activation instantanée",
      "Support 24/7",
      "Site web personnalisé",
      "API complète",
      "Marque blanche",
      "Formation incluse",
    ],
  },
  {
    id: "vip",
    name: "VIP",
    credits: 500,
    price: 2299.99,
    priceLabel: "$2299.99",
    margin: "150%+",
    popular: false,
    features: [
      "500 codes",
      "Panneau revendeur VIP+",
      "Activation instantanée",
      "Support 24/7 dédié",
      "Site web sur mesure",
      "API complète",
      "Marque blanche",
      "Formation + Coaching",
      "Accès bêta features",
    ],
  },
] as const;

// Avantages
export const ADVANTAGES = [
  {
    icon: "FiMonitor",
    title: "15000+ Chaînes",
    description: "Une vaste sélection de chaînes du monde entier, disponibles 24h/24.",
  },
  {
    icon: "FiFilm",
    title: "Films & Séries",
    description: "Bibliothèque VOD immense avec les dernières sorties cinéma.",
  },
  {
    icon: "FiZap",
    title: "Qualité 4K",
    description: "Profitez d'une qualité d'image exceptionnelle jusqu'à 4K UHD.",
  },
  {
    icon: "FiSmartphone",
    title: "Multi-appareils",
    description: "Regardez sur TV, smartphone, tablette et ordinateur.",
  },
  {
    icon: "FiShield",
    title: "Anti-freeze",
    description: "Technologie anti-buffering pour un visionnage fluide.",
  },
  {
    icon: "FiHeadphones",
    title: "Support 24/7",
    description: "Une équipe disponible à tout moment pour vous accompagner.",
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

// Témoignages
export const TESTIMONIALS = [
  {
    name: "Marc D.",
    role: "Client depuis 6 mois",
    content: "Qualité exceptionnelle ! J'ai accès à toutes les chaînes que je souhaitais. Le support est très réactif.",
    rating: 5,
  },
  {
    name: "Sophie L.",
    role: "Cliente depuis 1 an",
    content: "Je recommande vivement Ciné Kin Premium. Installation facile et image parfaite même en 4K.",
    rating: 5,
  },
  {
    name: "Jean K.",
    role: "Revendeur Pro",
    content: "Le programme revendeur m'a permis de lancer mon business. Les marges sont excellentes et le support est top.",
    rating: 5,
  },
  {
    name: "Amina B.",
    role: "Cliente depuis 3 mois",
    content: "Parfait pour toute la famille. Les enfants ont leurs chaînes et nous aussi. Très satisfaite !",
    rating: 5,
  },
] as const;

// FAQ
export const FAQ = [
  {
    question: "Qu'est-ce que Ciné Kin Premium ?",
    answer: "Ciné Kin Premium est une plateforme numérique premium qui vous donne accès à des milliers de chaînes TV, films et séries en haute qualité, sur tous vos appareils.",
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
    answer: "Nous proposons des qualités HD, Full HD et 4K selon votre formule. Notre technologie anti-freeze garantit un visionnage fluide.",
  },
  {
    question: "Comment fonctionne le support ?",
    answer: "Notre équipe de support est disponible par WhatsApp et email. Selon votre formule, vous bénéficiez d'un support standard ou VIP prioritaire.",
  },
  {
    question: "Puis-je devenir revendeur ?",
    answer: "Oui ! Nous proposons un programme revendeur avec des packs adaptés à tous les niveaux. Contactez-nous via la page Revendeurs pour en savoir plus.",
  },
  {
    question: "Quelle est la politique de remboursement ?",
    answer: "Aucun remboursement n'est effectué après activation sauf en cas de problème technique confirmé de notre côté. N'hésitez pas à tester notre essai gratuit de 24h.",
  },
] as const;

// FAQ Revendeurs
export const RESELLER_FAQ = [
  {
    question: "Comment fonctionne le programme revendeur ?",
    answer: "Achetez un pack de codes et utilisez-les pour créer des abonnements pour vos propres clients. Plus vous achetez de codes, plus votre marge est importante.",
  },
  {
    question: "Quelle est la marge des revendeurs ?",
    answer: "Les marges sont de plus de 150% sur chaque vente, quel que soit le pack choisi.",
  },
  {
    question: "Puis-je personnaliser mon offre ?",
    answer: "Oui, avec les packs Business, Pro et VIP, vous bénéficiez d'un site web personnalisé et/ou d'une marque blanche pour vendre sous votre propre enseigne.",
  },
  {
    question: "Comment se passe l'activation ?",
    answer: "L'activation est instantanée via votre panneau revendeur. Vous pouvez créer des comptes pour vos clients en temps réel.",
  },
  {
    question: "Y a-t-il un engagement ?",
    answer: "Non, il n'y a aucun engagement. Vous achetez des codes que vous utilisez à votre rythme. Aucun frais mensuel caché.",
  },
] as const;

// Moyens de paiement
export const PAYMENT_METHODS = [
  {
    id: "mpesa",
    name: "M-Pesa",
    description: "Paiement mobile via M-Pesa",
    icon: "FiSmartphone",
  },
  {
    id: "orange",
    name: "Orange Money",
    description: "Paiement via Orange Money",
    icon: "FiSmartphone",
  },
  {
    id: "airtel",
    name: "Airtel Money",
    description: "Paiement via Airtel Money",
    icon: "FiSmartphone",
  },
  {
    id: "card",
    name: "Carte Bancaire",
    description: "Visa, Mastercard",
    icon: "FiCreditCard",
  },
  {
    id: "crypto",
    name: "Crypto-monnaies",
    description: "Bitcoin, Ethereum, USDT",
    icon: "FiDollarSign",
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

// Navigation
export const NAV_LINKS = [
  { name: "Accueil", path: "/" },
  { name: "Offres", path: "/offres" },
  { name: "Revendeurs", path: "/revendeurs" },
  { name: "Support", path: "/support" },
  { name: "À propos", path: "/a-propos" },
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
