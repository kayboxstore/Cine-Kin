# Checklist de préparation à la mise en production

Ce document complète le runbook de répétition. Il distingue ce qui peut être
validé techniquement de ce qui exige une décision métier, juridique ou une
intervention autorisée sur l'infrastructure.

## 1. État du candidat

- branche candidate : `claude/pr18-auth-revocation-candidate` ;
- commit de référence audité :
  `d246538569a952ee952f8fc28509f2224a58420d` ;
- le candidat préserve `X-Request-ID` sur les réponses tRPC et comporte un test
  de non-régression dédié ;
- le candidat contient aussi cette checklist et la suppression des affirmations
  juridiques ou techniques non vérifiées ; chaque nouveau HEAD doit être validé
  par la CI avant une décision de déploiement ;
- PR GitHub : nº20, empilée sur `codex/round-1-security` ;
- la PR doit rester en brouillon tant que la répétition Aiven et les tests
  authentifiés sur Render ne sont pas terminés ;
- le déploiement Render actuel reste sur `codex/round-1-security` et ne
  constitue pas une validation du code de la PR nº20.

## 2. Séparation obligatoire des accès MySQL

Les trois usages ne doivent pas partager le même compte :

| Usage | Base | Droits attendus |
| --- | --- | --- |
| Sauvegarde | `cine_kin_staging_source` | lecture seule |
| Restauration et migration | `cine_kin_staging_restore` | DDL et DML complets sur cette base uniquement |
| Application Render | `cine_kin_staging_restore` | `SELECT`, `INSERT`, `UPDATE`, `DELETE` uniquement |

Le compte applicatif ne doit posséder ni `CREATE`, ni `ALTER`, ni `DROP`, ni
`GRANT OPTION`, ni privilège global. Le code d'exécution utilise uniquement les
opérations DML ci-dessus ; les migrations sont lancées séparément avec le compte
d'opération.

Après création du compte de service `cine_kin_runtime` dans Aiven, vérifier et
réduire ses droits avec le compte administrateur :

```sql
REVOKE ALL PRIVILEGES, GRANT OPTION
FROM 'cine_kin_runtime'@'%';

GRANT SELECT, INSERT, UPDATE, DELETE
ON `cine_kin_staging_restore`.*
TO 'cine_kin_runtime'@'%';

SHOW GRANTS FOR 'cine_kin_runtime'@'%';
```

Le mot de passe n'est jamais placé dans une commande SQL, un terminal, un
commit ou un rapport. Il est généré dans Aiven puis saisi directement dans le
secret `DATABASE_URL` de Render.

## 3. Ordre de la répétition de staging

1. Confirmer que le commit local est le commit candidat attendu.
2. Exécuter `staging:preflight` et confirmer :
   - source `tracked` ;
   - restauration `empty` ;
   - noms et hôtes attendus ;
   - volumes représentatifs de la base à reprendre.
   Le dernier préflight observé indiquait neuf tables applicatives mais aucun
   client, revendeur ni mouvement de crédits dans la source. Une répétition
   basée sur cette source vide valide la chaîne technique, mais **ne valide
   pas une reprise de production représentative**. Ne pas autoriser la mise en
   production sur cette seule preuve.
3. Exécuter `staging:rehearse -- --apply` avec la porte d'écriture temporaire.
4. Vérifier l'empreinte SHA-256, le manifeste, le nombre de migrations et
   l'audit d'intégrité.
5. Créer et limiter `cine_kin_runtime` sur la base restaurée.
6. Configurer Render pour la branche candidate et la base restaurée, sans
   réactiver l'auto-déploiement.
7. Déployer une seule fois, puis vérifier `/api/health/live` et
   `/api/health/ready`.
8. Exécuter `staging:smoke`, puis les parcours authentifiés ci-dessous.
9. Conserver la source intacte jusqu'à la décision finale.

## 4. Parcours authentifiés obligatoires

- Administration : connexion, consultation, déconnexion, rejeu refusé de
  l'ancien cookie, puis reconnexion.
- Administration avec deux onglets : déconnexion dans le premier, accès refusé
  dans le second après actualisation.
- Client : connexion MAC/PIN, consultation, déconnexion, puis accès refusé avec
  l'ancien cookie.
- Revendeur : connexion, consultation, déconnexion, puis accès refusé avec
  l'ancien cookie.
- Changement de PIN ou de mot de passe : toutes les anciennes sessions du
  compte doivent être refusées.
- Registre de crédits : ajout motivé, activation annuelle puis illimitée, et
  concordance entre solde et écritures.
- Journalisation : chaque réponse API testée doit porter un `X-Request-ID`
  permettant de retrouver la ligne correspondante dans les logs Render.

## 5. Informations juridiques et métier manquantes

Les pages publiques ne doivent pas inventer ces valeurs. Avant une mise en
production commerciale, faire valider et renseigner :

- dénomination légale exacte, forme juridique, adresse et représentant ;
- RCCM, identification nationale, NIF et coordonnées de réclamation ;
- pays et juridiction applicables, ainsi que la procédure de règlement des
  litiges ;
- preuve des droits de diffusion et de distribution pour chaque catalogue ;
- identité du responsable du traitement et contact pour l'exercice des droits ;
- liste réelle des sous-traitants et transferts de données (hébergement,
  base de données et messagerie utilisée pour les commandes) ;
- catégories de données réellement collectées et finalités associées ;
- durées de conservation réellement appliquées et procédure de suppression ;
- politique de remboursement exacte, communiquée avant paiement ;
- politique relative aux cookies limitée aux usages réellement présents.

### Écarts actuellement visibles

- les mentions légales parlent d'une « société enregistrée » sans donner son
  identité ni ses numéros légaux ;
- l'hébergement est décrit comme « réparti géographiquement », affirmation non
  démontrée par le staging actuel ;
- la politique de confidentialité annonce la collecte d'informations de
  paiement alors qu'aucun paiement n'est traité sur le site ;
- elle annonce de l'analyse et de la personnalisation par cookies alors
  qu'aucun outil d'analytics n'est présent dans le code audité ;
- elle promet une suppression des données de compte après douze mois sans
  mécanisme automatique correspondant dans le code.

Ces textes doivent être corrigés à partir de faits validés par le responsable
du projet et, avant commercialisation, relus par un conseil compétent dans la
juridiction retenue.

## 6. Décision finale

La PR nº20 ne peut être déclarée prête à fusionner que si :

- le correctif `X-Request-ID`, la checklist et les corrections des pages
  juridiques sont intégrés au candidat, et la CI de son HEAD est verte ;
- la répétition chiffrée est réussie sur une cible vide ;
- la source de répétition contient un jeu de données représentatif, ou la
  limitation d'une répétition purement technique est formellement acceptée et
  complétée avant la production ;
- le candidat est déployé sur Render avec le compte runtime limité ;
- les smoke tests et tous les parcours authentifiés sont réussis ;
- les informations juridiques et les droits de diffusion sont confirmés ;
- l'opérateur a archivé le commit, le manifeste, l'empreinte, l'audit et les
  résultats de tests.
