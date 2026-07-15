# Audit technique — Ciné Kin Premium

**Date de l'audit :** 15 juillet 2026
**Portée :** intégralité du dépôt (`main` / commit `c0fc833`)
**Méthodologie :** revue statique complète du code source, des dépendances (`package.json`, `package-lock.json`), de la configuration de build, et `npm audit` sur le lock file. Aucune base de données de production ni environnement live n'était disponible pour ce test.

---

## 0. Vue d'ensemble de la stack technique

| Couche | Technologie |
|---|---|
| Frontend | React 19 + TypeScript (strict), Vite 7, React Router 7 (mode `HashRouter`) |
| UI | Tailwind CSS 3, Radix UI / shadcn (40+ composants générés, la plupart inutilisés), Framer Motion, GSAP, Swiper |
| Backend | Hono 4 (serveur Node via `@hono/node-server`), tRPC 11, Zod 4 |
| ORM / DB | Drizzle ORM (dialecte MySQL / PlanetScale) |
| Auth | OAuth2 "Kimi" (JWT via `jose`, cookie de session `kimi_sid`) |
| Build/Deploy | `vite build` + `esbuild` pour le serveur, pas de Dockerfile, pas de CI/CD (`.github/` absent) |
| Tests | Vitest configuré mais **0 fichier de test présent** |

Le site est une landing page IPTV (« Ciné Kin Premium ») avec un tunnel de commande piloté par WhatsApp, et un dashboard admin (`/admin`) branché sur une vraie base de données via tRPC pour gérer commandes et clients.

---

## 1. Résumé exécutif — Notes par domaine

| Domaine | Note /10 | Verdict |
|---|---|---|
| Architecture & qualité du code | 6/10 | Structure propre, mais dette (code mort, incohérences de design system, dépendances inutilisées) |
| **Sécurité** | **2/10** | **Faille critique de contrôle d'accès sur toute l'API admin — bloquant pour la mise en production** |
| Performance | 6/10 | Bon réflexe de lazy-loading des routes, mais page d'accueil lourde et images non optimisées |
| Accessibilité (WCAG 2.1 AA) | 4/10 | Contrastes très faibles généralisés, gestion clavier/focus incomplète, pas de `prefers-reduced-motion` sur les animations JS |
| SEO technique | 5/10 | Bonnes bases (meta, JSON-LD, sitemap) mais incohérences de domaine et `HashRouter` nuisible au SEO |
| UX/UI | 6/10 | Cohérent visuellement, mais dark patterns (faux compteurs, avis fictifs) et incohérence de charte sur `/paiement` |
| Tests & fiabilité | 1/10 | Aucun test écrit malgré l'outillage en place |
| Déploiement & CI/CD | 2/10 | Aucun pipeline CI/CD, aucune vérification automatique avant merge/déploiement |

**Moyenne globale : 4/10 — Le projet n'est pas prêt pour la production en l'état, principalement à cause de la faille de sécurité critique en section 2.1.**

---

## 2. Sécurité

### 2.1 🔴 CRITIQUE — API admin totalement dépourvue d'authentification/autorisation

**Fichiers :** `api/admin-router.ts` (lignes 17-158), `api/middleware.ts` (ligne 42)

Le middleware `adminQuery` (qui exige `ctx.user.role === "admin"`) est bien défini et exporté dans `api/middleware.ts:42` :
```ts
export const adminQuery = authedQuery.use(requireRole("admin"));
```
**Mais il n'est utilisé nulle part.** Toutes les procédures de `adminRouter` sont déclarées avec `publicQuery` (aucune vérification d'identité) :

```ts
// api/admin-router.ts
orderList: publicQuery.query(...)          // ligne 19
orderCreate: publicQuery...mutation(...)   // ligne 25
orderUpdateStatus: publicQuery...          // ligne 52
orderDelete: publicQuery...                // ligne 67
customerList: publicQuery.query(...)       // ligne 93
customerCreate: publicQuery...             // ligne 99
customerUpdateStatus: publicQuery...       // ligne 124
customerDelete: publicQuery...             // ligne 139
```

**Impact concret :** n'importe qui sur Internet peut, sans authentification, sans cookie, sans compte :
- lister l'intégralité des clients (nom, email, téléphone) via `POST /api/trpc/admin.customerList` ;
- lister toutes les commandes et leurs codes d'activation via `admin.orderList` ;
- **supprimer** toutes les commandes et tous les clients (`admin.orderDelete`, `admin.customerDelete`) ;
- créer un nombre illimité de fausses commandes/clients (spam de la base, DoS applicatif) via `admin.orderCreate` / `admin.customerCreate`.

