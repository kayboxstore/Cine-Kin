# PASSATION COMPLÈTE À CLAUDE CODE — CINÉ KIN

Date du point de contrôle : **27 août 2026**
Dépôt : `https://github.com/kayboxstore/Cine-Kin`
Poste de travail Windows : `A:\Projets\Cine-Kin`

## Message à Claude Code

Tu prends maintenant la main sur le projet **Ciné Kin** jusqu’à sa validation finale. Commence obligatoirement par lire toute cette passation, puis vérifie l’état réel du dépôt et des environnements avant toute modification. Le propriétaire du projet n’est pas développeur : explique chaque étape simplement, donne une seule action manuelle à la fois lorsqu’il doit intervenir, et ne lui demande jamais de coller un mot de passe, une URL contenant un mot de passe, le contenu de `.env` ou une capture de variables secrètes.

L’objectif n’est pas seulement de faire fonctionner le site : il faut terminer le staging contrôlé, valider sauvegarde/restauration, tester les trois portails, traiter les défauts réellement constatés, refaire l’audit final, puis présenter un verdict avant toute fusion ou production.

---

# 1. CONTRAINTES ABSOLUES

1. **Ne fusionne pas la PR nº18 et ne modifie pas la production sans l’autorisation explicite et finale de l’utilisateur.**
2. Travaille uniquement sur le staging isolé tant que la validation finale n’est pas terminée.
3. Ne déclenche aucune dépense, aucun plan payant et aucun moyen de paiement. L’environnement actuel utilise les offres gratuites.
4. Ne révèle, ne journalise, ne copie dans le chat et ne commit aucun secret.
5. Ne lis pas ou n’affiche pas `.env` en entier. Vérifie seulement la présence des variables, jamais leurs valeurs.
6. Ne mets jamais un secret sur une ligne de commande visible. Pour les saisies, utiliser une invite sécurisée ou le presse-papiers local, puis l’effacer.
7. Ne demande plus de capture de l’écran Render **Environment** : une capture précédente a exposé des secrets, qui ont ensuite été renouvelés.
8. N’exécute ni `npm audit fix` ni `npm audit fix --force` aveuglément. Analyse d’abord les vulnérabilités et applique seulement des mises à jour ciblées et testées.
9. Ne supprime jamais une base de données. Si une restauration échoue, considérer la base cible comme partielle, créer une nouvelle base vide isolée et recommencer.
10. Ne pousse, ne crée/modifie une PR et ne déploie que dans le périmètre explicitement autorisé. Toujours annoncer la cible exacte avant une action externe.
11. Préserver les changements de l’utilisateur et vérifier `git status` avant toute édition.
12. Aucun client réel, revendeur réel, paiement réel ou donnée personnelle réelle ne doit être utilisé dans les tests. Toutes les données doivent être explicitement fictives et identifiables comme staging.

---

# 2. ÉTAT GIT ET AUDIT DÉJÀ RÉALISÉ

## Dépôt et branche locale

- Dépôt cloné sur le disque A dans `A:\Projets\Cine-Kin`.
- Branche locale actuelle créée depuis la tête de la PR : `pr-18-audit`.
- Commit audité et déployé : `8ef739869b615a9ce720c86fb61c7e8568059914` (`8ef7398`).
- Branche distante de travail : `codex/round-1-security`.
- PR : `https://github.com/kayboxstore/Cine-Kin/pull/18`.
- La PR nº18 est ouverte, fusionnable, maintenue en brouillon et **non fusionnée**.
- `main` était encore sur `e1a5891` au dernier contrôle.

## Contrôles déjà verts sur le commit audité

- CI GitHub nº46 entièrement verte.
- ESLint réussi.
- TypeScript réussi.
- **203 tests** réussis.
- Builds Vite/Node réussis.
- Build Vercel réussi.
- Migrations MySQL 8 testées.
- Tests HTTP/E2E sur **21 routes** réussis.
- PWA, SEO, accessibilité, 404 et en-têtes de sécurité contrôlés.
- Plusieurs défauts de sécurité et de cohérence avaient déjà été corrigés dans la PR : OAuth, secrets, sessions, rate limiting, normalisation MAC, licences/crédits concurrents, migrations, PWA/SEO/accessibilité et incohérences commerciales.

