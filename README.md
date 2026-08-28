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
avant le build de production. Le build Vercel (`npm run vercel-build`)
**n'applique et n'appliquera jamais de migration** — il exécute uniquement
`vite build` puis l'assemblage `.vercel/output` : une preview ne doit jamais
pouvoir modifier une base partagée. La migration et son audit sont exécutés
séparément avec `npm run db:deploy` (ou `npm run db:migrate` seul), d'abord sur
staging, puis sur production dans une étape de release explicitement autorisée.
La migration précède toujours le déploiement du nouveau code, jamais l'inverse.

### Statut des plateformes

- **Render** est l'hébergeur de staging actuel de l'application.
- **Aiven** héberge la base MySQL de staging actuelle.
- **Vercel** est une cible de déploiement compatible et candidate, évaluée par
  ce dépôt — elle n'est **pas** la plateforme de production retenue tant
  qu'une décision explicite n'a pas été actée. Le build et le mode `vercel-build`
  documentés ici garantissent uniquement la compatibilité, pas un choix de
  plateforme.

### Ordre exact de la répétition puis de la mise en production

1. Test local des migrations (`npm run db:test-migrations`, base MySQL locale
   jetable).
2. `npm run staging:preflight` en lecture seule, qui doit confirmer que la
   base de restauration est bien vide (`empty`) avant toute écriture.
3. `STAGING_REHEARSAL_ALLOW_APPLY=1 npm run staging:rehearse -- --apply` :
   sauvegarde chiffrée de la source, restauration dans la base isolée,
   migration puis audit de cette copie.
4. Déploiement sur Render, pointé vers la base ainsi restaurée et migrée (pas
   avant — le code neuf ne doit jamais démarrer contre un schéma non migré).
5. Smoke tests (`npm run staging:smoke`) puis tests authentifiés (connexion,
   révocation de session, changement de mot de passe, etc.).

Détail complet : [`docs/staging-rehearsal-runbook.md`](docs/staging-rehearsal-runbook.md).

Pour reprendre une base créée auparavant avec `db:push`, suivre obligatoirement
[`docs/database-migration-runbook.md`](docs/database-migration-runbook.md) sur
une copie de staging avant la production. Ne plus utiliser `drizzle-kit push`
sur une base partagée ou de production.

L'intégration continue (`.github/workflows/ci.yml`) exécute lint, typecheck,
tests, build, E2E HTTP du build final et audit des dépendances de production
dans le job `ci` ; valide sur MySQL 8 une installation neuve et une mise à
niveau depuis le schéma historique dans le job `migrations` ; et exécute la
suite Playwright (connexion, déconnexion, non-rejeu d'un cookie volé) contre
le build réel et une base MySQL locale jetable dans le job `e2e-browser` —
toujours avec des secrets fictifs, jamais de connexion à Aiven, Render ou
Vercel.

Les sondes d'exploitation sont `GET /api/health/live` (processus) et
`GET /api/health/ready` (connexion MySQL réelle). Chaque réponse HTTP porte un
`X-Request-ID` corrélé aux logs JSON du serveur.

## Sessions et déconnexion (révocation)

Chaque session (admin, client, revendeur, Kimi) est un JWT signé contenant un
identifiant unique `jti`. La déconnexion enregistre ce `jti` dans la table
`revoked_auth_sessions` (liste de révocation) avant d'effacer le cookie ; toute
requête ultérieure porteuse de ce jeton est alors rejetée, même si le cookie
signé est encore techniquement valide.

Conséquences à connaître pour l'exploitation :

- **Jetons antérieurs à cette fonctionnalité** : un ancien cookie signé avant
  l'introduction du `jti` ne peut pas être révoqué individuellement ; il reste
  accepté jusqu'à son expiration naturelle. Le déploiement de cette
  fonctionnalité n'invalide donc pas rétroactivement les sessions déjà
  ouvertes le jour du déploiement — les nouveaux jetons émis après le
  déploiement portent tous un `jti` et bénéficient pleinement de la
  révocation. Un opérateur qui souhaite forcer une reconnexion unique et
  immédiate de tous les utilisateurs doit faire tourner `SESSION_SECRET` (voir
  ci-dessous), qui invalide tous les jetons, avec ou sans `jti`.
- **Session déjà révoquée** : une requête portant un cookie déjà révoqué
  (deuxième onglet, clic répété, déconnexion déclenchée ailleurs) reçoit
  `UNAUTHORIZED`. Le frontend traite explicitement ce cas comme une
  déconnexion déjà réussie — écran de connexion affiché, aucune erreur
  technique montrée à l'utilisateur — et ne le traite comme un échec réel que
  pour une erreur réseau ou serveur (5xx).
- **Cookie encore présent après déconnexion** : le navigateur peut conserver
  l'ancien cookie `HttpOnly` en mémoire jusqu'à son remplacement ou son
  expiration naturelle ; cela ne lui redonne aucun privilège, puisque la
  vérification côté serveur consulte systématiquement la liste de révocation.
- **`revoked_auth_sessions` ne doit jamais être supprimée lors d'un retour
  arrière.** Une suppression de cette table réactiverait tous les jetons
  révoqués qu'elle contenait — une régression de sécurité. Le retour arrière
  privilégie toujours la remise en avant (« fix-forward ») ; voir
  [`docs/database-migration-runbook.md`](docs/database-migration-runbook.md#retour-arrière).
- **Rotation de `SESSION_SECRET`** : réservée à un incident réel nécessitant
  l'invalidation complète de toutes les sessions (compromission suspectée du
  secret, par exemple). Elle invalide immédiatement les quatre types de
  session pour tous les utilisateurs et force une reconnexion générale — ce
  n'est pas une opération de routine.
