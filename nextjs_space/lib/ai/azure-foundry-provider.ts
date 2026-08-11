/**
 * Azure OpenAI / Microsoft Foundry provider — the migration TARGET backend.
 *
 * Azure OpenAI (and Foundry AI Services deployments) expose an OpenAI-compatible
 * `/chat/completions` API, so this reuses the shared transport. The concrete
 * model is selected by the Azure *deployment* name (in the URL), not the request
 * body's `model` field. Vision, streaming and `response_format: json_object` are
 * all supported on vision-capable deployments (e.g. gpt-4o), preserving the
 * app's multimodal + structured behaviour.
 *
 * Activated with `AI_PROVIDER=azure`. Server-only: credentials/tokens are read
 * and acquired on the server and never reach the browser.
 *
 * Authentication (managed identity PREFERRED):
 *   - By default, acquires an Azure AD bearer token via `DefaultAzureCredential`
 *     (managed identity in Azure — user-assigned via `AZURE_CLIENT_ID`; Azure CLI
 *     locally). No API key is stored.
 *   - `AZURE_AI_API_KEY` (or legacy `AZURE_OPENAI_API_KEY`) is an EXPLICIT,
 *     TEMPORARY fallback: used only when `AZURE_AI_AUTH=key`, or when a token
 *     cannot be acquired and a key is configured.
 *
 * Configuration (new names, with legacy fallbacks for continuity):
 *   AZURE_AI_ENDPOINT | AZURE_AI_PROJECT_ENDPOINT | AZURE_OPENAI_ENDPOINT
 *   AZURE_AI_MODEL_DEPLOYMENT | AZURE_OPENAI_DEPLOYMENT
 *   AZURE_AI_API_VERSION | AZURE_OPENAI_API_VERSION (defaulted)
 *   AZURE_AI_API_KEY | AZURE_OPENAI_API_KEY   (fallback only)
 *   AZURE_AI_AUTH = identity | key            (default: identity)
 *   AZURE_CLIENT_ID                           (user-assigned managed identity)
 */

import { COGNITIVE_SERVICES_SCOPE, getAzureAiToken } from './azure-credential';
import { streamOpenAiCompatible } from './openai-compatible';
import { AiChatRequest, AiError, AiProvider, AiStreamResponse } from './types';

/** Stable, widely-available Azure OpenAI data-plane API version. */
export const DEFAULT_AZURE_OPENAI_API_VERSION = '2024-10-21';

/** Provider-level resilience defaults (only applied when the caller omits them). */
const DEFAULT_AZURE_TIMEOUT_MS = 60_000;
const DEFAULT_AZURE_RETRIES = 2;

function firstEnv(...names: string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return undefined;
}

/** Build the chat-completions URL for a deployment. Accepts a bare resource
 *  endpoint or a full `.../chat/completions` URL (adding api-version if absent). */
function buildChatCompletionsUrl(endpoint: string, deployment: string, apiVersion: string): string {
  const trimmed = endpoint.replace(/\/+$/, '');
  if (/\/chat\/completions(\?|$)/i.test(trimmed)) {
    return /[?&]api-version=/i.test(trimmed)
      ? trimmed
      : `${trimmed}${trimmed.includes('?') ? '&' : '?'}api-version=${encodeURIComponent(apiVersion)}`;
  }
  return `${trimmed}/openai/deployments/${encodeURIComponent(deployment)}/chat/completions?api-version=${encodeURIComponent(apiVersion)}`;
}

const MISSING_CONFIG_MESSAGE =
  'Server configuration error: Azure AI is not configured. Set AZURE_AI_ENDPOINT ' +
  '(or AZURE_AI_PROJECT_ENDPOINT) and AZURE_AI_MODEL_DEPLOYMENT, and authenticate ' +
  'via managed identity or AZURE_AI_API_KEY. See .env.example.';

export class AzureFoundryProvider implements AiProvider {
  readonly name = 'azure' as const;