Le contrôle « Accès refusé » visible dans `src/pages/Dashboard.tsx` (lignes 81-97) n'est qu'un garde-fou **côté client** — purement cosmétique — puisque l'API elle-même n'impose rien. Un simple `curl` sur `/api/trpc/admin.customerList` suffit à exfiltrer toute la base clients (PII : noms, emails, téléphones).

**Recommandation (bloquant avant mise en production) :**
```ts
// api/admin-router.ts
export const adminRouter = createRouter({
  orderList: adminQuery.query(async () => { ... }),
  orderCreate: adminQuery.input(...).mutation(...),
  // etc. — remplacer TOUTES les occurrences de publicQuery par adminQuery
});
```
Ajouter un test (actuellement absent, voir section 7) qui vérifie qu'un appel non authentifié à chaque procédure admin échoue avec `FORBIDDEN`/`UNAUTHORIZED`.

### 2.2 🟠 Élevée — Aucun rate limiting sur les endpoints tRPC

**Fichier :** `api/boot.ts` (lignes 15-22)

Aucun middleware de rate limiting n'encadre `/api/trpc/*`. Combiné au point 2.1, `admin.orderCreate` (public, sans CAPTCHA ni validation métier) permet un flood illimité d'insertions en base. Même une fois 2.1 corrigé, `auth`-related endpoints et le futur formulaire de contact mériteraient une limite (ex. `hono-rate-limiter` ou un reverse-proxy avec throttling).

### 2.3 🟠 Élevée — Absence totale de headers de sécurité HTTP

**Fichier :** `api/boot.ts`

Aucun header `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` ou `Strict-Transport-Security` n'est positionné. Le site est donc plus exposé au clickjacking et au MIME-sniffing. Recommandation : ajouter `hono/secure-headers` :
```ts
import { secureHeaders } from "hono/secure-headers";
app.use(secureHeaders());
```

### 2.4 🟡 Moyenne — Cookie de session valable 1 an

**Fichiers :** `contracts/constants.ts` (ligne 3), `api/kimi/session.ts` (ligne 14)

`Session.maxAgeMs = 365 * 24 * 60 * 60 * 1000` et le JWT est signé avec `.setExpirationTime("1 year")`. Une session admin volée (XSS, appareil partagé, cookie leak) reste valide un an sans aucun mécanisme de révocation (pas de liste de révocation, pas de rotation). Recommandation : réduire la durée de vie (7-30 jours) avec renouvellement silencieux (refresh), et ajouter un moyen de révoquer une session côté serveur.

### 2.5 🟡 Moyenne — `SameSite=None` en production sans vérification supplémentaire

**Fichier :** `api/lib/cookies.ts` (lignes 8-17)

