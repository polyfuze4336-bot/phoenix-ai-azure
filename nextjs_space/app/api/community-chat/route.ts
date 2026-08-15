export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// Streaming text chat; allow a generous ceiling for long replies.
export const maxDuration = 90;

import { NextRequest } from 'next/server';
import { AiMessage } from '@/lib/ai/types';
import { getAiProvider, aiErrorResponse } from '@/lib/ai/ai-provider';
import { createTextCompletionResponse } from '@/lib/ai/streaming/text-stream';
import { getOrCreateCorrelationId } from '@/lib/telemetry/correlation';
import { trackEvent } from '@/lib/telemetry/server';
import { checkRequestBodySize } from '@/lib/ai/validation/image-input';
import { communityChatSystemPrompt } from '@/lib/ai/prompts/community-chat';
import { completeWithLanguageValidation, parseRequestedLanguage } from '@/lib/ai/language';

export async function POST(request: NextRequest) {
  try {
    const bodySize = checkRequestBodySize(request.headers.get('content-length'));
    if (!bodySize.ok) {
      return new Response(JSON.stringify({ error: bodySize.error }), { status: 413 });
    }

    const body = await request.json();
    const { messages: chatMessages } = body ?? {};
    const language = parseRequestedLanguage(body?.language);
    if (!language) {
      return new Response(JSON.stringify({ error: 'Invalid language. Use "en" or "ms".' }), { status: 400 });
    }

    const llmMessages: AiMessage[] = [
      { role: 'system', content: communityChatSystemPrompt(language) },
      ...(chatMessages ?? [])?.map((m: any) => ({ role: m?.role ?? 'user', content: m?.content ?? '' })),
    ];

    const correlationId = getOrCreateCorrelationId(request.headers);
    // Privacy-safe marker: a community chat turn started. Only counts + the
    // correlation ID are recorded — never the chat transcript.
    trackEvent('community_chat_requested', {
      correlationId,
      messageCount: Array.isArray(chatMessages) ? chatMessages.length : 0,
    });

    let completion;
    try {
      completion = await completeWithLanguageValidation({
        messages: llmMessages,
        language,
        route: 'community-chat',
        correlationId,
        complete: async (messages) => (await getAiProvider().streamChatCompletion({
          messages,
          maxOutputTokens: 2000,
          correlationId,
          route: 'community-chat',
        })).body,
      });
    } catch (err) {
      return aiErrorResponse(err, 'API error');
    }

    return createTextCompletionResponse(completion.text, correlationId);
  } catch (error: any) {
    console.error('Community chat error:', error);
    return new Response(JSON.stringify({ error: error?.message ?? 'Internal error' }), { status: 500 });
  }
}
