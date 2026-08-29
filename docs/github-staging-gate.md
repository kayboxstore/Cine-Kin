# Porte GitHub sécurisée pour la répétition staging

Ce workflow permet d'exécuter la répétition contrôlée depuis GitHub Actions,
sans copier de secret dans le dépôt, un commentaire, une commande ou un
artefact en clair. Il ne se déclenche jamais sur un push ou une pull request.

## Garanties

- lancement manuel uniquement depuis la branche `main` ;
- environnement GitHub protégé nommé `staging` ;
- code exécuté limité à la branche
  `claude/pr18-auth-revocation-candidate` et à un SHA complet explicitement
  confirmé ;
- source MySQL utilisée uniquement avec le compte en lecture seule fourni dans
  `STAGING_DATABASE_URL` ;
- écritures limitées à la base isolée `cine_kin_staging_restore` ;
- aucune suppression de base et aucune opération sur la production ;
- aucun dump SQL en clair : seul le fichier `*.sql.ckbackup` chiffré est
  archivé ;
- actions tierces épinglées par SHA et jeton GitHub limité à `contents: read` ;
- exécutions sérialisées et jamais annulées automatiquement en cours de
  restauration.

## Configuration depuis un téléphone

Après fusion de la PR qui ajoute uniquement ce workflow et ce document :

1. Ouvrir le dépôt GitHub, puis **Settings → Environments → New environment**.
2. Nommer l'environnement exactement `staging`.
3. Si le forfait GitHub le permet, ajouter un approbateur obligatoire, activer
   **Prevent self-review** et limiter les branches de déploiement à `main`.
4. Ajouter les six secrets d'environnement suivants, sans les envoyer dans une
   conversation :

   - `STAGING_DATABASE_URL` — compte Aiven strictement en lecture seule sur
     `cine_kin_staging_source` ;
   - `STAGING_RESTORE_DATABASE_URL` — compte limité en lecture/écriture à la
     base vide `cine_kin_staging_restore` ;
   - `STAGING_BACKUP_PASSPHRASE` ;
   - `SESSION_SECRET` ;
   - `ENCRYPTION_KEY` ;
   - `ADMIN_PASSWORD`.

Les trois secrets cryptographiques doivent contenir au moins 32 caractères et
être distincts. `ADMIN_PASSWORD` doit contenir au moins 12 caractères. Les URL
MySQL authentifiées restent des secrets, même si leur hôte n'est pas sensible.

## Ordre obligatoire des lancements

Dans **Actions → Staging Gate → Run workflow**, sélectionner `main`, saisir le
SHA complet approuvé de la branche candidate et respecter cet ordre :

1. `preflight` — lecture seule ; télécharger et contrôler l'artefact
   `staging-preflight-*`. La source doit être attendue et la restauration doit
   être `empty`.
2. `rehearse` — seulement après validation humaine du préflight. Cette étape
   refait le préflight, chiffre la sauvegarde, restaure dans la copie isolée,
   applique les migrations versionnées et audite l'intégrité.
3. Déployer manuellement le même SHA sur Render en pointant `DATABASE_URL` vers
   la copie restaurée. Ne jamais pointer Render vers la source au nom de cette
   procédure.
4. `smoke` — seulement après le déploiement Render ; archiver l'artefact
   `staging-smoke-*`, puis compléter les contrôles authentifiés du runbook.

La phrase de passe reste dans les secrets de l'environnement GitHub ; elle
n'est jamais incluse avec le fichier chiffré. Les artefacts sont conservés
90 jours. Les télécharger vers l'archive opérateur avant expiration.

## Arrêts obligatoires

Ne pas lancer `rehearse` si la cible n'est plus vide, si le SHA a changé, si le
compte source peut écrire, ou si les volumes source sont inattendus. En cas
d'échec après le début de la restauration, considérer la cible comme partielle
et ne pas la réutiliser. Sa suppression éventuelle reste une action manuelle
distincte d'un opérateur autorisé.
