export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages: chatMessages } = body ?? {};

    const apiKey = process.env.ABACUSAI_API_KEY;
    if (!apiKey) {
      console.error('[Phoenix AI] Missing required environment variable ABACUSAI_API_KEY. Set it in .env (see .env.example) before using the AI features.');
      return new Response(JSON.stringify({ error: 'Server configuration error: the AI service credential (ABACUSAI_API_KEY) is not set. See .env.example.' }), { status: 500 });
    }

    const systemMessage = {
      role: 'system',
      content: `You are Phoenix AI, an expert clinical AI assistant specialized in burn and wound care for Malaysian healthcare professionals. You are a burn and wound specialist consultant.

You can:
- Answer clinical questions about burns, wounds, TBSA calculation, fluid resuscitation, management protocols
- Provide evidence-based guidelines aligned with Malaysian CPG
- Discuss wound assessment, dressing selection, infection management
- Help with Parkland Formula calculations
- Provide referral criteria and surgical indications

Always:
- Use professional clinical language appropriate for healthcare professionals
- Reference evidence-based guidelines when possible
- Include disclaimers about clinical judgment
- Be thorough but concise
- Format responses clearly with bullet points or numbered lists when appropriate`,
    };

    const llmMessages = [systemMessage];
    for (const msg of (chatMessages ?? [])) {
      if (msg?.image) {
        llmMessages.push({
          role: msg?.role ?? 'user',
          content: [
            { type: 'text', text: msg?.content || 'Please analyze this image.' },
            { type: 'image_url', image_url: { url: msg.image } },
          ] as any,
        });
      } else {
        llmMessages.push({ role: msg?.role ?? 'user', content: msg?.content ?? '' });
      }
    }

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
        max_tokens: 3000,
      }),
    });

    if (!response?.ok) {
      const errText = await response?.text?.();
      return new Response(JSON.stringify({ error: `LLM error: ${errText}` }), { status: 500 });
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
            const chunk = decoder.decode(value);
            controller.enqueue(encoder.encode(chunk));
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
    console.error('HCP chat error:', error);
    return new Response(JSON.stringify({ error: error?.message ?? 'Internal error' }), { status: 500 });
  }
}