## Attention : dette de dépendances actuelle

Un `npm.cmd ci` frais sur le PC a installé 565 paquets et signalé :

- 15 vulnérabilités au total ;
- 1 faible ;
- 5 modérées ;
- 9 élevées.

Cette information fraîche prévaut sur tout ancien rapport qui indiquait zéro vulnérabilité. Elle doit être analysée avant la production, sans correction automatique forcée.

---

# 3. OUTILS LOCAUX ET ENVIRONNEMENT WINDOWS

- Git : `2.54.0.windows.1`.
- Node local : `v24.17.0` (le projet exige Node 20+).
- npm local : `11.13.0`.
- MySQL CLI : `8.0.46`.
- `mysqldump` : `8.0.46`.
- Exécutables MySQL : `C:\Program Files\MySQL\MySQL Workbench 8.0 CE\`.
- Le PATH a été ajouté seulement dans la session PowerShell courante avec :

```powershell
$env:Path = 'C:\Program Files\MySQL\MySQL Workbench 8.0 CE;' + $env:Path
```

- Certificat public Aiven local : `D:\ca.pem`.
- Pour Node dans la session PowerShell :

```powershell
$env:NODE_EXTRA_CA_CERTS = 'D:\ca.pem'
```

- `.env` se trouve à la racine du projet et est ignoré par Git (`.gitignore:26:.env`).
- Les dépendances ont déjà été installées avec `npm.cmd ci`.

Avant de poursuivre, exécuter en lecture seule :

```powershell
Set-Location 'A:\Projets\Cine-Kin'
git status --short
git branch --show-current
git rev-parse HEAD
node --version
npm.cmd --version
mysql --version
mysqldump --version
```

Résultat Git attendu avant toute nouvelle correction : branche `pr-18-audit`, HEAD `8ef739869b615a9ce720c86fb61c7e8568059914`, aucun changement inattendu.

---

# 4. AIVEN MYSQL DE STAGING — ÉTAT EXACT

## Projet et service

- Projet Aiven : `cine-kin-staging`.
- Service : `cine-kin-mysql-staging`.
- Plan : **MySQL Free forever, 0 $/mois**, aucun moyen de paiement.
- Région : Europe / Amsterdam.
- MySQL : `8.4.8`.
- Hôte : `cine-kin-mysql-staging-cine-kin-staging.d.aivencloud.com`.
- Port : `22339`.
- TLS vérifié dans MySQL Workbench ; chiffrement observé : `TLS_AES_128_GCM_SHA256`.

## Bases isolées

- Source : `cine_kin_staging_source`.
- Restauration : `cine_kin_staging_restore`.

## Utilisateurs et privilèges vérifiés

### `cine_kin_source_reader`

- `USAGE ON *.*` seulement au niveau global.
- `SELECT, SHOW VIEW, EVENT, TRIGGER` uniquement sur `cine_kin_staging_source`.
- Aucun droit global, aucun droit d’écriture, aucun `GRANT OPTION`.
- `SHOW_ROUTINE` n’a pas pu être accordé par `avnadmin`. Il faudra vérifier si l’export des routines fonctionne réellement ; ne pas présumer.

### `cine_kin_restore_operator`

- `USAGE ON *.*` seulement au niveau global.
- `ALL PRIVILEGES` uniquement sur `cine_kin_staging_restore`.
- Aucun droit global et aucun `GRANT OPTION`.

### `cine_kin_source_operator`

- Créé pour appliquer les migrations et faire fonctionner l’application de staging.
- `USAGE ON *.*` seulement au niveau global.
- `ALL PRIVILEGES` uniquement sur `cine_kin_staging_source`.
- Aucun droit global et aucun `GRANT OPTION`.
- Son premier mot de passe a été exposé dans une capture Render, puis **réinitialisé dans Aiven**. L’ancien mot de passe est invalide. Le nouveau ne doit jamais être affiché.

### `avnadmin`

- Compte administrateur Aiven utilisé uniquement dans MySQL Workbench pour les `GRANT`/`REVOKE`.
- Son mot de passe n’a jamais été partagé dans le chat.
- Ne l’utiliser que si une opération administrative est indispensable et explicitement validée.

## Durcissement déjà effectué

Aiven créait par défaut les nouveaux utilisateurs avec des droits globaux très larges, notamment `ROLE_ADMIN`, `REPLICATION_APPLIER` et `WITH GRANT OPTION`. Ces droits ont été retirés manuellement avec `REVOKE ALL PRIVILEGES, GRANT OPTION`, puis remplacés par les privilèges limités ci-dessus.

---

# 5. VARIABLES LOCALES — NE JAMAIS AFFICHER LES VALEURS

Le fichier local `.env` contient les variables nécessaires. Leur présence a été configurée ; ne jamais afficher le fichier complet.

Variables publiques connues :

```dotenv
STAGING_ENVIRONMENT=staging
APP_BASE_URL=https://cine-kin-audit-preview.onrender.com
VITE_SITE_URL=https://cine-kin-audit-preview.onrender.com
STAGING_BASE_URL=https://cine-kin-audit-preview.onrender.com
STAGING_BACKUP_DIR=artifacts/staging-backups
STAGING_REHEARSAL_ALLOW_APPLY=0
RATE_LIMIT_STORE=database
TRUST_PROXY=true
TRUST_PROXY_HOPS=1
DATABASE_POOL_LIMIT=3
DATABASE_CONNECT_TIMEOUT_MS=10000
KIMI_OAUTH_PKCE=true
```

Variables secrètes présentes mais à ne jamais imprimer :

- `SESSION_SECRET` ;
- `ENCRYPTION_KEY` ;
- `ADMIN_PASSWORD` ;
- `STAGING_BACKUP_PASSPHRASE` ;
- `STAGING_DATABASE_URL` avec `cine_kin_source_reader` ;
- `STAGING_RESTORE_DATABASE_URL` avec `cine_kin_restore_operator` ;
- `DATABASE_URL` avec `cine_kin_source_operator`.

Les secrets applicatifs ont été générés aléatoirement, sont distincts et ont été renouvelés après l’incident de capture. La phrase de sauvegarde est distincte des secrets applicatifs.

Pour copier ponctuellement le mot de passe administrateur sans l’afficher :

```powershell
node --env-file=.env -e "process.stdout.write(process.env.ADMIN_PASSWORD)" | Set-Clipboard
```

Puis effacer immédiatement le presse-papiers :

```powershell
Set-Clipboard -Value ''
```

Ne jamais demander à l’utilisateur de coller ce mot de passe dans le chat.

---

# 6. MIGRATIONS ET PRÉFLIGHT DÉJÀ VALIDÉS

## Migration de la source

Commande exécutée :

```powershell
node --env-file=.env scripts/db-migrate-if-configured.mjs
```

Résultat :

```text
[✓] migrations applied successfully!
```

Audit exécuté :

```powershell
node --env-file=.env scripts/audit-migrated-db.mjs
```

Résultat :

- base `cine_kin_staging_source` ;
- 3 migrations enregistrées ;
- revendeurs/écritures : 0/0 ;
- appareils : 0, vérifiés : 0, à revérifier : 0 ;
- MAC historiques/invalides/collisions : 0 ;
- schéma, historique et registre de crédits cohérents.

## Préflight

Commande exécutée :

```powershell
npm.cmd run staging:preflight -- --json --confirm-source "cine_kin_staging_source" --confirm-restore "cine_kin_staging_restore"
```

Dernier résultat :

- `ok: true` ;
- aucune erreur ;
- aucun avertissement ;
- source : état `tracked`, 9 tables applicatives, 0 client, 0 revendeur, 0 écriture de registre ;
- restauration : état `empty`, 0 table applicative ;
- source et restauration distinctes et sur le staging Aiven.

La répétition complète `staging:rehearse -- --apply` **n’a pas encore été exécutée**.

---

# 7. RENDER — PRÉVERSION ACTUELLEMENT EN LIGNE

## Service

- Workspace Render : `tea-d8r5e2cvikkc7385qpeg`.
- Service ID : `srv-da6rg5bbc2fs73elusp0`.
- Nom : `cine-kin-audit-preview`.
- URL : `https://cine-kin-audit-preview.onrender.com`.
- Région : Francfort.
- Plan : Free.
- Branche configurée : `codex/round-1-security`.
- Auto-deploy : désactivé.
- Build : `npm ci && npm run build`.
- Start : `npm start`.
- Runtime observé : Node `20.19.5`.

