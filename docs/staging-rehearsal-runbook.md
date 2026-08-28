# Répétition contrôlée sur staging

Cette procédure valide la reprise d'une base Ciné-Kin avant toute intervention
en production. Elle enchaîne un contrôle en lecture seule, une sauvegarde
chiffrée, une restauration dans une base vide, les migrations versionnées et
l'audit d'intégrité.

## Contrat de sécurité

- la source est ouverte uniquement en lecture ; utiliser un compte MySQL dont
  les privilèges interdisent toute écriture ;
- la restauration vise une base vide, isolée et explicitement confirmée ;
- le nom de cette base doit contenir `restore`, `rehearsal`, `validation` ou
  `sandbox` ;
- les deux cibles doivent être distinctes ;
- leurs noms doivent être différents, même si elles se trouvent sur des hôtes
  distincts ;
- aucun dump SQL en clair n'est écrit sur disque ;
- la sauvegarde est chiffrée en AES-256-GCM et accompagnée d'une empreinte
  SHA-256 ;
- aucun script de staging ne supprime une base et aucun build Vercel ne lance de
  migration.
- le répertoire de sauvegarde ne peut pas être la racine du projet, un dossier
  public, généré, interne à Git ou appartenant aux dépendances.

**Statut des plateformes concernées par cette procédure** : Render est
l'hébergeur de staging actuel de l'application ; Aiven héberge la base MySQL
de staging actuelle (source de cette répétition). Vercel n'intervient pas
dans cette procédure : c'est une cible de déploiement compatible et
candidate, pas la plateforme de production retenue — voir la section
« Statut des plateformes » du README.

Le format et les options de sauvegarde suivent les recommandations de la
[documentation MySQL sur la sauvegarde et la reprise](https://dev.mysql.com/doc/refman/8.0/en/backup-and-recovery.html)
et de la [documentation `mysqldump`](https://dev.mysql.com/doc/refman/8.0/en/using-mysqldump.html).

## 1. Préparer l'environnement

Prérequis : Node.js 20+, `npm ci`, ainsi que les exécutables officiels MySQL 8
`mysql` et `mysqldump` dans le `PATH`.

Créer deux comptes aux droits minimaux :

- source : lecture seule sur la base à copier ;
- restauration : lecture/écriture uniquement sur la base isolée et vide.

Renseigner les variables de `.env.example` dans un gestionnaire de secrets ou
dans un fichier `.env` local protégé. Ne jamais passer une URL MySQL ou un secret
sur la ligne de commande. Les valeurs obligatoires pour cette procédure sont :

```dotenv
STAGING_ENVIRONMENT=staging
STAGING_DATABASE_URL=
STAGING_RESTORE_DATABASE_URL=
STAGING_BASE_URL=
STAGING_BACKUP_PASSPHRASE=
STAGING_BACKUP_DIR=artifacts/staging-backups
STAGING_REHEARSAL_ALLOW_APPLY=0
```

Les variables applicatives `APP_BASE_URL`, `VITE_SITE_URL`, `SESSION_SECRET`,
`ENCRYPTION_KEY`, l'accès administrateur, le proxy et le rate limiting doivent
également satisfaire les contrôles de `.env.example`. La phrase de sauvegarde
doit être différente de tous les secrets applicatifs et conservée séparément du
fichier chiffré.

## 2. Exécuter le préflight en lecture seule

Remplacer les deux noms ci-dessous par ceux affichés dans les URL MySQL :

```bash
npm run staging:preflight -- \
  --confirm-source "NOM_EXACT_SOURCE" \
  --confirm-restore "NOM_EXACT_RESTORE"
```

Le contrôle doit terminer par `Préflight staging réussi`. Vérifier les volumes
affichés et confirmer que la restauration est `empty`. La commande s'arrête si
la cible contient déjà une table ou si la configuration ressemble à une cible
non isolée.

## 3. Sauvegarder, restaurer, migrer et auditer

Après validation humaine du préflight, ouvrir temporairement la porte
d'écriture sur la seule base de restauration :

```bash
STAGING_REHEARSAL_ALLOW_APPLY=1 npm run staging:rehearse -- \
  --apply \
  --confirm-source "NOM_EXACT_SOURCE" \
  --confirm-restore "NOM_EXACT_RESTORE"
```

Si, et seulement si, le préflight qualifie la source de `legacy-untracked`,
ajouter `--adopt-legacy`. L'adoption se fait sur la copie restaurée, jamais sur
la source.

La commande produit trois fichiers protégés en mode `0600` :

- `*.sql.ckbackup` : dump chiffré et authentifié ;
- `*.sql.ckbackup.sha256` : empreinte du fichier chiffré ;
- `*.sql.ckbackup.json` : manifeste sans identifiants ni mots de passe.

Conserver le fichier chiffré et sa phrase de passe dans deux emplacements
séparés. Contrôler l'empreinte depuis le répertoire de sauvegarde :

```bash
sha256sum -c "NOM_DU_FICHIER.sql.ckbackup.sha256"
```

Le succès final doit confirmer la sauvegarde, la restauration isolée, la
migration et l'audit. En cas d'échec, considérer la base de restauration comme
partielle : ne pas la réutiliser, créer une nouvelle base vide et recommencer.

## 4. Déployer et exécuter les smoke tests

Déployer le code de la release sur Render, en pointant `DATABASE_URL` vers la
base restaurée sur Aiven — jamais l'inverse : la migration et son audit
(étape 3) doivent avoir réussi avant que le nouveau code ne démarre contre
cette base. Puis exécuter :

```bash
npm run staging:smoke
```

Les sept contrôles publics doivent réussir : accueil, connexion, vivacité et
en-têtes de sécurité, disponibilité MySQL, statut OAuth minimal, vraie 404 HTML
et vraie 404 JSON pour l'API.

Compléter par les tests authentifiés suivants :

- connexion administrateur, révocation puis reconnexion ;
- connexion revendeur et refus d'un ancien cookie après changement de mot de
  passe ;
- consultation des clients et revendeurs ;
- ajout motivé de crédits et concordance du registre ;
- activation annuelle puis illimitée avec contrôle des débits ;
- génération et utilisation d'un nouveau code de réclamation ;
- refus d'un ancien appareil non revérifié ;
- contrôle des journaux via le même `X-Request-ID` que la réponse HTTP.

## 5. Décision et nettoyage

Archiver le manifeste, l'empreinte, le résultat de l'audit, les résultats des
smoke tests et l'identifiant du commit. Noter explicitement qui a validé la
répétition et à quelle date.

La base restaurée reste disponible pour inspection jusqu'à la décision de
passage en production. Sa suppression est une action manuelle distincte,
réservée à un opérateur autorisé. Ne jamais supprimer ni modifier la source au
nom de cette procédure.
