# Ciné Kin Premium

Landing page et tunnel de commande (via WhatsApp) pour un service IPTV, avec un
dashboard d'administration (commandes & clients) protégé par authentification.

## Stack technique

- **Frontend** : React 19 + TypeScript, Vite 7, React Router 7 (`BrowserRouter`), Tailwind CSS 3, Framer Motion, GSAP, Swiper
- **Backend** : Hono 4 (Node) + tRPC 11 + Zod 4
- **Base de données** : MySQL via Drizzle ORM (mode PlanetScale)
- **Auth** : OAuth2 « Kimi » (JWT `jose`, cookie de session `kimi_sid`)
- **Tests** : Vitest

## Prérequis

- Node.js 20+
- Une base MySQL accessible (chaîne de connexion `DATABASE_URL`)

## Installation

```bash
npm ci
```

## Variables d'environnement

Copier `.env.example` vers `.env` et renseigner les valeurs :

| Variable | Description |
|---|---|
| `APP_ID` | Identifiant d'application OAuth |
| `APP_SECRET` | Secret d'application (sert aussi à signer le JWT de session) |
| `DATABASE_URL` | Chaîne MySQL `mysql://user:pass@host:port/db` |
| `VITE_KIMI_AUTH_URL` | URL du serveur OAuth Kimi (exposée au navigateur) |
| `VITE_APP_ID` | Identifiant OAuth (exposé au navigateur) |
| `KIMI_AUTH_URL` | URL du serveur OAuth Kimi (backend) |
| `KIMI_OPEN_URL` | URL de la plateforme Kimi Open |
| `OWNER_UNION_ID` | Union ID du créateur ; ce compte reçoit le rôle `admin` à la 1ʳᵉ connexion |

> `.env` est ignoré par git. Ne jamais committer de secrets.

## Scripts

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur de dev (Vite + API Hono) sur le port 3000 |
| `npm run build` | Build frontend (`vite`) + bundle serveur (`esbuild`) dans `dist/` |
| `npm start` | Démarre le serveur de production (`NODE_ENV=production`) |
| `npm run check` | Vérification de types (`tsc -b`) |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |
| `npm test` | Tests Vitest |
| `npm run db:generate` | Génère les migrations Drizzle |
| `npm run db:migrate` | Applique les migrations |
| `npm run db:push` | Pousse le schéma vers la base |

## Structure

```
api/            Backend Hono + tRPC (routers, auth OAuth Kimi, accès DB)
db/             Schéma Drizzle, relations, seed
contracts/      Constantes/types partagés front ↔ back
src/            Application React
  components/   Composants UI (dont ui/ = shadcn)
  pages/        Pages routées
  hooks/        Hooks (auth, analytics…)
  providers/    Provider tRPC/React Query
public/         Assets statiques, sitemap.xml, robots.txt, service worker
```

## Déploiement

Le build produit `dist/public` (frontend statique) et `dist/boot.js` (serveur).
En production, le serveur Hono sert les fichiers statiques et fait le fallback
SPA vers `index.html`. Les migrations de base doivent être appliquées avant le
démarrage. L'intégration continue (`.github/workflows/ci.yml`) exécute
lint + typecheck + tests + build sur chaque pull request.
