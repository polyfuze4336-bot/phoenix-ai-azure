export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { AiMessage } from '@/lib/ai/types';
import { getAiProvider, aiErrorResponse } from '@/lib/ai/ai-provider';
import { createTextPassthroughResponse } from '@/lib/ai/streaming/text-stream';
import { newCorrelationId } from '@/lib/ai/telemetry';
import { communityChatSystemPrompt } from '@/lib/ai/prompts/community-chat';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages: chatMessages, lang } = body ?? {};

    const llmMessages: AiMessage[] = [
      { role: 'system', content: communityChatSystemPrompt(lang) },
      ...(chatMessages ?? [])?.map((m: any) => ({ role: m?.role ?? 'user', content: m?.content ?? '' })),
    ];

    let upstream;
    try {
      upstream = await getAiProvider().streamChatCompletion({
        messages: llmMessages,
        maxOutputTokens: 2000,
        correlationId: newCorrelationId(),
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