## Secrets et certificat

- Fichier secret Render `ca.pem` enregistré, monté dans `/etc/secrets/ca.pem`.
- `NODE_EXTRA_CA_CERTS=/etc/secrets/ca.pem`.
- `DATABASE_URL` pointe actuellement vers `cine_kin_staging_source` avec `cine_kin_source_operator`.
- `ADMIN_PASSWORD` est configuré.
- Les secrets Render ont été sauvegardés sans capture après leur renouvellement.

## Déploiement actuel

- Déploiement manuel explicitement autorisé : `dep-da80gh67bikc738pvu80`.
- Commit exact : `8ef739869b615a9ce720c86fb61c7e8568059914`.
- Statut : `live`.
- Fin observée : `2026-08-27T09:51:03Z`.
- Build et démarrage réussis.
- HTTP HEAD `/` : 200.
- HTTP GET `/` : 200.
- Aucune erreur de niveau error observée dans les logs à ce point.
- Aucun merge et aucune production modifiée.

## Smoke tests publics

Commande exécutée :

```powershell
npm.cmd run staging:smoke
```

Les sept contrôles ont réussi :

```text
√ page d’accueil
√ page de connexion
√ vivacité et en-têtes
√ disponibilité MySQL
√ statut OAuth
√ 404 HTML réelle
√ 404 API réelle
```

