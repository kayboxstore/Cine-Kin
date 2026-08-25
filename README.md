# Ciné Kin Premium

Landing page et tunnel de commande (via WhatsApp) pour un service IPTV, avec un
dashboard d'administration (commandes & clients) protégé par authentification.

## Stack technique

- **Frontend** : React 19 + TypeScript, Vite 7, React Router 7 (`BrowserRouter`), Tailwind CSS 3, Framer Motion, Swiper
- **Backend** : Hono 4 (Node) + tRPC 11 + Zod 4
- **Base de données** : MySQL via Drizzle ORM (mode PlanetScale)
- **Auth** : OAuth2 « Kimi » avec `state` lié au navigateur et PKCE S256, plus connexion administrateur par mot de passe
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

| Variable            | Description                                                                |
| ------------------- | -------------------------------------------------------------------------- |
| `APP_ID`            | Identifiant d'application OAuth                                            |
| `APP_SECRET`        | Secret client OAuth uniquement                                             |
| `APP_BASE_URL`      | Origine HTTPS canonique utilisée pour le callback OAuth                    |
| `VITE_SITE_URL`     | Origine HTTPS injectée au build dans canonical, réseaux sociaux et sitemap |
| `SESSION_SECRET`    | Secret dédié à la signature des sessions et transactions OAuth             |
| `ENCRYPTION_KEY`    | Clé dédiée au chiffrement AES-GCM des identifiants de playlists            |
| `ADMIN_PASSWORD`    | Mot de passe administrateur alternatif, optionnel                          |
| `DATABASE_URL`      | Chaîne MySQL `mysql://user:pass@host:port/db`                              |
| `KIMI_AUTH_URL`     | URL du serveur OAuth Kimi (backend)                                        |
| `KIMI_OPEN_URL`     | URL de la plateforme Kimi Open                                             |
| `KIMI_TOKEN_ISSUER` | Émetteur exact attendu dans les jetons Kimi, si documenté                  |
| `KIMI_OAUTH_PKCE`   | Active PKCE S256 ; conserver `true` sauf incompatibilité prouvée           |
| `OWNER_UNION_ID`    | Union ID du créateur ; ce compte reçoit le rôle `admin` à la 1ʳᵉ connexion |
| `TRUST_PROXY`       | Autorise les en-têtes proxy uniquement derrière un proxy maîtrisé          |
| `TRUST_PROXY_HOPS`  | Nombre de sauts proxy de confiance                                         |
| `RATE_LIMIT_STORE`  | `database` en production pour partager les compteurs entre instances       |

> `.env` est ignoré par git. Ne jamais committer de secrets.

`APP_SECRET`, `SESSION_SECRET` et `ENCRYPTION_KEY` doivent être trois valeurs
différentes. En production, les deux dernières doivent compter au moins 32
caractères. Une valeur aléatoire peut être générée avec :

```bash
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

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
| `npm run e2e:public`         | Démarre et contrôle réellement le build public final              |
| `npm run db:generate`        | Génère les migrations Drizzle                                     |
| `npm run db:check`           | Vérifie la cohérence de l’historique des migrations               |
| `npm run db:migrate`         | Applique les migrations                                           |
| `npm run db:deploy`          | Migre puis audite une base pendant une release contrôlée          |
| `npm run db:adopt`           | Contrôle/adopte une ancienne base non suivie par Drizzle          |
| `npm run db:audit`           | Audite le schéma et le registre de crédits après migration        |
| `npm run db:test-migrations` | Test destructif réservé à la base MySQL locale de CI              |
| `npm run staging:preflight`  | Valide les cibles et garde-fous de la répétition de staging       |
| `npm run staging:rehearse`   | Sauvegarde, restaure, migre et audite une copie isolée            |
| `npm run staging:smoke`      | Vérifie les parcours HTTP publics du déploiement de staging       |

## Structure

```
server/         Backend Hono + tRPC (routers, auth OAuth Kimi, accès DB)
db/             Schéma, relations et migrations Drizzle versionnées
contracts/      Constantes/types partagés front ↔ back
src/            Application React
  components/   Composants UI (dont ui/ = shadcn)
  pages/        Pages routées
  hooks/        Hooks applicatifs (auth, mobile, notifications…)
  providers/    Provider tRPC/React Query
public/         Assets statiques, sitemap.xml, robots.txt, service worker
```

## Déploiement

Le build produit `dist/public` (frontend statique) et `dist/boot.js` (serveur).
En production, le serveur Hono sert les fichiers statiques et fait le fallback
SPA vers `index.html`. `VITE_SITE_URL` est validée puis injectée dans le HTML,
`robots.txt` et `sitemap.xml` pendant ce build ; elle doit donc être définie
avant le build de production. Le build Vercel **n'applique plus de migration** :
une preview ne doit jamais pouvoir modifier une base partagée. La migration et
son audit sont exécutés séparément avec `npm run db:deploy`, d'abord sur
staging, puis sur production dans une étape de release explicitement autorisée.

Pour reprendre une base créée auparavant avec `db:push`, suivre obligatoirement
[`docs/database-migration-runbook.md`](docs/database-migration-runbook.md) sur
une copie de staging avant la production. Ne plus utiliser `drizzle-kit push`
sur une base partagée ou de production.

La répétition complète — sauvegarde chiffrée, restauration dans une base vide,
migration, audit et smoke tests — est décrite dans
[`docs/staging-rehearsal-runbook.md`](docs/staging-rehearsal-runbook.md).

L'intégration continue (`.github/workflows/ci.yml`) exécute lint, typecheck,
tests, build et E2E HTTP du build final, puis valide sur MySQL 8 une installation
neuve et une mise à niveau depuis le schéma historique.

Les sondes d'exploitation sont `GET /api/health/live` (processus) et
`GET /api/health/ready` (connexion MySQL réelle). Chaque réponse HTTP porte un
`X-Request-ID` corrélé aux logs JSON du serveur.
