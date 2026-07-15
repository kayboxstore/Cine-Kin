# Journal de remédiation — Ciné Kin Premium

Ce fichier trace les correctifs appliqués en réponse à `AUDIT.md`.
`AUDIT.md` n'est pas modifié : il sert de référence historique.

---

## Vague 1 — Critique (sécurité, tests de la zone corrigée, CI)

**Date :** 15 juillet 2026

### [AUDIT §2.1] 🔴 Contrôle d'accès rompu sur l'API admin — CORRIGÉ

**Fichiers :** `api/admin-router.ts`, `api/middleware.ts`

- Les 10 procédures du routeur admin étaient déclarées en `publicQuery`
  (aucune vérification d'identité). Elles sont désormais toutes en `adminQuery`
  (middleware `requireAuth` + `requireRole("admin")`, déjà défini dans
  `api/middleware.ts`).
  Procédures verrouillées : `orderList`, `orderCreate`, `orderUpdateStatus`,
  `orderDelete`, `orderStats`, `customerList`, `customerCreate`,
  `customerUpdateStatus`, `customerDelete`, `customerStats`.
- Ajout de l'export `createCallerFactory` dans `api/middleware.ts` (nécessaire
  aux tests d'autorisation ci-dessous).

**Décision produit confirmée :** les commandes passent exclusivement par
WhatsApp. `orderCreate` / `customerCreate` sont donc bien des actions
d'administration (saisie manuelle par l'admin) et non des endpoints publics
de self-service. Le verrouillage en `adminQuery` est donc sans régression pour
le tunnel de commande public.

**Changement de comportement visible :**
- Tout appel à `/api/trpc/admin.*` sans session admin valide renvoie désormais
  `UNAUTHORIZED` (anonyme) ou `FORBIDDEN` (authentifié mais non-admin).
- Le dashboard `/admin` reste **inchangé** pour un administrateur légitime : le
  frontend conditionnait déjà ces appels à `isAuthenticated && role === "admin"`.
  Seul l'accès direct/non autorisé est bloqué.

### [AUDIT §8.1] 🔴 Absence de tests — PARTIELLEMENT ADRESSÉ (zone critique)

**Fichier :** `api/admin-router.test.ts` (nouveau)

- Ajout de tests d'intégration tRPC couvrant l'autorisation de l'API admin :
  - appel anonyme → `UNAUTHORIZED` sur les 10 procédures ;
  - appel authentifié non-admin → `FORBIDDEN` sur les 10 procédures ;
  - appel admin → franchit la garde d'autorisation et atteint le résolveur ;
  - la procédure publique `ping` reste ouverte (test de non-régression).
- La couche DB est mockée (`vi.mock`) pour exécuter sans MySQL réel.

> Couverture volontairement limitée à la zone corrigée dans cette vague. Une
> couverture plus large (parcours de commande, e2e) reste recommandée
> (voir AUDIT §8.x, roadmap moyen/long terme).

### [AUDIT §9.1] 🔴 Absence de CI/CD — CORRIGÉ

**Fichier :** `.github/workflows/ci.yml` (nouveau)

- Pipeline GitHub Actions déclenché sur `pull_request` et `push` vers `main` :
  `npm ci` → `lint` → `check` (tsc) → `test` → `build`.
- Empêche désormais toute régression de type « faille non détectée » de merger
  sans échec de CI.

### Secrets (règle 3) — RIEN À RÉVOQUER

Vérification confirmée (AUDIT §2.6) : aucun secret dans le code ni dans
l'historique git. `.gitignore` exclut déjà `.env` / `.env.*.local`,
`.env.example` ne contient que des placeholders vides. Aucune clé à régénérer.

---

## Vague 2 — Élevée (sécurité runtime, perf, accessibilité, fiabilité)

**Date :** 15 juillet 2026

### [AUDIT §2.2] 🟠 Absence de rate limiting — CORRIGÉ