---

# 8. INCIDENT DE SÉCURITÉ DÉJÀ TRAITÉ

Pendant une tentative d’import en masse dans Render, une capture a affiché des valeurs sensibles : un ancien mot de passe `cine_kin_source_operator` et des secrets applicatifs provisoires.

Mesures déjà prises :

1. import annulé avant sauvegarde ;
2. presse-papiers effacé ;
3. mot de passe `cine_kin_source_operator` réinitialisé dans Aiven ;
4. `SESSION_SECRET`, `ENCRYPTION_KEY` et `ADMIN_PASSWORD` régénérés localement ;
5. nouvelle `DATABASE_URL` enregistrée sans affichage ;
6. variables Render mises à jour sans capture ;
7. audit de la base réussi après rotation ;
8. déploiement manuel effectué ensuite avec les valeurs renouvelées.

Ne jamais répéter les anciennes valeurs, même si elles apparaissent dans l’historique. Elles doivent être considérées comme compromises et abandonnées.

---

# 9. POINT D’ARRÊT EXACT : DÉCONNEXION ADMINISTRATEUR

## Ce qui vient d’être testé

1. L’utilisateur a ouvert `https://cine-kin-audit-preview.onrender.com/admin`.
2. Il a copié localement `ADMIN_PASSWORD` sans l’afficher.
3. La connexion administrateur a réussi.
4. Le tableau de bord s’est ouvert et affiche : 0 client actif, 0 commande, 0 activation, 0 crédit ; listes vides. C’est cohérent avec la base neuve.
5. Il a effacé le mot de passe du presse-papiers.
6. Il a cliqué sur l’icône de sortie en bas à gauche.
7. Le tableau de bord est resté affiché.
8. L’URL est restée `https://cine-kin-audit-preview.onrender.com/admin`.
9. Aucune donnée n’a encore été créée dans l’interface.

