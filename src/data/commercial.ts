// Public commercial wording that can be supported by the current product.
// Keep uncertain volumes, response times, uptime figures and profitability
// claims out of this file until the business can provide dated evidence.
export const COMMERCIAL_INFO = {
  catalogue: {
    headline:
      "Un catalogue de chaînes, films et séries, avec une qualité jusqu’à 4K selon les contenus et les appareils.",
    planLabel: "Catalogue inclus",
    feature: "Catalogue de chaînes TV",
    caveat:
      "Le catalogue et la qualité disponible peuvent varier selon la formule, la source et l’appareil utilisé.",
  },
  support: {
    label: "Support WhatsApp 7j/7",
    hours: "Lun - Dim : 08h00 - 23h00",
    hoursShort: "08h00 - 23h00",
    description:
      "L’équipe répond sur WhatsApp pendant les horaires de support publiés.",
  },
  activation: {
    label: "Activation après validation",
    description:
      "Le délai d’activation est confirmé après vérification de la formule et du paiement.",
  },
  refund: {
    label: "Conditions communiquées avant paiement",
    description:
      "L’éligibilité éventuelle à un remboursement et ses modalités sont confirmées par écrit avant le paiement et l’activation.",
  },
  screens: {
    label: "1 ou 2 écrans selon la formule",
    max: 2,
  },
  payment: {
    label: "Instructions confirmées avant paiement",
    description:
      "WhatsApp sert à préparer la commande et à transmettre les instructions. Aucun paiement n’est traité par le site ou dans la conversation WhatsApp.",
  },
  reseller: {
    label: "Tarifs et résultats transparents",
    description:
      "Le revendeur fixe son prix de vente. Aucun niveau de marge ou de revenu n’est garanti.",
  },
  status: {
    scope:
      "Les contrôles affichés couvrent uniquement le site, son API et sa base de données ; ils ne mesurent pas la disponibilité des flux ou du catalogue TV.",
  },
} as const;
