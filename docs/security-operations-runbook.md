# Sécurité et exploitation — procédure de mise en service

Cette procédure accompagne la vague 4B. Elle ne remplace pas la procédure de
migration détaillée dans `database-migration-runbook.md`.

## 1. Préparer les secrets

Générer séparément `SESSION_SECRET` et `ENCRYPTION_KEY`. Ne jamais réutiliser
`APP_SECRET`, qui est réservé au client OAuth Kimi. Le démarrage en production
refuse les clés dédiées de moins de 32 caractères ou toute valeur réutilisée.

```bash
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

Enregistrer les trois valeurs dans le gestionnaire de secrets de l'hébergeur,
avec une valeur différente par environnement. Une rotation de `SESSION_SECRET`
invalide volontairement toutes les sessions. Une rotation de `ENCRYPTION_KEY`
nécessite au préalable une procédure de rechiffrement des données existantes.

## 2. Configurer OAuth

- `APP_BASE_URL` doit être l'origine HTTPS canonique, sans chemin applicatif.
- Le callback enregistré chez Kimi doit être
  `${APP_BASE_URL}/api/oauth/callback`.
- `KIMI_OAUTH_PKCE=true` est la valeur normale.
- `KIMI_TOKEN_ISSUER` doit être renseigné dès que l'émetteur officiel exact est
  confirmé dans la documentation ou dans un jeton de staging vérifié.

Le navigateur commence désormais le flux via `/api/oauth/start`. Le serveur
génère un `state` aléatoire, un couple PKCE S256 et un cookie HttpOnly signé de
10 minutes. Le callback refuse tout `state` absent, expiré ou non lié au cookie.

## 3. Configurer le proxy et le rate limiting

- Sur Vercel : `TRUST_PROXY=true`, `TRUST_PROXY_HOPS=1`.
- Hors proxy maîtrisé : `TRUST_PROXY=false`.
- En production : `RATE_LIMIT_STORE=database`.
- `memory` est réservé au développement et aux tests mono-processus.

Les clés de compteur sont hachées avant stockage dans
`rate_limit_counters`. Les adresses IP brutes ne sont pas persistées.

## 4. Déployer sans migration implicite

1. Sauvegarder la base et vérifier la restauration sur une base isolée.
2. Exécuter `npm ci`, puis la CI complète.
3. Sur staging : `npm run db:deploy`.
4. Vérifier `/api/health/live` puis `/api/health/ready`.
5. Tester les connexions administrateur, revendeur et client.
6. Refaire les étapes 3 à 5 sur production dans une fenêtre autorisée.
7. Déployer ensuite le build Vercel. `vercel-build` ne touche jamais la base.

## 5. Contrôles après déploiement

- La réponse OAuth contient un cookie `ck_oauth_tx` HttpOnly, Secure et court.
- La connexion réussie redirige vers `/admin` et efface la transaction OAuth.
- Un ancien cookie revendeur est refusé après changement de mot de passe.
- Les réponses portent `X-Request-ID` et les logs JSON reprennent le même ID.
- La readiness renvoie 503 si MySQL est indisponible, sans divulguer l'erreur.
- La CSP ne contient plus `unsafe-inline` dans `script-src`.

## 6. Arrêt et retour arrière

Ne jamais restaurer une ancienne `SESSION_SECRET` pour « récupérer » des
sessions. En cas d'incident d'authentification, conserver les logs corrélés,
faire tourner `SESSION_SECRET`, corriger la cause puis demander une nouvelle
connexion à tous les utilisateurs.
