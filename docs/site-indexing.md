# Interrupteur d'indexation du site

Une seule variable, `VITE_SITE_INDEXING`, décide si le site peut être indexé
par les moteurs de recherche. Elle doit valoir **exactement** `"true"` pour
autoriser l'indexation ; absente, vide, ou toute autre valeur (`"1"`,
`"false"`, `"True"`, …) garde le site **non indexable** — c'est le défaut
sûr avant un vrai lancement public.

## Ce que la variable contrôle

| Mode                              | `<meta name="robots">` (HTML)      | `robots.txt`                          | `sitemap.xml` | En-tête serveur `X-Robots-Tag`     |
| ---------------------------------- | ----------------------------------- | -------------------------------------- | -------------- | ------------------------------------ |
| Absente / ≠ `"true"` (défaut)     | `noindex, nofollow`                 | `User-agent: *` / `Disallow: /`        | non référencé (pas de ligne `Sitemap:`) | `noindex, nofollow` sur **toutes** les réponses |
| `"true"`                          | `index, follow` (comportement actuel) | inchangé (`Disallow` ciblés + `Sitemap:`) | référencé       | absent (comportement actuel)         |

Trois endroits appliquent la même règle, à partir de la même variable :

1. **Au build** (`npm run build` / `npm run vercel-build`) : `vite.config.ts`
   lit `VITE_SITE_INDEXING` et le passe au plugin
   `scripts/lib/public-metadata.ts`, qui réécrit `dist/public/index.html`
   (balise `robots`) et `dist/public/robots.txt`. C'est du **build-time**,
   comme `VITE_SITE_URL` — un changement de variable exige un nouveau build.
2. **Côté serveur** (`server/lib/env.ts` → `server/app.ts`) : l'en-tête
   `X-Robots-Tag` est ajouté sur chaque réponse HTTP (pages et API) quand la
   variable n'est pas exactement `"true"`. C'est du **runtime** : un simple
   restart du process suffit (pas besoin de rebuild) si la variable change
   dans l'environnement du serveur.
3. **Côté client** (`src/lib/siteUrl.ts` → `src/components/SEO.tsx`) : une
   fois React/Helmet monté, la balise `robots` gérée par Helmet respecte
   aussi ce switch global, en plus du `noIndex` propre à chaque page — sans
   ça, une page sans `noIndex` repasserait sur `index, follow` après
   l'hydratation même si le site entier est censé rester non indexable.

Logique centrale partagée (et testée isolément) : `isSiteIndexingEnabled()`
dans `contracts/site-indexing.ts`.

## Lancer en local

Le serveur de dev (`npm run dev`) ne passe pas par le plugin de build : le
`index.html` et le `public/robots.txt` bruts sont toujours servis tels quels
(comme pour `VITE_SITE_URL`). Seuls le composant `SEO` (React, via
`import.meta.env.VITE_SITE_INDEXING`) et l'en-tête serveur `X-Robots-Tag`
réagissent en direct à la variable en dev.

Pour vérifier le comportement de **build** (celui qui compte en production) :

```bash
# Mode par défaut (non indexable)
npm run build
grep -A1 'name="robots"' dist/public/index.html
cat dist/public/robots.txt

# Mode indexable
VITE_SITE_INDEXING=true npm run build
grep -A1 'name="robots"' dist/public/index.html
cat dist/public/robots.txt
```

Pour vérifier l'en-tête serveur (runtime) :

```bash
npm start                      # VITE_SITE_INDEXING absente
curl -sI http://localhost:3000/api/health/live | grep -i x-robots-tag

VITE_SITE_INDEXING=true npm start
curl -sI http://localhost:3000/api/health/live | grep -i x-robots-tag   # absent
```

## Tests

```bash
npx vitest run contracts/site-indexing.test.ts
npx vitest run scripts/public-metadata.test.mjs
npx vitest run server/app-indexing.test.ts
```

Ou l'ensemble de la suite : `npm test`.

## Au lancement

Sur Render, régler `VITE_SITE_INDEXING=true` **avant ou pendant** le
redeploy de lancement — c'est une variable de build, donc un changement
sans nouveau build (avec purge du cache, cf. l'historique des incidents de
cache sur ce service) ne suffit pas à la faire apparaître dans le HTML ou
`robots.txt` servis.
