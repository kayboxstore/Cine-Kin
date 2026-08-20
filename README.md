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

| Variable             | Description                                                                |
| -------------------- | -------------------------------------------------------------------------- |
| `APP_ID`             | Identifiant d'application OAuth                                            |
| `APP_SECRET`         | Secret d'application (sert aussi à signer le JWT de session)               |
| `DATABASE_URL`       | Chaîne MySQL `mysql://user:pass@host:port/db`                              |
| `VITE_KIMI_AUTH_URL` | URL du serveur OAuth Kimi (exposée au navigateur)                          |
| `VITE_APP_ID`        | Identifiant OAuth (exposé au navigateur)                                   |
| `KIMI_AUTH_URL`      | URL du serveur OAuth Kimi (backend)                                        |
| `KIMI_OPEN_URL`      | URL de la plateforme Kimi Open                                             |
| `OWNER_UNION_ID`     | Union ID du créateur ; ce compte reçoit le rôle `admin` à la 1ʳᵉ connexion |

> `.env` est ignoré par git. Ne jamais committer de secrets.

## Scripts

| Commande                     | Rôle                                                              |
| ---------------------------- | ----------------------------------------------------------------- |
| `npm run dev`                | Serveur de dev (Vite + API Hono) sur le port 3000                 |
| `npm run build`              | Build frontend (`vite`) + bundle serveur (`esbuild`) dans `dist/` |
| `npm start`                  | Démarre le serveur de production (`NODE_ENV=production`)          |
| `npm run check`              | Vérification de types (`tsc -b`)                                  |
| `npm run lint`               | ESLint                                                            |
| `npm run format`             | Prettier                                                          |
| `npm test`                   | Tests Vitest                                                      |
| `npm run db:generate`        | Génère les migrations Drizzle                                     |
| `npm run db:check`           | Vérifie la cohérence de l’historique des migrations               |
| `npm run db:migrate`         | Applique les migrations                                           |
| `npm run db:adopt`           | Contrôle/adopte une ancienne base non suivie par Drizzle          |
| `npm run db:audit`           | Audite le schéma et le registre de crédits après migration        |
| `npm run db:test-migrations` | Test destructif réservé à la base MySQL locale de CI              |

## Structure

```
server/         Backend Hono + tRPC (routers, auth OAuth Kimi, accès DB)
db/             Schéma, relations et migrations Drizzle versionnées
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
SPA vers `index.html`. Les migrations versionnées sont appliquées pendant le
build Vercel quand `DATABASE_URL` est configurée. Le build refuse volontairement
une ancienne base sans historique afin d'empêcher une migration implicite.

Pour reprendre une base créée auparavant avec `db:push`, suivre obligatoirement
[`docs/database-migration-runbook.md`](docs/database-migration-runbook.md) sur
une copie de staging avant la production. Ne plus utiliser `drizzle-kit push`
sur une base partagée ou de production.

L'intégration continue (`.github/workflows/ci.yml`) exécute lint, typecheck,
tests et build, puis valide sur MySQL 8 une installation neuve et une mise à
niveau depuis le schéma historique.