En production, le cookie de session est posé avec `sameSite: "None"` (ligne 14) dès que le host n'est pas `localhost`. C'est nécessaire si frontend et backend Kimi sont sur des domaines différents, mais cela affaiblit la protection CSRF native de `SameSite=Lax`. Aucune protection CSRF explicite (double-submit token, vérification d'origine) n'est présente pour compenser — à vérifier/ajouter si le flux OAuth le permet.

### 2.6 🟢 Faible — Pas de secrets en dur dans le code

Point positif : `.env` est bien ignoré par git (`.gitignore` ligne 14), `.env.example` ne contient aucune valeur réelle, et aucun secret n'apparaît dans l'historique git (commit unique, recherche ciblée négative). L'ID Google Analytics est un placeholder (`G-XXXXXXXXXX`, `index.html:39` et `src/hooks/useAnalytics.ts:5`) donc pas de fuite, mais cela signifie aussi que **le tracking analytics ne fonctionne pas du tout** (voir section 5).

### 2.7 🟡 Moyenne — Dépendances avec vulnérabilités connues

`npm audit --package-lock-only` rapporte **15 vulnérabilités (6 élevées, 8 modérées, 1 faible)**, concentrées sur la toolchain de build/dev :

| Paquet | Sévérité | Détail |
|---|---|---|
| `vite` (7.0.0–7.3.4) | Élevée | Path traversal / lecture arbitraire de fichiers via le dev server WebSocket (GHSA-p9ff-h696-f583), bypass de `server.fs.deny` (GHSA-v2wj-q39q-566r) |
| `rollup` | Élevée | Écriture arbitraire de fichiers via path traversal (GHSA-mw96-cpmx-2vgc) |
| `esbuild` (via `drizzle-kit`) | Modérée | Chaîne `@esbuild-kit/*` obsolète |
| `lodash` | Élevée | Injection de code via `_.template`, prototype pollution (`_.unset`/`_.omit`) |
| `minimatch`, `picomatch` | Élevée | ReDoS (déni de service par expression régulière) |
| `flatted` | Élevée | DoS par récursion non bornée + prototype pollution |

La plupart sont des dépendances **de build/dev**, donc le risque en production runtime est limité, mais elles exposent l'environnement de développement (dev server Vite accessible = lecture de fichiers arbitraire). **Action :** `npm audit fix` pour les correctifs non-cassants, puis migrer `drizzle-kit` vers une version majeure récente (`npm audit fix --force` avec tests de non-régression, car `fixAvailable` indique un changement majeur pour `drizzle-kit`).

---

## 3. Architecture & qualité du code

### 3.1 🟠 Élevée — Code mort massif : composants jamais importés

Recherche exhaustive des imports confirmant que ces composants existent mais ne sont référencés **nulle part** dans l'application :
- `src/components/ExitIntentPopup.tsx` (121 lignes)
- `src/components/AnnouncementBar.tsx`
- `src/components/QuickOrderButton.tsx` + `src/components/QuickOrderModal.tsx` (107 lignes)
- `src/components/CustomCursor.tsx`
- `src/components/ParticleBackground.tsx` (103 lignes)
- `src/components/OrderCounter.tsx`
- `src/components/CountdownTimer.tsx`
- `src/components/AuthLayout.tsx` (266 lignes) + `src/components/AuthLayoutSkeleton.tsx`

Cela représente près de 1 000 lignes de code non branché, source de confusion pour toute personne qui reprend le projet (« est-ce que ce composant est utilisé ? »). **Recommandation :** supprimer ou brancher explicitement (ex. `ExitIntentPopup` semble avoir été prévu pour `Layout.tsx` — son absence est probablement un oubli, voir 6.1).

### 3.2 🟡 Moyenne — Dépendances déclarées mais jamais utilisées

`zustand` (state management) et `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` (`package.json` lignes 20-21, 89) figurent dans les dépendances de production mais aucun import n'existe dans `src/` ou `api/`. Ces deux paquets AWS SDK sont volumineux (des centaines de sous-dépendances, comme le montre `npm audit`) et n'apportent rien tant qu'ils ne sont pas utilisés. **Recommandation :** `npm uninstall zustand @aws-sdk/client-s3 @aws-sdk/s3-request-presigner` ou les intégrer si un usage (upload d'image ?) était prévu.

### 3.3 🟡 Moyenne — Deux systèmes de design incompatibles coexistent

`src/pages/Paiement.tsx` utilise des classes CSS (`text-gradient-cyan`, `glass-card`, `bg-dark-950`, `grid-pattern`) issues d'une ancienne palette cyan/violet (encore présente dans `src/index.css` lignes 90-243 et `tailwind.config.js` lignes 45-96), alors que **tout le reste du site** (Home, Navbar, Footer, etc.) utilise la palette « bleu de nuit / vert olive » (`#0a1628`, `#5a6b4e`) codée en dur dans les classes Tailwind arbitraires (`bg-[#0a1628]`). Résultat : la page `/paiement` est visuellement incohérente avec le reste du site (thème cyan futuriste au milieu d'un site vert olive élégant). **Recommandation :** soit migrer `Paiement.tsx` vers la palette olive, soit supprimer les classes cyan mortes de `index.css`/`tailwind.config.js` si elles ne servent qu'à cette page.

### 3.4 🟡 Moyenne — Duplication : `NAV_LINKS` défini deux fois

`src/data/siteData.ts` (lignes 476-482) et `src/components/Navbar.tsx` (lignes 8-14) définissent chacun leur propre tableau `NAV_LINKS` avec un contenu différent (le premier a 5 entrées incluant "Support", le second en a 5 mais avec "Tutoriels" et "Contact" à la place). Cela crée une incertitude sur la navigation réelle du site et un risque de divergence silencieuse. **Recommandation :** une seule source de vérité dans `siteData.ts`, importée par `Navbar.tsx`.

### 3.5 🟢 Faible — TypeScript strict bien configuré

