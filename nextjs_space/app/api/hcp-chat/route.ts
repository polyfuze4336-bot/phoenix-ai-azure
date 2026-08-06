export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { AiMessage } from '@/lib/ai/types';
import { getAiProvider, aiErrorResponse } from '@/lib/ai/ai-provider';
import { createTextPassthroughResponse } from '@/lib/ai/streaming/text-stream';
import { HCP_CHAT_SYSTEM_PROMPT } from '@/lib/ai/prompts/hcp-chat';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages: chatMessages } = body ?? {};

    const llmMessages: AiMessage[] = [{ role: 'system', content: HCP_CHAT_SYSTEM_PROMPT }];
    for (const msg of (chatMessages ?? [])) {
      if (msg?.image) {
        llmMessages.push({
          role: msg?.role ?? 'user',
          content: [
            { type: 'text', text: msg?.content || 'Please analyze this image.' },
            { type: 'image_url', image_url: { url: msg.image } },
          ],
        });
      } else {
        llmMessages.push({ role: msg?.role ?? 'user', content: msg?.content ?? '' });
      }
    }

    let upstream;
    try {
      upstream = await getAiProvider().streamChatCompletion({
        messages: llmMessages,
        maxOutputTokens: 3000,
      });
    } catch (err) {
      return aiErrorResponse(err, 'LLM error');
    }

    return createTextPassthroughResponse(upstream.body);
  } catch (error: any) {
    console.error('HCP chat error:', error);
    return new Response(JSON.stringify({ error: error?.message ?? 'Internal error' }), { status: 500 });
  }
}
