import { databaseTarget } from "./migration-database.mjs";

const SAFE_RESTORE_DATABASE = /(restore|rehearsal|validation|sandbox)/i;
const SAFE_DATABASE_NAME = /^[A-Za-z0-9_$][A-Za-z0-9_$-]{0,63}$/;
const FALSE_VALUES = new Set(["0", "false", "no", "off"]);

function booleanValue(value, defaultValue = false) {
  if (value === undefined || value === "") return defaultValue;
  return !FALSE_VALUES.has(String(value).toLowerCase());
}

function secretLooksUnsafe(value) {
  return (
    /^(change|replace|example|placeholder|todo|secret)/i.test(value) ||
    new Set(value).size < 4
  );
}

function requireDedicatedSecret(name, value, errors) {
  const normalized = value?.trim() ?? "";
  if (normalized.length < 32) {
    errors.push(`${name} doit contenir au moins 32 caractères.`);
  } else if (secretLooksUnsafe(normalized)) {
    errors.push(`${name} ressemble à une valeur d’exemple ou trop prévisible.`);
  }
  return normalized;
}

function parsePublicOrigin(name, value, errors) {
  if (!value) {
    errors.push(`${name} est obligatoire pour le staging.`);
    return null;
  }
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") {
      errors.push(`${name} doit utiliser HTTPS.`);
    }
    if (url.username || url.password || url.search || url.hash) {
      errors.push(
        `${name} ne doit contenir ni identifiants, ni query, ni fragment.`
      );
    }
    if (url.pathname !== "/") {
      errors.push(`${name} doit être une origine sans chemin applicatif.`);
    }
    return url.origin;
  } catch {
    errors.push(`${name} n’est pas une URL valide.`);
    return null;
  }
}

function parseTarget(name, value, errors) {
  if (!value) {
    errors.push(`${name} est obligatoire.`);
    return null;
  }
  try {
    const target = databaseTarget(value);
    if (!SAFE_DATABASE_NAME.test(target.database)) {
      errors.push(
        `${name} doit cibler un nom de base MySQL simple de 1 à 64 caractères.`
      );
    }
    const local = ["localhost", "127.0.0.1"].includes(target.host);
    if (!local && (!target.options.user || !target.options.password)) {
      errors.push(`${name} doit inclure un utilisateur et un mot de passe.`);
    }
    return target;
  } catch (error) {
    errors.push(
      `${name} invalide : ${error instanceof Error ? error.message : String(error)}`
    );
    return null;
  }
}

export function parseStagingArguments(argv) {
  const options = {
    adoptLegacy: false,
    apply: false,
    confirmRestore: null,
    confirmSource: null,
    json: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--apply") options.apply = true;
    else if (argument === "--adopt-legacy") options.adoptLegacy = true;
    else if (argument === "--json") options.json = true;
    else if (argument === "--confirm-source") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error(
          "--confirm-source attend le nom exact de la base source."
        );
      }
      options.confirmSource = value;
      index += 1;
    } else if (argument === "--confirm-restore") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error(
          "--confirm-restore attend le nom exact de la base de restauration."
        );
      }
      options.confirmRestore = value;
      index += 1;
    } else {
      throw new Error(`Option inconnue : ${argument}`);
    }
  }
  return options;
}