## Recherche déjà faite dans le code

`git grep` confirme les emplacements suivants :

- `server/auth-router.ts:49` : `logout` administrateur ;
- `src/hooks/useAuth.ts` : mutation de logout ;
- `src/pages/admin/AdminPanel.tsx` : utilise `useAuth({ redirectPath: "/admin" })` et transmet `onLogout={logout}` ;
- `src/components/admin/AuthLayout.tsx` : bouton de sortie ;
- des hooks/routers distincts existent aussi pour client et revendeur.

Contenu pertinent déjà observé dans `src/hooks/useAuth.ts` :

```ts
const logoutMutation = trpc.auth.logout.useMutation({
  onSuccess: async () => {
    await utils.invalidate();
    navigate(redirectPath);
  },
});

const logout = useCallback(() => logoutMutation.mutate(), [logoutMutation]);
```

Le hook utilise `trpc.auth.me.useQuery` avec `staleTime: 1000 * 60 * 5` et `retry: false`.

Point important : `AdminPanel` passe `redirectPath: "/admin"`. Par conséquent, le fait que l’URL reste `/admin` **n’est pas à lui seul une preuve d’échec**. Le défaut réel est que le tableau de bord est resté visible après le clic. Il faut déterminer si :

- le clic n’a pas atteint le vrai bouton ;
- la mutation RPC a échoué sans retour visible ;
- le serveur n’a pas invalidé/supprimé le cookie ;
- l’invalidation du cache ne force pas la requête `auth.me` ;
- l’interface garde un utilisateur obsolète à cause du `staleTime` ;
- ou la déconnexion a réussi mais l’écran n’a pas été rafraîchi.

---

# 10. PREMIÈRE MISSION DE CLAUDE : DIAGNOSTIQUER LA DÉCONNEXION

Ne commence pas par créer des données. Termine d’abord ce test de sécurité.

## Inspection obligatoire en lecture seule

Lire au minimum :

```text
server/auth-router.ts
src/hooks/useAuth.ts
src/pages/admin/AdminPanel.tsx
src/components/admin/AuthLayout.tsx
src/lib/trpc.ts (ou le vrai fichier de configuration tRPC)
les utilitaires de création/suppression des cookies de session
les tests d’authentification existants
```

Chercher aussi les implementations client/revendeur pour comparer les comportements.

## Vérifications à effectuer

1. Vérifier que le bouton dans `AuthLayout` possède bien `type="button"`, un libellé accessible et `onClick={onLogout}`.
2. Vérifier le résultat exact de `auth.logout` côté serveur : cookie expiré/supprimé, même nom, même chemin, même domaine, mêmes attributs `secure`/`sameSite`.
3. Vérifier que les erreurs de mutation sont affichées ou au moins journalisées sans secrets.
4. Tester la mutation directement par les tests existants ou ajouter un test ciblé.
5. Vérifier qu’après logout une nouvelle requête `auth.me` renvoie non authentifié.
6. Vérifier qu’un rechargement forcé, un retour arrière et une nouvelle requête ne restaurent pas le tableau de bord.
7. Vérifier la reconnexion avec le même mot de passe après révocation.
8. Vérifier le même principe pour revendeur et client, sans supposer que leur logique est identique.

## Si un défaut de code est confirmé

- Créer une branche de correction clairement nommée à partir du commit audité, sans écraser les changements utilisateur.
- Ajouter un test de non-régression avant ou avec la correction.
- Correction attendue : la session serveur doit être révoquée et le cache client doit être explicitement vidé/remplacé/refetché ; la navigation seule vers `/admin` ne suffit pas.
- Ne pas masquer le problème avec un simple `window.location.reload()` si le cookie demeure valide.
- Exécuter lint, TypeScript, tests d’auth, puis toute la suite.
- Ne pas pousser, déployer ou modifier la PR sans annoncer l’action et confirmer son périmètre avec l’utilisateur.

