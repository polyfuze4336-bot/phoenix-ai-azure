/**
 * Abacus.AI provider — the CURRENT (source) backend.
 *
 * Preserves the exact call the original API routes made: the same endpoint,
 * `Bearer ${ABACUSAI_API_KEY}` auth, default model, and the same missing-key
 * error message/log. Retained temporarily (`AI_PROVIDER=abacus`) until the
 * Azure OpenAI cutover; see azure-foundry-provider.ts.
 *
 * Server-only: the API key is read from the server environment and is never
 * sent to the browser.
 */

import { streamOpenAiCompatible } from './openai-compatible';
import { AiChatRequest, AiError, AiProvider, AiStreamResponse } from './types';

const ABACUS_CHAT_COMPLETIONS_URL = 'https://apps.abacus.ai/v1/chat/completions';

/** The model the source app used for every route. */
export const DEFAULT_ABACUS_MODEL = 'gpt-5.4-mini';

export class AbacusProvider implements AiProvider {
  readonly name = 'abacus' as const;

  async streamChatCompletion(request: AiChatRequest): Promise<AiStreamResponse> {
    const apiKey = process.env.ABACUSAI_API_KEY;
    if (!apiKey) {
      console.error(
        '[Phoenix AI] Missing required environment variable ABACUSAI_API_KEY. Set it in .env (see .env.example) before using the AI features.',
      );
      throw new AiError({
        code: 'missing_credentials',
        status: 500,
        clientMessage:
          'Server configuration error: the AI service credential (ABACUSAI_API_KEY) is not set. See .env.example.',
      });
    }

    return streamOpenAiCompatible(request, {
      providerName: 'abacus',
      endpoint: ABACUS_CHAT_COMPLETIONS_URL,
      headers: { Authorization: `Bearer ${apiKey}` },
      model: request.model ?? DEFAULT_ABACUS_MODEL,
    });
  }
}
