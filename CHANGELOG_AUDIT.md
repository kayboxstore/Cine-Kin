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