## Test manuel immédiat conseillé après inspection

Depuis la session actuellement affichée :

1. cliquer précisément le bouton de déconnexion ;
2. attendre la fin de la mutation ;
3. faire `Ctrl+R` ;
4. vérifier que le formulaire de connexion s’affiche ;
5. utiliser le bouton Retour du navigateur ;
6. vérifier que le tableau de bord ne réapparaît pas ;
7. se reconnecter avec le mot de passe staging ;
8. effacer immédiatement le presse-papiers.

Ne demande jamais le mot de passe dans le chat.

---

# 11. APRÈS LA DÉCONNEXION : DONNÉES FICTIVES ET TESTS AUTHENTIFIÉS

La source est actuellement structurellement valide mais non représentative, car tous les compteurs sont à zéro. La répétition sauvegarde/restauration ne doit être lancée qu’après création de données fictives suffisantes pour tester les règles métier.

Créer uniquement des données portant clairement `STAGING`, `TEST` ou une date de test. Ne jamais utiliser de vrai client, vrai numéro de téléphone, vrai paiement ou vraie adresse MAC appartenant à quelqu’un.

## Parcours administrateur

1. Connexion administrateur.
2. Révocation/déconnexion.
3. Preuve qu’un ancien cookie n’est plus accepté.
4. Reconnexion.
5. Consultation des pages Commandes, Clients, Activations et Revendeurs.

## Parcours revendeur

1. Créer un revendeur fictif de staging.
2. Définir un secret temporaire sans l’afficher dans le chat.
3. Se connecter au portail revendeur.
4. Changer/réinitialiser son mot de passe selon le flux prévu.
5. Vérifier que l’ancien cookie/session est refusé après changement.
6. Vérifier la reconnexion avec le nouveau secret.

## Crédits et registre

1. Ajouter un nombre minimal de crédits avec un motif de test explicite.
2. Vérifier que le solde et le registre concordent.
3. Vérifier l’idempotence et l’absence de double débit lorsqu’une action est répétée ou rafraîchie.
4. Conserver les identifiants de requête utiles, jamais les secrets.

## Client, licences et appareils

1. Créer un client fictif.
2. Tester l’activation annuelle et contrôler le débit de crédits.
3. Tester l’activation illimitée et contrôler le débit correspondant.
4. Générer un nouveau code de réclamation et l’utiliser une seule fois.
5. Vérifier le refus d’un ancien code ou d’une double utilisation.
6. Tester un appareil fictif à revérifier et le refus de l’ancien appareil non revérifié.
7. Vérifier connexion/déconnexion du portail client.

## Journaux

- Pour au moins une action réussie et une action refusée, récupérer le `X-Request-ID` de la réponse HTTP et retrouver le même identifiant dans les logs Render.
- Ne pas imprimer d’identifiants sensibles, cookies ou mots de passe dans le rapport.

Après ces parcours, relancer :

```powershell
node --env-file=.env scripts/audit-migrated-db.mjs
npm.cmd run staging:preflight -- --json --confirm-source "cine_kin_staging_source" --confirm-restore "cine_kin_staging_restore"
```

Attendu : source `tracked` avec des volumes fictifs non nuls et cohérents ; restauration toujours `empty`.

---

# 12. RÉPÉTITION CHIFFRÉE SAUVEGARDE/RESTAURATION

## Avant toute écriture

Lire complètement :

```text
docs/staging-rehearsal-runbook.md
scripts/staging-preflight.mjs
scripts/staging-rehearsal.mjs
scripts/encrypted-backup.test.mjs
scripts/lib/encrypted-backup.mjs
scripts/lib/staging-safety.mjs
scripts/lib/migration-database.mjs
```

Vérifier spécialement sous Windows :