export function validateStagingEnvironment(
  environment,
  options = parseStagingArguments([])
) {
  const errors = [];
  const warnings = [];

  if (environment.STAGING_ENVIRONMENT !== "staging") {
    errors.push('STAGING_ENVIRONMENT doit valoir exactement "staging".');
  }

  const source = parseTarget(
    "STAGING_DATABASE_URL",
    environment.STAGING_DATABASE_URL,
    errors
  );
  const restore = parseTarget(
    "STAGING_RESTORE_DATABASE_URL",
    environment.STAGING_RESTORE_DATABASE_URL,
    errors
  );

  if (source && options.confirmSource !== source.database) {
    errors.push(
      `Confirmez la base source avec --confirm-source ${source.database}.`
    );
  }
  if (restore && options.confirmRestore !== restore.database) {
    errors.push(
      `Confirmez la base de restauration avec --confirm-restore ${restore.database}.`
    );
  }
  if (restore && !SAFE_RESTORE_DATABASE.test(restore.database)) {
    errors.push(
      "Le nom de la base de restauration doit contenir restore, rehearsal, validation ou sandbox."
    );
  }
  if (
    source &&
    restore &&
    source.host === restore.host &&
    source.port === restore.port &&
    source.database === restore.database
  ) {
    errors.push(
      "La source et la base de restauration doivent être distinctes."
    );
  }

  if (options.adoptLegacy && !options.apply) {
    errors.push("--adopt-legacy exige aussi --apply.");
  }
  if (options.apply && environment.STAGING_REHEARSAL_ALLOW_APPLY !== "1") {
    errors.push(
      "STAGING_REHEARSAL_ALLOW_APPLY=1 est obligatoire pour écrire dans la base de restauration."
    );
  }

  const sessionSecret = requireDedicatedSecret(
    "SESSION_SECRET",
    environment.SESSION_SECRET,
    errors
  );
  const encryptionKey = requireDedicatedSecret(
    "ENCRYPTION_KEY",
    environment.ENCRYPTION_KEY,
    errors
  );
  const backupPassphrase = requireDedicatedSecret(
    "STAGING_BACKUP_PASSPHRASE",
    environment.STAGING_BACKUP_PASSPHRASE,
    errors
  );
  const appSecret = environment.APP_SECRET?.trim() ?? "";
  const distinctSecrets = [
    appSecret,
    sessionSecret,
    encryptionKey,
    backupPassphrase,
  ].filter(Boolean);
  if (new Set(distinctSecrets).size !== distinctSecrets.length) {
    errors.push(
      "APP_SECRET, SESSION_SECRET, ENCRYPTION_KEY et STAGING_BACKUP_PASSPHRASE doivent être distincts."
    );
  }

  const appOrigin = parsePublicOrigin(
    "APP_BASE_URL",
    environment.APP_BASE_URL,
    errors
  );
  const siteOrigin = parsePublicOrigin(
    "VITE_SITE_URL",
    environment.VITE_SITE_URL,
    errors
  );
  const smokeOrigin = parsePublicOrigin(
    "STAGING_BASE_URL",
    environment.STAGING_BASE_URL,
    errors
  );
  if (appOrigin && siteOrigin && appOrigin !== siteOrigin) {
    errors.push(
      "APP_BASE_URL et VITE_SITE_URL doivent utiliser la même origine."
    );
  }
  if (appOrigin && smokeOrigin && appOrigin !== smokeOrigin) {
    errors.push(
      "APP_BASE_URL et STAGING_BASE_URL doivent utiliser la même origine."
    );
  }

  if (environment.RATE_LIMIT_STORE !== "database") {
    errors.push('RATE_LIMIT_STORE doit valoir "database" en staging.');
  }
  if (!booleanValue(environment.TRUST_PROXY)) {
    errors.push("TRUST_PROXY doit être activé derrière le proxy de staging.");
  }
  const proxyHops = Number(environment.TRUST_PROXY_HOPS);
  if (!Number.isInteger(proxyHops) || proxyHops < 1) {
    errors.push("TRUST_PROXY_HOPS doit être un entier positif.");
  }
  if (!booleanValue(environment.KIMI_OAUTH_PKCE, true)) {
    errors.push("KIMI_OAUTH_PKCE doit rester activé en staging.");
  }

  const adminPassword = environment.ADMIN_PASSWORD?.trim() ?? "";
  if (adminPassword && adminPassword.length < 12) {
    errors.push(
      "ADMIN_PASSWORD doit contenir au moins 12 caractères en staging."
    );
  }
  const oauthFields = [
    environment.APP_ID,
    environment.APP_SECRET,
    environment.KIMI_AUTH_URL,
    environment.KIMI_OPEN_URL,
  ];
  const oauthValues = oauthFields.filter(value => Boolean(value?.trim()));
  if (oauthValues.length > 0 && oauthValues.length !== oauthFields.length) {
    errors.push(
      "La configuration OAuth Kimi doit être complète ou entièrement désactivée."
    );
  }
  if (!adminPassword && oauthValues.length !== oauthFields.length) {
    errors.push(
      "Configurez ADMIN_PASSWORD ou un OAuth Kimi complet pour tester l’administration."
    );
  }
  if (
    !environment.OWNER_UNION_ID &&
    oauthValues.length === oauthFields.length
  ) {
    warnings.push(
      "OWNER_UNION_ID est absent : vérifier explicitement le rôle du compte Kimi de staging."
    );
  }

  return {
    configuration: {
      backupDirectory:
        environment.STAGING_BACKUP_DIR || "artifacts/staging-backups",
      backupPassphrase,
      restore,
      smokeOrigin,
      source,
    },
    errors,
    ok: errors.length === 0,
    options,
    warnings,
  };
}

export function safeStagingReport(validation) {
  const { restore, source } = validation.configuration;
  return {
    ok: validation.ok,
    source: source
      ? { database: source.database, host: source.host, port: source.port }
      : null,
    restore: restore
      ? { database: restore.database, host: restore.host, port: restore.port }
      : null,
    smokeOrigin: validation.configuration.smokeOrigin,
    apply: validation.options.apply,
    adoptLegacy: validation.options.adoptLegacy,
    errors: validation.errors,
    warnings: validation.warnings,
  };
}
