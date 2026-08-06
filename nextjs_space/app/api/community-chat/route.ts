export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages: chatMessages, lang } = body ?? {};

    const apiKey = process.env.ABACUSAI_API_KEY;
    if (!apiKey) {
      console.error('[Phoenix AI] Missing required environment variable ABACUSAI_API_KEY. Set it in .env (see .env.example) before using the AI features.');
      return new Response(JSON.stringify({ error: 'Server configuration error: the AI service credential (ABACUSAI_API_KEY) is not set. See .env.example.' }), { status: 500 });
    }

    const langInstr = lang === 'bm' ? 'Respond in Bahasa Malaysia.' : 'Respond in English.';

    const systemMessage = {
      role: 'system',
      content: `You are Phoenix AI Community Health Assistant. You help members of the public with questions about burns, wounds, and first aid.

${langInstr}

Rules:
- Use simple, friendly language. NO medical jargon.
- Always prioritize safety. If the situation sounds serious, immediately recommend calling 999 (Malaysia emergency number).
- Provide practical first aid advice for minor injuries.
- Always remind them to see a healthcare professional for serious injuries.
- Be warm, caring, and supportive.
- Format your responses with clear, short paragraphs.
- If they describe a severe burn (large area, charred/white skin, electrical, chemical), immediately recommend going to the emergency room and calling 999.`,
    };

    const llmMessages = [systemMessage, ...(chatMessages ?? [])?.map((m: any) => ({ role: m?.role ?? 'user', content: m?.content ?? '' }))];

    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-5.4-mini',
        messages: llmMessages,
        stream: true,
        max_tokens: 2000,
      }),
    });

    if (!response?.ok) {
      const errText = await response?.text?.();
      return new Response(JSON.stringify({ error: `API error: ${errText}` }), { status: 500 });
    }

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response?.body?.getReader();
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();
        try {
          while (true) {
            const { done, value } = await (reader?.read() ?? { done: true, value: undefined });
            if (done) break;
            controller.enqueue(encoder.encode(decoder.decode(value)));
          }
        } catch (error: any) {
          console.error('Stream error:', error);
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
    });
  } catch (error: any) {
    console.error('Community chat error:', error);
    return new Response(JSON.stringify({ error: error?.message ?? 'Internal error' }), { status: 500 });
  }
}