- comment `mysql` et `mysqldump` reçoivent TLS/CA ;
- si `NODE_EXTRA_CA_CERTS=D:\ca.pem` suffit pour Node mais pas pour les CLI MySQL ;
- si un paramètre `--ssl-ca` est nécessaire ;
- que le mot de passe n’est jamais placé dans les arguments visibles ;
- qu’aucun dump SQL clair n’est écrit sur disque ;
- que le répertoire de sauvegarde n’est ni la racine du projet, ni `.git`, `public`, `dist`, `.vercel` ou `node_modules`.

La source est `tracked`, donc **ne pas utiliser `--adopt-legacy`**.

## Nouveau préflight obligatoire

```powershell
npm.cmd run staging:preflight -- --json --confirm-source "cine_kin_staging_source" --confirm-restore "cine_kin_staging_restore"
```

Ne continuer que si :

- aucune erreur ;
- source `tracked` et volumes attendus ;
- restauration `empty` ;
- comptes/hôtes/bases exactement confirmés.

## Porte d’écriture temporaire

Obtenir une validation humaine explicite avant la commande `--apply`, puis dans PowerShell :

```powershell
$env:STAGING_REHEARSAL_ALLOW_APPLY = '1'
npm.cmd run staging:rehearse -- --apply --confirm-source "cine_kin_staging_source" --confirm-restore "cine_kin_staging_restore"
```

Après la commande, remettre immédiatement :

```powershell
$env:STAGING_REHEARSAL_ALLOW_APPLY = '0'
```

Résultat attendu : sauvegarde chiffrée AES-256-GCM, empreinte SHA-256, manifeste sans secrets, restauration isolée, migrations versionnées et audit cohérent.

Fichiers attendus sous `artifacts/staging-backups` :

- `*.sql.ckbackup` ;
- `*.sql.ckbackup.sha256` ;
- `*.sql.ckbackup.json`.

Vérifier qu’aucun `*.sql` clair n’existe. Adapter la vérification SHA-256 à Windows sans modifier le format produit. Conserver la sauvegarde chiffrée et la phrase de passe séparément.

Si la répétition échoue, ne pas réutiliser `cine_kin_staging_restore` comme si elle était vide. Créer une nouvelle base isolée dont le nom contient `restore`, `rehearsal`, `validation` ou `sandbox`, attribuer des privilèges minimaux et recommencer depuis le préflight.

---

# 13. DÉPLOYER LA COPIE RESTAURÉE ET LA TESTER

Après réussite de la répétition :

1. auditer la base restaurée directement ;
2. préparer un compte d’exécution limité à cette base si nécessaire ;
3. remplacer temporairement la `DATABASE_URL` du **service Render de préversion uniquement** par la base restaurée, sans afficher la valeur ;
4. sauvegarder sans déployer d’abord ;
5. vérifier en lecture seule les variables et le certificat ;
6. obtenir l’autorisation explicite du déploiement manuel ;
7. déployer exactement le commit validé ;
8. surveiller build, démarrage, santé, logs et requêtes MySQL ;
9. relancer les sept smoke tests ;
10. refaire les parcours administrateur, revendeur et client sur la copie restaurée ;
11. comparer les volumes, crédits, licences, codes et appareils entre la source et la copie ;
12. tester le plan de retour en repointant de manière contrôlée vers la source staging, jamais vers la production.

Auto-deploy doit rester désactivé. Aucun déploiement production.

---

# 14. VULNÉRABILITÉS NPM ET AUDIT TECHNIQUE FINAL

Avant production :

1. exécuter `npm audit --json` en capturant le rapport sans secrets ;
2. distinguer dépendances de production, développement, chemins réellement exploitables et faux positifs ;
3. identifier les correctifs non cassants ;
4. appliquer des mises à jour ciblées sur une branche dédiée ;
5. ne jamais utiliser `--force` sans justification et autorisation ;
6. relancer `npm ci`, lint, TypeScript, 203+ tests, builds, migrations MySQL, E2E 21 routes, tests staging et diff check ;
7. vérifier que le nombre de tests n’a pas diminué ;
8. refaire une revue indépendante du diff complet.

