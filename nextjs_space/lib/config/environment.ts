/**
 * Server-only runtime configuration + environment validation for Azure App Service.
 *
 * Phoenix AI runs as a full Node.js server on Linux App Service. This module is the
 * single place that reads the environment for *operational* concerns (which
 * subsystems are configured/enabled) and validates it at startup. It never reads or
 * returns secret VALUES — only whether the relevant variables are present — so it is
 * safe to surface through the readiness probe.
 *
 * Subsystem model:
 * - Azure AI (essential): the app's only live backend. Considered configured when an
 *   endpoint and a model deployment are set and a credential path is available
 *   (managed identity by default, or an API key when AZURE_AI_AUTH=key).
 * - PostgreSQL (optional / "when enabled"): enabled only when DATABASE_URL is set.
 *   The parity demo is stateless, so the database is optional.
 * - Blob Storage (optional / "when enabled"): enabled only when a storage account is
 *   configured. No current workflow persists files, so storage is optional too.
 *
 * SERVER-ONLY. Do not import from client components.
 */

/** Return the first non-empty, trimmed environment variable from the list. */
function firstEnv(...names: string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return undefined;
}

export interface AiConfig {
  /** True when endpoint + deployment + a usable credential path are present. */
  configured: boolean;
  endpointPresent: boolean;
  deploymentPresent: boolean;
  /** `identity` (managed identity, default) or `key`. */
  authMode: 'identity' | 'key';
  apiKeyPresent: boolean;
}

/**
 * Azure AI configuration status. Reads presence only — it NEVER contacts the model,
 * so it is safe to call on every readiness probe.
 */
export function getAiConfig(): AiConfig {
  const endpointPresent = Boolean(
    firstEnv('AZURE_AI_ENDPOINT', 'AZURE_AI_PROJECT_ENDPOINT', 'AZURE_OPENAI_ENDPOINT'),
  );
  const deploymentPresent = Boolean(firstEnv('AZURE_AI_MODEL_DEPLOYMENT', 'AZURE_OPENAI_DEPLOYMENT'));
  const authMode = (process.env.AZURE_AI_AUTH ?? 'identity').trim().toLowerCase() === 'key'
    ? 'key'
    : 'identity';
  const apiKeyPresent = Boolean(firstEnv('AZURE_AI_API_KEY', 'AZURE_OPENAI_API_KEY'));
  // Identity auth acquires a token at call time, so a credential is always "available";
  // key auth requires an actual key to be present.
  const credentialAvailable = authMode === 'identity' ? true : apiKeyPresent;
  return {
    configured: endpointPresent && deploymentPresent && credentialAvailable,
    endpointPresent,
    deploymentPresent,
    authMode,
    apiKeyPresent,
  };
}

export interface DatabaseConfig {
  /** Enabled only when DATABASE_URL is set (the demo is stateless by default). */
  enabled: boolean;
}

export function getDatabaseConfig(): DatabaseConfig {
  return { enabled: Boolean(process.env.DATABASE_URL?.trim()) };
}

export interface StorageConfig {
  /** Enabled only when a storage account is configured. */
  enabled: boolean;
  container: string;
}

export function getStorageConfig(): StorageConfig {
  const enabled = Boolean(
    process.env.AZURE_STORAGE_ACCOUNT_URL?.trim() || process.env.AZURE_STORAGE_ACCOUNT?.trim(),
  );
  return { enabled, container: process.env.AZURE_STORAGE_CONTAINER?.trim() || 'clinical-uploads' };
}

export interface IdentityConfig {
  /** True when a user-assigned managed identity client ID is provided. */
  clientIdPresent: boolean;
}

export function getIdentityConfig(): IdentityConfig {
  return { clientIdPresent: Boolean(process.env.AZURE_CLIENT_ID?.trim()) };
}

/**
 * Resolve the public base URL of the app without depending on `localhost`.
 *
 * Precedence:
 *  1. NEXTAUTH_URL — explicit override (set to the App Service URL in production).
 *  2. WEBSITE_HOSTNAME — injected automatically by Azure App Service
 *     (e.g. `app-phoenixai-xxxx.azurewebsites.net`) → assumed https.
 *  3. `http://localhost:3000` — local development fallback ONLY.
 *
 * On App Service, (1) or (2) always resolves, so no `localhost` value is used at
 * runtime. Returned as a `URL` for `metadataBase`.
 */
export function getSiteUrl(): URL {
  const explicit = process.env.NEXTAUTH_URL?.trim();
  if (explicit) {
    try {
      return new URL(explicit);
    } catch {
      /* fall through to the next source */
    }
  }
  const appServiceHost = process.env.WEBSITE_HOSTNAME?.trim();
  if (appServiceHost) {
    return new URL(`https://${appServiceHost}`);
  }
  return new URL('http://localhost:3000');
}

export interface EnvValidationResult {
  ok: boolean;
  /** Misconfigurations that will break core functionality. */
  errors: string[];
  /** Non-fatal advisories (e.g. optional subsystem partially configured). */
  warnings: string[];
}

/**
 * Validate the environment for a production App Service boot. Returns structured
 * results; it never throws, so a misconfigured demo can still start and surface the
 * problem through logs and the readiness probe rather than crash-looping.
 */
export function validateEnvironment(): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const ai = getAiConfig();
  if (!ai.endpointPresent) {
    errors.push(
      'Azure AI endpoint is not set (AZURE_AI_ENDPOINT / AZURE_AI_PROJECT_ENDPOINT / AZURE_OPENAI_ENDPOINT). AI features will fail.',
    );
  }
  if (!ai.deploymentPresent) {
    errors.push(
      'Azure AI model deployment is not set (AZURE_AI_MODEL_DEPLOYMENT / AZURE_OPENAI_DEPLOYMENT). AI features will fail.',
    );
  }
  if (ai.authMode === 'key' && !ai.apiKeyPresent) {
    errors.push('AZURE_AI_AUTH=key but no AZURE_AI_API_KEY (or AZURE_OPENAI_API_KEY) is set.');
  }
  if (ai.authMode === 'identity' && !getIdentityConfig().clientIdPresent) {
    warnings.push(
      'AZURE_CLIENT_ID is not set; DefaultAzureCredential will fall back to system-assigned identity or other sources.',
    );
  }

  // PostgreSQL and Blob Storage are optional ("when enabled"); no error when absent.
  if (!getDatabaseConfig().enabled) {
    warnings.push('DATABASE_URL is not set; PostgreSQL-backed features are disabled (stateless demo).');
  }
  if (!getStorageConfig().enabled) {
    warnings.push('Azure Storage is not configured; blob persistence is disabled (no workflow requires it).');
  }

  return { ok: errors.length === 0, errors, warnings };
}