Point positif : `tsconfig.app.json` active `strict`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch` — bonne rigueur. Cependant, sans CI (section 8), rien ne garantit que `tsc -b` (script `check`) est exécuté avant chaque commit/merge.

### 3.6 🟢 Faible — Fragments JSX vides et formatage incohérent

`src/pages/Contact.tsx` (lignes 15-20) et `src/pages/Revendeurs.tsx` (lignes 46-50) contiennent des lignes vides et des `<div>` wrapper superflus autour du JSX (probablement un artefact de génération). Sans impact fonctionnel, mais nuit à la lisibilité.

---

## 4. Performance

### 4.1 🟠 Élevée — Page d'accueil non code-splittée, chargée avec toutes ses dépendances lourdes

**Fichier :** `src/App.tsx` (ligne 5 : `import Home from "./pages/Home"` — import statique, pas de `lazy()`)

`Home.tsx` (629 lignes) importe en cascade des composants qui embarquent des librairies lourdes **dans le bundle principal** (non lazy) :
- `ParallaxHero` → `gsap` + `gsap/ScrollTrigger` (`src/components/ParallaxHero.tsx:2-3`)
- `TestimonialCarousel` → `swiper/react` + CSS Swiper (`src/components/TestimonialCarousel.tsx:1,5-6`)
- `framer-motion` utilisé quasiment partout

Toutes les autres routes (`Offres`, `Revendeurs`, etc.) sont bien en `lazy()` (`src/App.tsx` lignes 11-27) — bon réflexe — mais la route `/` (la plus visitée, donc la plus critique pour les Core Web Vitals) charge tout en un seul chunk synchrone. **Recommandation :** `lazy()`-ifier au minimum `TestimonialCarousel` (Swiper) et `ParallaxHero` (GSAP) avec `React.lazy` + `Suspense`, ou les charger seulement quand ils entrent dans le viewport (déjà fait pour les images via `LazyImage`, à généraliser).

### 4.2 🟡 Moyenne — Images non optimisées, pas de format moderne

**Dossier :** `public/images/`

Toutes les images sont en `.jpg` (aucune en WebP/AVIF), sans variantes responsive (`srcset`) et sans dimensions explicites (`width`/`height`) sur les balises `<img>` (vérifié dans `Home.tsx:264-268`, `Gallery.tsx:116-119`, etc.), ce qui provoque du **layout shift (CLS)** pendant le chargement. Le logo `public/images/logo-main.png` pèse **964 Ko** pour une icône de navbar de 32px — un poids totalement disproportionné (`src/components/Logo.tsx`, `Navbar.tsx:73`). **Recommandation :**
- Convertir toutes les images en WebP/AVIF (`vite-imagetools` ou pré-traitement).
- Fixer `width`/`height` sur chaque `<img>`.
- Réduire `logo-main.png` à une taille proportionnée à son usage (viser < 20 Ko).

### 4.3 🟡 Moyenne — Police Google Fonts chargée en synchrone bloquant le rendu

**Fichier :** `src/index.css` ligne 1
```css
@import url('https://fonts.googleapis.com/css2?family=Outfit:...&family=Inter:...&display=swap');
```
Un `@import` CSS externe bloque le rendu (attend la résolution DNS + téléchargement avant de peindre). `index.html` fait bien du `preconnect`/`dns-prefetch` (lignes 33-36) vers `fonts.googleapis.com`, mais l'`@import` CSS lui-même reste une régression de performance par rapport à un `<link rel="stylesheet">` dans le `<head>`. **Recommandation :** déplacer le chargement de police dans `index.html` via `<link rel="preload" as="style">` + fallback, ou auto-héberger les fontes (`@fontsource/outfit`, `@fontsource/inter`) pour supprimer la dépendance réseau externe.

### 4.4 🟡 Moyenne — `setInterval` permanents sur la page d'accueil

**Fichiers :** `src/components/LiveVisitors.tsx` (ligne 8, toutes les 4s), `src/components/FOMOCounter.tsx` (ligne 9, toutes les 5s)

Ces deux composants font tourner un `setInterval` en continu tant que l'utilisateur reste sur la page (ils sont bien nettoyés au démontage via `clearInterval`, ce qui est correct), mais génèrent des re-renders React inutiles en permanence pour simuler un compteur « live ». Impact mineur sur la batterie mobile / CPU en usage prolongé.

### 4.5 🟢 Faible — Bon usage du Service Worker et de l'`IntersectionObserver`

Points positifs : `public/service-worker.js` implémente une stratégie cache-first raisonnable avec exclusion explicite de `/api/*` (ligne 43), et `src/components/LazyImage.tsx` utilise `IntersectionObserver` avec `rootMargin: "200px"` pour différer le chargement des images hors-écran — bonne pratique.

---

## 5. Accessibilité (WCAG 2.1 AA)

### 5.1 🟠 Élevée — Contrastes de texte systématiquement trop faibles

Le site utilise massivement des opacités de blanc très basses sur fond sombre `#0a1628` : `text-white/30`, `text-white/35`, `text-white/40`, `text-white/45` sont omniprésents (ex. `src/pages/Home.tsx:117`, `224`, `276`, `343`, etc. — des dizaines d'occurrences dans tout `src/pages` et `src/components`). Un blanc à 30-40% d'opacité sur un fond `#0a1628` donne un ratio de contraste largement **sous le seuil WCAG AA de 4.5:1** pour le texte normal (souvent autour de 2:1-3:1). Cela affecte la lisibilité pour les utilisateurs malvoyants et échouerait un audit Lighthouse/axe. **Recommandation :** remonter le plancher d'opacité du texte secondaire à `/60` minimum, ou définir des tokens de couleur avec un ratio vérifié (ex. via un outil comme le contrast-checker de WebAIM) plutôt que des opacités arbitraires.

### 5.2 🟠 Élevée — Aucune prise en compte de `prefers-reduced-motion` pour les animations JS

**Fichier :** `src/App.css` ligne 30 — une seule règle `@media (prefers-reduced-motion: no-preference)` existe, mais elle ne couvre que les animations CSS pures. Or l'immense majorité des animations du site passent par **Framer Motion** (`motion.div`, `AnimatePresence` dans quasiment tous les composants) et **GSAP** (`ParallaxHero.tsx`), qui ignorent totalement ce média-query. Les utilisateurs ayant activé « Réduire les animations » dans leur OS (utile pour les troubles vestibulaires) subissent donc toutes les animations de scroll, de parallax et de transition de page. **Recommandation :** utiliser `useReducedMotion()` de Framer Motion pour désactiver/simplifier les variantes d'animation, et vérifier `window.matchMedia('(prefers-reduced-motion: reduce)')` avant d'initialiser GSAP ScrollTrigger.

### 5.3 🟡 Moyenne — Navigation clavier incomplète sur les éléments interactifs personnalisés

Plusieurs éléments cliquables custom n'ont pas d'attribut `aria-label` ni de gestion `onKeyDown` explicite au-delà du `<button>` natif : par exemple les cartes de plans dans `src/pages/Commande.tsx` (lignes 70-95) sont des `<button>` (bon point, focusables nativement), mais le lightbox de `src/components/Gallery.tsx` (lignes 94-127) ne piège pas le focus (« focus trap ») dans la modale et ne se ferme pas au `Escape`. Idem pour `src/components/ExitIntentPopup.tsx` (composant actuellement mort, voir 3.1) et `src/components/QuickOrderModal.tsx`.

### 5.4 🟡 Moyenne — Curseur personnalisé accessibilité-hostile (composant mort, mais à corriger s'il est réactivé)

`src/components/CustomCursor.tsx` remplace le curseur natif — ce pattern casse généralement l'accessibilité pour les utilisateurs de trackpad/stylet et n'a pas de fallback `prefers-reduced-motion`/`pointer: coarse`. Comme il n'est actuellement importé nulle part (section 3.1), il n'a pas d'impact réel, mais ne doit pas être réactivé sans révision.

### 5.5 🟢 Faible — Bonnes pratiques déjà en place

Points positifs : les images décoratives ont `alt=""` correctement vide (`src/pages/APropos.tsx:43`, `src/pages/Revendeurs.tsx:59`), le `<nav>` de fil d'Ariane a `aria-label="Breadcrumb"` (`src/components/Breadcrumbs.tsx:27`), `<html lang="fr">` est bien déclaré (`index.html:2`), et le formulaire de contact utilise des `<label>` associés à leurs champs (`src/pages/Contact.tsx:89-116`).

---

## 6. SEO technique

### 6.1 🟠 Élevée — Incohérence de domaine entre les métadonnées et `robots.txt`/`sitemap.xml`

`index.html` (lignes 14, 17) et `src/components/SchemaOrg.tsx` (ligne 4) déclarent le domaine canonique `https://cinekinpremium.com`, alors que `public/robots.txt` (ligne 4) et `public/sitemap.xml` (toutes les URLs) pointent vers `https://7a5czmte3r3ri.kimi.page`. Un moteur de recherche qui croise ces signaux verra une incohérence entre l'URL canonique déclarée en Open Graph et celle du sitemap réellement soumis — cela peut nuire à l'indexation ou dupliquer le contenu indexé sous deux domaines. **Recommandation :** aligner toutes les références sur le domaine de production réel avant mise en ligne.

### 6.2 🟠 Élevée — `HashRouter` : URLs en `/#/route`, mauvaises pour le SEO

**Fichier :** `src/main.tsx` ligne 23 (`<HashRouter>`)

Toutes les routes internes sont de la forme `https://site.com/#/offres`. Google indexe généralement mal les fragments `#` (chaque URL avec ancre différente n'est historiquement pas traitée comme une page distincte par tous les crawlers, et beaucoup d'outils SEO/analytics tiers ignorent la partie après `#`). Le `sitemap.xml` lui-même liste des URLs en `/#/offres` (ligne 9), ce qui est un signal d'alerte : Google Search Console traitera probablement mal ces entrées. **Recommandation :** migrer vers `BrowserRouter` (le backend Hono sert déjà `index.html` en fallback SPA via `serveStaticFiles`, `api/lib/vite.ts:14-22` — donc l'infrastructure supporte déjà des routes propres côté serveur) ce qui nécessite de retirer le hash et de configurer le fallback correctement, ce qui est déjà fait côté API.

### 6.3 🟡 Moyenne — Contenu SPA rendu uniquement côté client (pas de SSR/prerendering)

Le site est 100% CSR (`createRoot(...).render(...)`, `src/main.tsx:19`), sans SSR ni prerendering statique. Pour un site dont l'objectif principal est l'acquisition organique (« IPTV », mots-clés compétitifs), cela pénalise le temps avant indexation du contenu textuel et le SEO par rapport à une solution SSR/SSG (Next.js, Astro, ou prerendering via `vite-plugin-prerender`). Impact modéré car les moteurs modernes exécutent le JS, mais toujours inférieur au rendu serveur pour le budget de crawl.

### 6.4 🟡 Moyenne — Balises `<title>`/`<meta description>` dupliquées entre `index.html` et `<SEO>`

`index.html` (lignes 7, 47) définit déjà un titre et une description statiques pour le HTML initial. `src/components/SEO.tsx` les réécrit ensuite côté client via `react-helmet-async`. Pour un crawler qui ne rendrait que le HTML statique (ou lors d'un partage sur réseau social avant hydratation), c'est le titre générique de `index.html` qui serait vu — cohérent pour la home mais jamais mis à jour pour les autres pages avant hydratation JS. Sans SSR (6.3), ce n'est pas critique mais reste un point de vigilance pour l'Open Graph (les crawlers de Facebook/Twitter n'exécutent généralement pas le JS).

### 6.5 🟢 Faible — Bonnes pratiques déjà en place

Points positifs solides : JSON-LD structuré complet (`Organization`, `Service`, `WebSite` dans `src/components/SchemaOrg.tsx`), balises Open Graph et Twitter Card présentes et correctement dupliquées par page via `<SEO>`, `sitemap.xml` et `robots.txt` existent et sont référencés correctement l'un dans l'autre.

---

## 7. UX/UI

### 7.1 🟡 Moyenne — Chiffres et avis potentiellement trompeurs (dark patterns)

Plusieurs composants affichent des statistiques « live » entièrement fictives et randomisées côté client, sans lien avec une donnée réelle :
- `src/components/LiveVisitors.tsx` (ligne 5) : compteur de visiteurs qui varie aléatoirement entre 5 et 28.
- `src/components/FOMOCounter.tsx` (lignes 22-23) : « 47-62 personnes en ligne », « 128 commandes aujourd'hui » (valeur statique codée en dur), « 12 places restantes ».
- `src/components/TrustBadgeReviews.tsx` (lignes 7, 67-70) : note moyenne « 4.8/5 sur 2 847 avis » et « 12 400+ clients satisfaits » sans aucune source de données réelle.
- `src/components/PressSection.tsx` (lignes 4-30) : logos de presse fictifs (« TechAfrica », « Digital Mag », « Stream Weekly »…) avec citations inventées et dates dans le futur (« Juin 2026 », alors que la date d'audit est le 15 juillet 2026 — dates pas encore advenues au moment de la rédaction de ce contenu selon le contexte du projet).

Ce sont des techniques de "social proof" fabriquées, potentiellement problématiques du point de vue légal (pratiques commerciales trompeuses, cf. droit de la consommation français/européen si le site cible des utilisateurs FR/UE) et du point de vue de la confiance utilisateur si découvertes. **Recommandation :** remplacer par de vraies données (nombre de commandes en base via l'API, vrais avis collectés) ou retirer ces éléments.

### 7.2 🟡 Moyenne — Incohérence de charte graphique sur `/paiement`

Déjà signalé en 3.3 — du point de vue UX pur, un utilisateur qui arrive sur `/paiement` depuis `/commande` bascule brutalement d'un thème vert olive élégant à un thème cyan/violet « gaming », ce qui casse la continuité perçue du parcours d'achat, une étape sensible où la confiance visuelle compte particulièrement.

### 7.3 🟡 Moyenne — Formulaires qui ne soumettent nulle part

`src/pages/Contact.tsx` (ligne 13) et `src/pages/Revendeurs.tsx` (ligne 42) : `handleSubmit` fait `e.preventDefault()` puis `setSubmitted(true)` — **aucun appel réseau, aucun envoi d'email, aucune écriture en base**. L'utilisateur voit un message de succès « Message envoyé ! » alors que rien n'a été transmis. C'est un problème de fiabilité autant que d'UX : les leads du formulaire de contact et de la demande revendeur sont silencieusement perdus. **Recommandation :** brancher ces formulaires sur une vraie procédure tRPC (ou un webhook e-mail) avant mise en production — c'est un des points qui affecte le plus directement le business (perte de leads).

### 7.4 🟢 Faible — Bon parcours de commande simplifié

Point positif : le tunnel de commande (`/commande`) vers WhatsApp est simple et cohérent avec le positionnement du service (support humain via WhatsApp plutôt que paiement en ligne complexe), et le composant `SavingsCalculator` est un bon outil d'aide à la décision pour convertir les visiteurs indécis.

---

## 8. Tests & fiabilité

### 8.1 🔴 Critique — Aucun test n'existe dans le projet

**Fichier :** `vitest.config.ts` (configuré, `include: ["api/**/*.test.ts", "api/**/*.spec.ts"]`)

