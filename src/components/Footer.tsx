import { Link } from "react-router-dom";
import { FiFacebook, FiInstagram, FiTwitter, FiYoutube, FiMail, FiPhone, FiMapPin } from "react-icons/fi";
import { SITE_CONFIG } from "@/data/siteData";
import Logo from "./Logo";

export default function Footer() {
  const linkGroups = [
    {
      title: "Navigation",
      links: [
        { name: "Accueil", path: "/" },
        { name: "Nos offres", path: "/offres" },
        { name: "Revendeurs", path: "/revendeurs" },
        { name: "Commander", path: "/commande" },
      ],
    },
    {
      title: "Support",
      links: [
        { name: "Centre d'aide", path: "/support" },
        { name: "Guide d'installation", path: "/support#guides" },
        { name: "FAQ", path: "/support#faq" },
        { name: "Nous contacter", path: "/contact" },
      ],
    },
    {
      title: "Légal",
      links: [
        { name: "À propos", path: "/a-propos" },
        { name: "Conditions d'utilisation", path: "/conditions" },
        { name: "Politique de confidentialité", path: "/politique-confidentialite" },
        { name: "Mentions légales", path: "/mentions-legales" },
      ],
    },
  ];

  return (
    <footer className="relative bg-[#111d32] border-t border-white/[0.03]">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8">
          <div className="lg:col-span-2">
            <Link to="/" className="mb-6 inline-block">
              <Logo size={32} variant="full" />
            </Link>
            <p className="text-white/50 text-sm leading-relaxed mb-6 max-w-xs font-light">
              {SITE_CONFIG.description}
            </p>
            <div className="space-y-2.5">
              <a href={`https://wa.me/${SITE_CONFIG.whatsappNumber.replace(/[+\s]/g, "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-white/45 hover:text-[#6b7c5c] transition-colors text-sm font-light">
                <FiPhone className="w-4 h-4" /> WhatsApp : {SITE_CONFIG.whatsappNumber}
              </a>
              <a href={`mailto:${SITE_CONFIG.email}`} className="flex items-center gap-2.5 text-white/45 hover:text-[#6b7c5c] transition-colors text-sm font-light">
                <FiMail className="w-4 h-4" /> {SITE_CONFIG.email}
              </a>
              <div className="flex items-center gap-2.5 text-white/45 text-sm font-light">
                <FiMapPin className="w-4 h-4" /> {SITE_CONFIG.supportHours}
              </div>
            </div>
          </div>

          {linkGroups.map((group) => (
            <div key={group.title}>
              <h3 className="font-display font-medium text-white/50 text-xs tracking-[0.15em] uppercase mb-4">{group.title}</h3>
              <ul className="space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.path}>
                    <Link to={link.path} className="text-white/45 hover:text-[#6b7c5c] transition-colors text-sm font-light">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-white/[0.02] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/20 text-[10px] tracking-wide text-center sm:text-left">
            &copy; {SITE_CONFIG.year} {SITE_CONFIG.name}. Tous droits réservés.
          </p>
          <div className="flex items-center gap-2">
            {[FiFacebook, FiInstagram, FiTwitter, FiYoutube].map((Icon, i) => (
              <a key={i} href="#" className="w-7 h-7 flex items-center justify-center rounded-md text-white/25 hover:text-[#6b7c5c] transition-all duration-300 border border-white/[0.04]">
                <Icon className="w-3 h-3" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