**Fichier :** `api/boot.ts`

- Ajout d'un rate limiter en mémoire (fenêtre fixe, 100 req/min/IP) sur
  `/api/trpc/*`, renvoyant `429 Too Many Requests` + `Retry-After` au-delà.
  Sans dépendance externe. Limite connue : état par process — un store
  partagé (Redis) serait requis derrière plusieurs instances (documenté
  dans le code).

### [AUDIT §2.3] 🟠 Headers de sécurité absents — CORRIGÉ

**Fichier :** `api/boot.ts`

- `app.use(secureHeaders())` (Hono) : `X-Frame-Options`,
  `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`,
  `Referrer-Policy`, etc. sur toutes les réponses.
- CSP tailored volontairement différée : `index.html` embarque des scripts
  inline + GA/fonts externes ; une CSP stricte nécessite d'abord un passage
  par nonce (noté pour une vague ultérieure).

### [AUDIT §4.1] 🟠 Bundle home lourd (GSAP/Swiper synchrones) — CORRIGÉ

**Fichiers :** `src/components/ParallaxHero.tsx`, `src/pages/Home.tsx`

- `ParallaxHero` charge désormais GSAP en `import()` dynamique dans
  l'`useEffect` : la bibliothèque sort du bundle initial, le hero
  (above-the-fold) reste rendu immédiatement.
- `TestimonialCarousel` (Swiper + CSS) passe en `React.lazy` + `Suspense` :
  Swiper est déplacé dans un chunk séparé chargé à la demande.

### [AUDIT §5.2] 🟠 `prefers-reduced-motion` ignoré — CORRIGÉ

**Fichiers :** `src/main.tsx`, `src/index.css`, `src/components/ParallaxHero.tsx`

- `<MotionConfig reducedMotion="user">` enveloppe l'app : Framer Motion
  respecte désormais le réglage OS « réduire les animations ».
- `ParallaxHero` court-circuite le parallax GSAP si `prefers-reduced-motion`.
- Media query CSS globale neutralisant animations/transitions CSS + smooth
  scroll sous `prefers-reduced-motion: reduce`.

### [AUDIT §5.1] 🟠 Contrastes de texte sous le seuil WCAG AA — CORRIGÉ

**Fichiers :** 41 fichiers dans `src/pages` et `src/components` (hors `ui/`)

- Relèvement du plancher d'opacité du texte : `text-white/25|30|35` → `/55`,
  `text-white/40|45` → `/60`. Sur fond `#0a1628`, ces valeurs franchissent
  le seuil AA de 4.5:1 (les précédentes étaient à ~3–4:1).
- **Changement visible :** le texte secondaire du site entier est plus
  lisible (moins « estompé »). Valeurs facilement ajustables si un rendu
  plus subtil est souhaité sur certains gros titres.

### [AUDIT §7.3] 🟠 Formulaires Contact/Revendeurs non branchés — CORRIGÉ

**Fichiers :** `src/pages/Contact.tsx`, `src/pages/Revendeurs.tsx`

- `handleSubmit` construit désormais un message WhatsApp pré-rempli avec les
  champs du formulaire et l'ouvre (`window.open`), cohérent avec la décision
  produit « commandes/leads via WhatsApp uniquement ». Fin de la perte
  silencieuse de leads.
- **Changement visible :** soumettre le formulaire ouvre WhatsApp dans un
  nouvel onglet avant l'écran de confirmation.

### [AUDIT §8.2] 🟠 Mutations Dashboard sans gestion d'erreur — CORRIGÉ

**Fichier :** `src/pages/Dashboard.tsx`

- Les 4 mutations (`orderUpdateStatus`, `orderDelete`, `customerUpdateStatus`,
  `customerDelete`) ont désormais un `onError` affichant un toast d'erreur
  (via le `ToastProvider` existant). Fin des échecs silencieux.

### ⚠️ Blocage identifié — mirror npm privé dans `package-lock.json`