  async streamChatCompletion(request: AiChatRequest): Promise<AiStreamResponse> {
    const endpoint = firstEnv(
      'AZURE_AI_ENDPOINT',
      'AZURE_AI_PROJECT_ENDPOINT',
      'AZURE_OPENAI_ENDPOINT',
    );
    // The request model (if any) selects a specific deployment; otherwise the
    // configured default deployment is used.
    const deployment =
      request.model ?? firstEnv('AZURE_AI_MODEL_DEPLOYMENT', 'AZURE_OPENAI_DEPLOYMENT');
    const apiVersion =
      firstEnv('AZURE_AI_API_VERSION', 'AZURE_OPENAI_API_VERSION') ??
      DEFAULT_AZURE_OPENAI_API_VERSION;
    const apiKey = firstEnv('AZURE_AI_API_KEY', 'AZURE_OPENAI_API_KEY');
    const authMode = (process.env.AZURE_AI_AUTH ?? 'identity').trim().toLowerCase();

    if (!endpoint || !deployment) {
      console.error(`[Phoenix AI] ${MISSING_CONFIG_MESSAGE}`);
      throw new AiError({
        code: 'missing_credentials',
        status: 500,
        clientMessage: MISSING_CONFIG_MESSAGE,
      });
    }

    const url = buildChatCompletionsUrl(endpoint, deployment, apiVersion);
    const headers = await this.resolveAuthHeaders(authMode, apiKey);

    // Apply provider-level resilience defaults only where the caller left gaps.
    const resilientRequest: AiChatRequest = {
      ...request,
      timeoutMs: request.timeoutMs ?? DEFAULT_AZURE_TIMEOUT_MS,
      retries: request.retries ?? DEFAULT_AZURE_RETRIES,
    };

    return streamOpenAiCompatible(resilientRequest, {
      providerName: 'azure',
      endpoint: url,
      headers,
      // Azure resolves the concrete model from the deployment in the URL; the
      // body `model` field is echoed/ignored, so we pass the deployment name.
      model: deployment,
      route: request.route,
      // Ask the model to include token usage in the final stream chunk so token
      // telemetry is exact when supported (harmless when it is not).
      extraBody: { stream_options: { include_usage: true } },
      collectUsage: true,
    });
  }

  /** Resolve the auth headers, preferring a managed-identity bearer token and
   *  falling back to an API key only when explicitly configured or necessary. */
  private async resolveAuthHeaders(
    authMode: string,
    apiKey: string | undefined,
  ): Promise<Record<string, string>> {
    // Explicit API-key mode (temporary fallback).
    if (authMode === 'key' || authMode === 'apikey' || authMode === 'api_key') {
      if (!apiKey) {
        console.error(
          '[Phoenix AI] AZURE_AI_AUTH=key but no AZURE_AI_API_KEY / AZURE_OPENAI_API_KEY is set.',
        );
        throw new AiError({
          code: 'missing_credentials',
          status: 500,
          clientMessage: MISSING_CONFIG_MESSAGE,
        });
      }
      return { 'api-key': apiKey };
    }

    // Preferred: managed identity / Azure AD bearer token.
    try {
      const token = await getAzureAiToken(COGNITIVE_SERVICES_SCOPE);
      return { Authorization: `Bearer ${token}` };
    } catch (err) {
      // Fall back to an API key only if one is configured.
      if (apiKey) {
        console.warn(
          '[Phoenix AI] Managed-identity token acquisition failed; falling back to AZURE_AI_API_KEY (temporary).',
        );
        return { 'api-key': apiKey };
      }
      console.error(
        '[Phoenix AI] Could not acquire a managed-identity token and no AZURE_AI_API_KEY fallback is configured.',
      );
      throw new AiError({
        code: 'missing_credentials',
        status: 500,
        clientMessage: MISSING_CONFIG_MESSAGE,
        cause: err,
      });
    }
  }
}
