/**
 * AI provider factory + shared error mapping.
 *
 * `getAiProvider()` selects the backend from the `AI_PROVIDER` environment
 * variable so API routes stay provider-agnostic:
 *   - `abacus` (default, temporary) → the current Abacus.AI backend
 *   - `azure`  → Azure OpenAI (Foundry)
 * Once the Azure OpenAI cutover is complete, the Azure environment sets
 * `AI_PROVIDER=azure` (the intended production default on Azure).
 *
 * Server-only: providers read credentials from `process.env`; never import this
 * from client code.
 */

import { AbacusProvider } from './abacus-provider';
import { AzureFoundryProvider } from './azure-foundry-provider';
import { AiError, AiProvider, AiProviderName } from './types';

/** Resolve the configured provider name (defaults to `abacus` for now). */
export function resolveProviderName(): AiProviderName {
  const raw = (process.env.AI_PROVIDER ?? 'abacus').trim().toLowerCase();
  return raw === 'azure' ? 'azure' : 'abacus';
}

/** Instantiate the configured AI provider. */
export function getAiProvider(): AiProvider {
  return resolveProviderName() === 'azure' ? new AzureFoundryProvider() : new AbacusProvider();
}

/**
 * Build a faithful JSON error `Response` from a thrown provider error.
 *
 * `upstreamPrefix` reproduces each route's original wording for upstream
 * failures (e.g. `LLM API error`, `LLM error`, `API error`) so client-visible
 * error bodies are unchanged. Credential/config errors keep the provider's safe
 * client message; anything unexpected falls back to a generic 500 (matching the
 * routes' original outer catch).
 */
export function aiErrorResponse(err: unknown, upstreamPrefix: string): Response {
  if (err instanceof AiError) {
    if (err.code === 'upstream_error') {
      const detail = err.upstreamText ?? err.clientMessage;
      return jsonError(`${upstreamPrefix}: ${detail}`, err.status);
    }
    return jsonError(err.clientMessage, err.status);
  }
  return jsonError((err as { message?: string })?.message ?? 'Internal error', 500);
}

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), { status });
}
