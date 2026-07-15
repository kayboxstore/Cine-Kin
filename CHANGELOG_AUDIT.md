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

---