Durcissements à revoir également :

- privilèges nécessaires au compte runtime après migrations, pour éviter de conserver inutilement du DDL ;
- expiration/révocation des trois types de sessions ;
- messages et journalisation des erreurs de logout ;
- secrets uniquement dans les gestionnaires prévus ;
- aucun build Vercel/Render ne doit migrer automatiquement une cible non confirmée.

---

# 15. VALIDATIONS MÉTIER ET JURIDIQUES ENCORE BLOQUANTES

Même si la technique devient verte, ne pas déclarer la production commerciale prête sans preuves ou décisions explicites sur :

- droits de diffusion et droits sur le catalogue ;
- identité de l’entité commerciale et mentions légales ;
- politique de confidentialité et traitement des données personnelles ;
- politique de remboursement ;
- processus réel de paiement et preuve de validation ;
- exactitude des promesses commerciales, disponibilité, qualité jusqu’à 4K et multi-écrans ;
- conformité des contacts, horaires de support et conditions affichées ;
- conservation/suppression des données et gestion des demandes utilisateurs.

Ces sujets doivent être consignés comme décisions métier/juridiques, pas « validés » par du code.

---

# 16. DÉCISION FINALE ET FUSION

Lorsque tout le staging est vert, préparer un rapport final contenant :

- commit exact ;
- branche et PR ;
- état CI ;
- résultats lint/TypeScript/tests/builds ;
- rapport dépendances ;
- état Aiven et privilèges ;
- résultat préflight ;
- sauvegarde/empreinte/manifeste ;
- résultat restauration et audit ;
- sept smoke tests ;
- tests authentifiés des trois portails ;
- corrélation `X-Request-ID` ;
- résultat du test de retour arrière ;
- problèmes résiduels classés P0/P1/P2 ;
- validations juridiques/métier manquantes ;
- recommandation GO / NO-GO motivée.

La PR nº18 ne peut être sortie du brouillon ou fusionnée qu’après présentation de ce rapport et autorisation explicite du propriétaire. Après fusion éventuelle, effectuer seulement les vérifications post-fusion autorisées. Le déploiement production doit faire l’objet d’une autorisation séparée et explicite.

---

# 17. FORMAT DE COLLABORATION ATTENDU DE CLAUDE

- Ne recommence pas ce qui est déjà prouvé ci-dessus ; vérifie seulement les états susceptibles d’avoir changé.
- Commence par annoncer : état Git vérifié, point d’arrêt repris, prochaine action précise.
- Donne à l’utilisateur une seule manipulation manuelle à la fois.
- Exécute toi-même les lectures, analyses, modifications locales et tests que Claude Code peut réaliser.
- Avant toute action externe, indique clairement la cible, l’effet et le garde-fou.
- Ne demande des confirmations que pour une écriture sensible, un déploiement, un push/PR, une modification de privilèges, une répétition `--apply`, une fusion ou la production.
- Après chaque phase, donner : résultat, preuve, défaut restant, étape suivante.
- En cas de coupure/reprise, repartir de ce document et du dernier commit, jamais de zéro.

## Première réponse attendue de Claude

Claude doit commencer par quelque chose d’équivalent à :

> J’ai repris le point de contrôle complet du projet Ciné Kin. Je ne vais ni fusionner la PR nº18, ni toucher à la production, ni afficher les secrets. Je vérifie d’abord l’état Git au commit `8ef7398`, puis j’inspecte la chaîne de déconnexion administrateur (`AuthLayout` → `useAuth` → `auth.logout` → cookie/session). La source staging reste intacte et aucune donnée fictive ne sera créée tant que la révocation de session n’est pas démontrée.

Ensuite, il doit effectuer les contrôles en lecture seule et présenter le diagnostic du logout avant toute correction.