Vitest est installé et configuré, mais une recherche exhaustive (`*.test.*`, `*.spec.*`) ne retourne **aucun fichier de test** dans tout le dépôt. Le script `npm test` (`package.json:14`) exécute donc `vitest run` sur un périmètre vide. Concrètement, cela signifie que la faille critique de la section 2.1 (routes admin sans authentification) **n'aurait jamais pu être détectée automatiquement** — un test d'intégration basique (« un appel non authentifié à `admin.orderList` doit échouer ») aurait immédiatement révélé le problème. **Recommandation prioritaire :** au minimum, des tests d'intégration tRPC sur `api/admin-router.ts` et `api/auth-router.ts` vérifiant les cas d'autorisation (utilisateur anonyme, utilisateur non-admin, utilisateur admin).

### 8.2 🟠 Élevée — Aucune gestion d'erreur réseau côté frontend pour les mutations tRPC

Dans `src/pages/Dashboard.tsx` (lignes 39-50), les mutations (`updateOrderStatus`, `deleteOrder`, etc.) n'ont pas de callback `onError` — en cas d'échec réseau ou d'erreur serveur (403, 500…), l'utilisateur ne reçoit aucun feedback visuel ; l'UI reste silencieusement dans un état incohérent (le `<select>` de statut peut sembler avoir changé côté client sans confirmation serveur, selon le comportement de tRPC/React Query par défaut). **Recommandation :** ajouter `onError` avec toast d'erreur (le composant `Toast`/`sonner` est déjà présent dans le projet, `src/components/Toast.tsx`, `src/components/ui/sonner.tsx`).