`package-lock.json` contient 303 URLs `resolved` pointant vers un mirror
privé `npm.mirrors.msh.team` (injoignable / 502), aux côtés de 410 URLs
`registry.npmjs.org`. Conséquences :
- Impossible de faire `npm ci` dans cet environnement → **tests Vague 1 & 2
  non exécutés localement**.
- La CI ajoutée en Vague 1 **échouerait** sur GitHub Actions (mirror privé
  inaccessible depuis les runners).

Tous les paquets concernés sont pourtant publics sur npmjs.org (vérifié, y
compris `kimi-plugin-inspect-react@1.0.3`). La correction (réécriture des
URLs mirror → npmjs) nécessite ton autorisation explicite car elle reroute
le registre. **En attente de décision (voir échange).**

### [POST-VAGUE 2] Déblocage de l'environnement — RÉSOLU (autorisé)

- Réécriture des 303 URLs `resolved` du mirror privé → `registry.npmjs.org`
  dans `package-lock.json` (intégrité préservée). `npm ci` fonctionne
  désormais localement et en CI.
- Ajout de l'alias `@db` dans `vitest.config.ts` : les tests d'autorisation
  de la Vague 1 s'exécutent (**4 passent**).

---

## Vague 3 — Moyenne (dette technique, SEO, UX)

**Date :** 15 juillet 2026
**Décisions produit :** domaine de prod = `7a5czmte3r3ri.kimi.page` ;
migration vers BrowserRouter ; suppression des fausses statistiques.

### [AUDIT §7.1] 🟡 Statistiques/avis fictifs (dark patterns) — CORRIGÉ

- Suppression des composants `LiveVisitors`, `FOMOCounter`,
  `TrustBadgeReviews`, `PressSection` (compteurs aléatoires, « 2 847 avis »,
  logos presse inventés). Usages retirés de `src/pages/Home.tsx`.
- **Changement visible :** ces sections n'apparaissent plus sur l'accueil.

### [AUDIT §3.1] 🟠 Code mort — CORRIGÉ

- Suppression de 13 composants jamais importés (~1000 lignes) :
  `ExitIntentPopup`, `AnnouncementBar`, `QuickOrderButton`, `QuickOrderModal`,
  `CustomCursor`, `ParticleBackground`, `OrderCounter`, `CountdownTimer`,
  `AuthLayout`, `AuthLayoutSkeleton`, `GSAPScrollReveal`, `ParallaxImage`,
  `WhatsAppButton`.

### [AUDIT §6.2] 🟠 HashRouter → BrowserRouter — CORRIGÉ

**Fichiers :** `src/main.tsx`, `src/pages/Login.tsx`, `public/sitemap.xml`

- Passage de `HashRouter` à `BrowserRouter` (URLs propres `/offres` au lieu
  de `/#/offres`). Le serveur gère déjà le fallback SPA.
- `sitemap.xml` : URLs nettoyées du segment `/#/`. Lien en dur `/#/` de
  `Login` corrigé en `/`.
- **Changement visible :** les URLs changent de forme (meilleur SEO).

### [AUDIT §6.1] 🟠 Incohérence de domaine SEO — CORRIGÉ

**Fichier :** `index.html`

- Alignement des balises OG/Twitter sur `https://7a5czmte3r3ri.kimi.page`
  (cohérent avec `SchemaOrg`, `robots.txt`, `sitemap.xml`).

### [AUDIT §3.4] 🟡 `NAV_LINKS` dupliqué — CORRIGÉ

- Source unique dans `src/data/siteData.ts`, importée par
  `src/components/Navbar.tsx` (suppression de la copie locale divergente).

### [AUDIT §3.2] 🟡 Dépendances inutilisées — CORRIGÉ

- Retrait de `zustand`, `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`
  (jamais importés). Réduit fortement l'arbre de dépendances.

### [AUDIT §8.3] 🟡 Double-clic sur suppression — CORRIGÉ

