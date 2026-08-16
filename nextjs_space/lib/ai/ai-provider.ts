/**
 * AI provider factory + shared error mapping.
 *
 * `getAiProvider()` returns the Azure OpenAI (Microsoft Foundry) backend — the
 * app's single production AI provider. The provider abstraction is retained so
 * API routes stay backend-agnostic and a future provider could be added without
 * touching route code.
 *
 * Server-only: providers read credentials from `process.env`; never import this
 * from client code.
 */

import { AzureFoundryProvider } from './azure-foundry-provider';
import { AiError, AiProvider } from './types';

/** Instantiate the configured AI provider (Azure OpenAI / Foundry). */
export function getAiProvider(): AiProvider {
  return new AzureFoundryProvider();
}

/**
 * Build a faithful JSON error `Response` from a thrown provider error.
 *
 * `upstreamPrefix` gives each route its own wording for upstream failures
 * (e.g. `LLM API error`, `LLM error`, `API error`) so client-visible error
 * bodies are stable. Credential/config errors keep the provider's safe client
 * message; anything unexpected falls back to a generic 500 (matching the
 * routes' original outer catch).
 */
export function aiErrorResponse(err: unknown, _upstreamPrefix?: string): Response {
  if (err instanceof AiError) {
    return jsonError(err.clientMessage, err.status, err.category);
  }
  return jsonError('The AI assessment could not be completed. Please try again.', 500, 'UNKNOWN');
}

function jsonError(message: string, status: number, code: string): Response {
  return new Response(JSON.stringify({ error: message, code }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
