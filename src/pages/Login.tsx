import { FiLogIn } from "react-icons/fi";
import Logo from "@/components/Logo";
import SEO from "@/components/SEO";

function getOAuthUrl() {
  const kimiAuthUrl = import.meta.env.VITE_KIMI_AUTH_URL;
  const appID = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${kimiAuthUrl}/api/oauth/authorize`);
  url.searchParams.set("client_id", appID);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "profile");
  url.searchParams.set("state", state);

  return url.toString();
}

export default function Login() {
  return (
    <div className="min-h-screen bg-[#0a1628] flex items-center justify-center px-6">
      <SEO title="Connexion Admin" description="Connectez-vous au dashboard d'administration Ciné Kin Premium" />

      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Logo size={48} variant="full" className="justify-center mb-6" />
          <h1 className="font-display font-bold text-2xl text-white mb-2">
            Espace Admin
          </h1>
          <p className="text-white/60 text-sm">
            Connectez-vous pour accéder au dashboard
          </p>
        </div>

        <div className="border border-white/[0.06] rounded-2xl p-8 bg-white/[0.02]">
          <button
            onClick={() => { window.location.href = getOAuthUrl(); }}
            className="w-full py-4 bg-[#5a6b4e] text-white font-semibold rounded-xl hover:bg-[#4d5d42] transition-all flex items-center justify-center gap-3 text-base"
          >
            <FiLogIn className="w-5 h-5" />
            Se connecter avec Kimi
          </button>

          <p className="text-white/55 text-xs text-center mt-6">
            Authentification sécurisée via OAuth 2.0
          </p>
        </div>

        <div className="text-center mt-6">
          <a
            href="/#/"
            className="text-white/55 hover:text-[#6b7c5c] text-sm transition-colors"
          >
            Retour à l'accueil
          </a>
        </div>
      </div>
    </div>
  );
}