**Fichier :** `src/pages/Dashboard.tsx`

- Boutons de suppression désactivés pendant la mutation
  (`disabled={deleteX.isPending}`) → plus de double-soumission.

### [AUDIT §9.4] 🟡 README générique — CORRIGÉ

- `README.md` réécrit : stack, variables d'env, scripts, structure,
  déploiement.

### Nettoyage ESLint (débloque la CI) — CORRIGÉ

Les 27 erreurs ESLint pré-existantes (qui auraient laissé la CI rouge) sont
résolues → **lint vert** :
- Override ESLint pour `src/components/ui/**` (shadcn vendored :
  `react-refresh` + `react-hooks/purity` désactivés pour ce dossier généré).
- `useAnalytics.ts` : suppression des `any` (typage `unknown`, `window.gtag?`).
- `api/lib/http.ts` : `any` → `unknown` / `RequestInit["body"]`.
- `Conditions.tsx` : escapes inutiles corrigés.
- `db/seed.ts` : variable inutilisée retirée.
- `trpc.tsx`, `Button.tsx`, `Toast.tsx` : `eslint-disable` ciblé
  (react-refresh sur exports non-composants légitimes).
- `Navbar.tsx` : `eslint-disable` ciblé (fermeture du menu au changement de
  route).

### Vérifications (Vagues 1→3)

- `npm run lint` : ✅ 0 erreur
- `npm run check` (tsc) : ✅
- `npm test` : ✅ 4/4
- `npm run build` : ✅

### Non traité dans cette vague (justifié)

- **§2.7 (deps vulnérables)** : les 15 vulnérabilités restantes concernent la
  toolchain de build (vite, rollup, esbuild via drizzle-kit, lodash…). Leur
  correction exige `npm audit fix --force` avec des bumps **majeurs** (dont un
  downgrade de `drizzle-kit`) → risque de régression non testable dans cette
  vague. Recommandé : à traiter isolément avec tests de non-régression.
- **§4.2 (images WebP)**, **§6.3 (SSR)**, **§3.3/§7.2 (charte /paiement)** :
  reportés (roadmap moyen/long terme, nécessitent outillage/refonte).

---

## Vague 4 — Faible / finitions

**Date :** 15 juillet 2026

### [AUDIT §5.3] 🟡 Lightbox Gallery non accessible au clavier — CORRIGÉ

**Fichier :** `src/components/Gallery.tsx`

- Fermeture au clavier via `Échap`, focus déplacé sur le bouton « Fermer » à
  l'ouverture, `role="dialog"` + `aria-modal="true"` + `aria-label` sur la
  modale, `aria-label="Fermer"` sur le bouton de fermeture.

### [AUDIT §4.3] 🟡 Polices Google en `@import` bloquant — CORRIGÉ

**Fichiers :** `index.html`, `src/index.css`

- Suppression du `@import` CSS render-blocking ; chargement des polices via
  `<link rel="preload" as="style" onload=...>` + fallback `<noscript>` dans
  `index.html`. Le premier paint n'attend plus le téléchargement des polices.

### [AUDIT §3.6] 🟢 Fragments JSX superflus — CORRIGÉ

**Fichiers :** `src/pages/Contact.tsx`, `src/pages/Revendeurs.tsx`

- Suppression des lignes vides et wrappers superflus en tête de `return`.

### Déjà couvert par les vagues précédentes (aucune action)

- §8.3 (double-clic suppression, Vague 3), §6.1/§6.2 (SEO routing/domaine,
  Vague 3), §7.1 (faux « social proof » supprimé, Vague 3).

### Vérifications (Vague 4)

- `npm run lint` : ✅ 0 erreur
- `npm run check` (tsc) : ✅
- `npm test` / `npm run build` : à relancer (indispo transitoire du
  classifieur de sûreté au moment du commit ; lint + typecheck déjà verts).

---