### 8.3 🟡 Moyenne — Pas d'état de chargement pendant les mutations

Les boutons de suppression (`Dashboard.tsx:232-237`, `301-306`) ne se désactivent pas pendant `deleteOrder.isPending`/`deleteCustomer.isPending`, permettant un double-clic qui déclenche potentiellement deux suppressions/requêtes.

### 8.4 🟢 Faible — Bonne gestion des cas limites d'affichage

Point positif : les tableaux du dashboard gèrent proprement le cas "liste vide" (`Dashboard.tsx:241-247`, `310-316`) et les pages lazy-loadées ont un fallback de chargement cohérent (`src/App.tsx:57-68`).

---

## 9. Déploiement & CI/CD

### 9.1 🔴 Critique — Aucun pipeline CI/CD

Le dossier `.github/` est absent du dépôt. Aucun workflow GitHub Actions n'exécute automatiquement `npm run lint`, `npm run check` (tsc), `npm test` ou `npm run build` sur les pull requests. Rien n'empêche donc de merger du code qui casse le build, échoue le typecheck, ou (comme actuellement) contient une faille de sécurité critique. **Recommandation minimale :**
```yaml
# .github/workflows/ci.yml
on: [pull_request]
jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run lint
      - run: npm run check
      - run: npm test
      - run: npm run build
```

