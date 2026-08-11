export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// Streaming text chat; allow a generous ceiling for long replies.
export const maxDuration = 90;

import { NextRequest } from 'next/server';
import { AiMessage } from '@/lib/ai/types';
import { getAiProvider, aiErrorResponse } from '@/lib/ai/ai-provider';
import { createTextPassthroughResponse } from '@/lib/ai/streaming/text-stream';
import { getOrCreateCorrelationId } from '@/lib/telemetry/correlation';
import { trackEvent } from '@/lib/telemetry/server';
import { checkRequestBodySize } from '@/lib/ai/validation/image-input';
import { communityChatSystemPrompt } from '@/lib/ai/prompts/community-chat';

export async function POST(request: NextRequest) {
  try {
    const bodySize = checkRequestBodySize(request.headers.get('content-length'));
    if (!bodySize.ok) {
      return new Response(JSON.stringify({ error: bodySize.error }), { status: 413 });
    }

    const body = await request.json();
    const { messages: chatMessages, lang } = body ?? {};

    const llmMessages: AiMessage[] = [
      { role: 'system', content: communityChatSystemPrompt(lang) },
      ...(chatMessages ?? [])?.map((m: any) => ({ role: m?.role ?? 'user', content: m?.content ?? '' })),
    ];

    const correlationId = getOrCreateCorrelationId(request.headers);
    // Privacy-safe marker: a community chat turn started. Only counts + the
    // correlation ID are recorded — never the chat transcript.
    trackEvent('community_chat_requested', {
      correlationId,
      messageCount: Array.isArray(chatMessages) ? chatMessages.length : 0,
    });

    let upstream;
    try {
      upstream = await getAiProvider().streamChatCompletion({
        messages: llmMessages,
        maxOutputTokens: 2000,
        correlationId,
        route: 'community-chat',
      });
    } catch (err) {
      return aiErrorResponse(err, 'API error');
    }

    return createTextPassthroughResponse(upstream.body, upstream.correlationId);
  } catch (error: any) {
    console.error('Community chat error:', error);
    return new Response(JSON.stringify({ error: error?.message ?? 'Internal error' }), { status: 500 });
  }
}
