/**
 * Azure AD token acquisition for Azure OpenAI / Foundry (server-only).
 *
 * Managed identity is the PREFERRED authentication mechanism. `DefaultAzureCredential`
 * transparently uses:
 *   - a managed identity when running in Azure (system- or user-assigned; a
 *     user-assigned identity is selected via `AZURE_CLIENT_ID`), and
 *   - the developer's Azure CLI / VS Code / environment credentials locally.
 *
 * The acquired bearer token targets the Cognitive Services data plane
 * (`https://cognitiveservices.azure.com/.default`), which is the scope Azure
 * OpenAI and Foundry AI Services deployments authorize against.
 *
 * Tokens are cached in-process and refreshed shortly before expiry to avoid a
 * credential round-trip on every request. No secrets are ever logged.
 */

import { DefaultAzureCredential, type TokenCredential } from '@azure/identity';

/** Default AAD scope for the Azure OpenAI / Cognitive Services data plane. */
export const COGNITIVE_SERVICES_SCOPE = 'https://cognitiveservices.azure.com/.default';

/** Refresh the cached token when it is within this window of expiring. */
const EXPIRY_SKEW_MS = 5 * 60 * 1000;

let cachedCredential: TokenCredential | undefined;

interface CachedToken {
  token: string;
  /** Epoch ms at which the token expires. */
  expiresOnTimestamp: number;
}

let cachedToken: CachedToken | undefined;

function getCredential(): TokenCredential {
  if (!cachedCredential) {
    const managedIdentityClientId = process.env.AZURE_CLIENT_ID?.trim();
    cachedCredential = new DefaultAzureCredential(
      managedIdentityClientId ? { managedIdentityClientId } : undefined,
    );
  }
  return cachedCredential;
}

/**
 * Acquire a bearer token for the given scope, using an in-process cache.
 * Throws if no Azure identity is available (caller may then fall back to an
 * explicit API key, if configured).
 */
export async function getAzureAiToken(
  scope: string = COGNITIVE_SERVICES_SCOPE,
): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresOnTimestamp - EXPIRY_SKEW_MS > now) {
    return cachedToken.token;
  }

  const credential = getCredential();
  const accessToken = await credential.getToken(scope);
  if (!accessToken?.token) {
    throw new Error('Azure identity returned no access token.');
  }

  cachedToken = {
    token: accessToken.token,
    expiresOnTimestamp: accessToken.expiresOnTimestamp,
  };
  return accessToken.token;
}

/** Clear the cached credential + token (used by tests / on credential rotation). */
export function resetAzureAiCredentialCache(): void {
  cachedCredential = undefined;
  cachedToken = undefined;
}