### 9.2 🟠 Élevée — Pas de protection de branche visible / pas de revue obligatoire

Sans accès à l'API GitHub dans cet audit, impossible de confirmer l'état des règles de protection de `main`, mais l'absence totale de CI (9.1) suggère qu'aucune vérification n'est de toute façon exécutable avant merge. **Recommandation :** activer la protection de branche sur `main` avec statut CI obligatoire + au moins une revue avant merge, une fois la CI en place.

### 9.3 🟡 Moyenne — Gestion des variables d'environnement correcte mais non documentée en déploiement

`.env.example` (bon point, documente toutes les variables nécessaires) mais aucun `Dockerfile` ni documentation de déploiement n'explique comment ces variables sont injectées en production (le `.dockerignore` existe pourtant, suggérant qu'un déploiement Docker était prévu à un moment — fichier orphelin, ligne "node_modules, dist, .git" dans `.dockerignore` sans `Dockerfile` associé). **Recommandation :** soit ajouter le `Dockerfile` manquant, soit supprimer le `.dockerignore` orphelin et documenter le déploiement réel dans le `README.md` (actuellement un README par défaut Vite/React, non spécifique au projet — voir 9.4).

### 9.4 🟡 Moyenne — `README.md` non personnalisé

Le `README.md` du dépôt est encore le README générique du template Vite + React + TypeScript (« This template provides a minimal setup... »), sans aucune information sur le projet Ciné Kin Premium lui-même (comment lancer le projet, variables d'environnement requises, architecture, commandes disponibles). Pour un projet destiné à être repris par une équipe, c'est un manque évident.

### 9.5 🟢 Faible — Scripts npm bien structurés

Point positif : les scripts (`dev`, `build`, `check`, `lint`, `format`, `db:generate/migrate/push`) sont clairs et couvrent le cycle de vie standard d'un projet Vite + Drizzle.

---

## 10. Top 5 Quick Wins (effort faible, impact fort)

1. **Corriger l'autorisation admin** — remplacer `publicQuery` par `adminQuery` dans `api/admin-router.ts` (8 lignes à changer). *Effort : 15 min. Impact : élimine la faille critique de fuite de données clients.*
2. **Ajouter un pipeline CI minimal** — un seul fichier `.github/workflows/ci.yml` lançant lint + typecheck + build. *Effort : 30 min. Impact : empêche toute régression future de ce type.*
3. **Ajouter les headers de sécurité HTTP** — `app.use(secureHeaders())` dans `api/boot.ts`. *Effort : 10 min. Impact : durcit immédiatement la posture sécurité.*
4. **Compresser `logo-main.png`** (964 Ko → <20 Ko) et ajouter `width`/`height` aux `<img>` principales. *Effort : 30 min. Impact : gain perceptible sur le LCP/CLS mobile.*
5. **Brancher réellement les formulaires Contact/Revendeurs** (ou au minimum les rediriger vers WhatsApp comme `/commande` en attendant une vraie intégration backend). *Effort : 1-2h. Impact : arrête la perte silencieuse de leads commerciaux.*

---

## 11. Roadmap priorisée

### Court terme (avant toute mise en production — bloquant)
- [ ] **Sécurité 2.1** : corriger l'autorisation de `admin-router.ts` (`adminQuery` partout).
- [ ] **Sécurité 2.2/2.3** : rate limiting + headers de sécurité HTTP.
- [ ] **Tests 8.1** : au moins des tests d'autorisation sur les routers tRPC.
- [ ] **CI/CD 9.1** : pipeline minimal lint/typecheck/test/build sur PR.
- [ ] **UX 7.3** : brancher les formulaires Contact/Revendeurs ou les rediriger vers WhatsApp.
- [ ] **SEO 6.1** : corriger l'incohérence de domaine entre `index.html`, `SchemaOrg.tsx`, `robots.txt` et `sitemap.xml`.

### Moyen terme (dans le mois suivant le lancement)
- [ ] **Sécurité 2.4/2.5** : réduire la durée de vie des sessions, ajouter une protection CSRF explicite.
- [ ] **Sécurité 2.7** : mise à jour des dépendances vulnérables (`npm audit fix`, migration `drizzle-kit`).
- [ ] **Performance 4.1/4.2** : lazy-loading de GSAP/Swiper sur la home, conversion des images en WebP.
- [ ] **Accessibilité 5.1/5.2** : relever les contrastes de texte, gérer `prefers-reduced-motion` pour Framer Motion/GSAP.
- [ ] **Architecture 3.1/3.2** : suppression du code mort (composants non importés, dépendances inutilisées `zustand`, `@aws-sdk/*`).
- [ ] **SEO 6.2** : migration de `HashRouter` vers `BrowserRouter` (l'infra serveur le supporte déjà).

### Long terme (roadmap produit / dette structurelle)
- [ ] **SEO 6.3** : évaluer un passage à SSR/SSG (Next.js/Astro ou prerendering) pour le référencement organique.
- [ ] **UX 7.1** : remplacer les statistiques « social proof » fictives par de vraies données issues de la base (commandes réelles, avis collectés).
- [ ] **Architecture 3.3** : unifier la charte graphique (supprimer l'ancien design system cyan/violet ou migrer `Paiement.tsx`).
- [ ] **Tests 8.x** : couverture de tests plus large (composants critiques du tunnel de commande, e2e Playwright sur le parcours d'achat).
- [ ] **DevOps 9.3** : formaliser une stratégie de déploiement documentée (Docker ou plateforme managée) avec gestion des secrets en production.
