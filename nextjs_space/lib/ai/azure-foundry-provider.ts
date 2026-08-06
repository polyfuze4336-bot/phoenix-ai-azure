/**
 * Azure OpenAI (Foundry) provider — the migration TARGET backend.
 *
 * Azure OpenAI exposes an OpenAI-compatible `/chat/completions` API, so it reuses
 * the shared transport. The concrete model is selected by the Azure *deployment*
 * name (in the URL), not the request body's `model` field. Vision, streaming and
 * `response_format: json_object` are all supported on vision-capable deployments
 * (e.g. gpt-4o), preserving the app's multimodal + structured behaviour.
 *
 * Activated with `AI_PROVIDER=azure`. Server-only: the API key is read from the
 * server environment and is never sent to the browser. (A managed-identity token
 * path can replace the key later without touching callers.)
 */

import { streamOpenAiCompatible } from './openai-compatible';
import { AiChatRequest, AiError, AiProvider, AiStreamResponse } from './types';

/** Stable, widely-available Azure OpenAI data-plane API version. */
export const DEFAULT_AZURE_OPENAI_API_VERSION = '2024-10-21';

export class AzureFoundryProvider implements AiProvider {
  readonly name = 'azure' as const;

  async streamChatCompletion(request: AiChatRequest): Promise<AiStreamResponse> {
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    // The request model (if any) selects a specific deployment; otherwise the
    // configured default deployment is used.
    const deployment = request.model ?? process.env.AZURE_OPENAI_DEPLOYMENT;
    const apiVersion = process.env.AZURE_OPENAI_API_VERSION ?? DEFAULT_AZURE_OPENAI_API_VERSION;

    if (!endpoint || !apiKey || !deployment) {
      console.error(
        '[Phoenix AI] Missing Azure OpenAI configuration. Set AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY and AZURE_OPENAI_DEPLOYMENT in the server environment (see .env.example) before using the AI features.',
      );
      throw new AiError({
        code: 'missing_credentials',
        status: 500,
        clientMessage:
          'Server configuration error: Azure OpenAI is not configured (AZURE_OPENAI_ENDPOINT / AZURE_OPENAI_API_KEY / AZURE_OPENAI_DEPLOYMENT). See .env.example.',
      });
    }

    const base = endpoint.replace(/\/+$/, '');
    const url = `${base}/openai/deployments/${encodeURIComponent(deployment)}/chat/completions?api-version=${encodeURIComponent(apiVersion)}`;

    return streamOpenAiCompatible(request, {
      providerName: 'azure',
      endpoint: url,
      headers: { 'api-key': apiKey },
      // Azure resolves the concrete model from the deployment in the URL; the
      // body `model` field is echoed/ignored, so we pass the deployment name.
      model: deployment,
    });
  }
}
