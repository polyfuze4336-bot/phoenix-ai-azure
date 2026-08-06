export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image, mimeType, lang } = body ?? {};

    if (!image) {
      return new Response(JSON.stringify({ error: 'No image provided' }), { status: 400 });
    }

    const apiKey = process.env.ABACUSAI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), { status: 500 });
    }

    const langInstructions = lang === 'bm' ? 'Respond in Bahasa Malaysia.' : 'Respond in English.';

    const systemPrompt = `You are Phoenix AI Community Health Assistant. You help members of the public understand their wounds and burns using simple, easy-to-understand language. NO medical jargon.

${langInstructions}

Analyze the wound/burn image and respond in JSON:
{
  "description": "Simple, friendly description of what the wound/burn looks like. Use everyday language.",
  "recommendation": "One of: 'This looks like something you can take care of at home' / 'We recommend you see a doctor or visit a clinic' / 'This looks serious - please go to the emergency room or call 999 immediately'",
  "firstAidTips": "Simple first aid steps they can do right now"
}

Always include a reminder that this is not a medical diagnosis.
Respond with raw JSON only. Do not include code blocks, markdown, or any other formatting.`;

    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-5.4-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Please check this wound/burn image and give me simple advice.' },
              { type: 'image_url', image_url: { url: `data:${mimeType || 'image/jpeg'};base64,${image}` } },
            ],
          },
        ],
        stream: true,
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response?.ok) {
      const errText = await response?.text?.();
      return new Response(JSON.stringify({ error: `API error: ${errText}` }), { status: 500 });
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    let buffer = '';
    let partialRead = '';

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response?.body?.getReader();
        try {
          while (true) {
            const { done, value } = await (reader?.read() ?? { done: true, value: undefined });
            if (done) break;
            partialRead += decoder.decode(value, { stream: true });
            let lines = partialRead.split('\n');
            partialRead = lines?.pop() ?? '';
            for (const line of (lines ?? [])) {
              if (line?.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  try {
                    const finalResult = JSON.parse(buffer);
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: 'completed', result: finalResult })}\n\n`));
                  } catch (e: any) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: 'completed', result: { description: buffer, recommendation: 'Please see a doctor for proper assessment.', firstAidTips: 'Keep the wound clean and covered.' } })}\n\n`));
                  }
                  return;
                }
                try {
                  const parsed = JSON.parse(data);
                  buffer += parsed?.choices?.[0]?.delta?.content ?? '';
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: 'processing' })}\n\n`));
                } catch (e: any) { /* skip */ }
              }
            }
          }
          if (buffer) {
            try {
              const finalResult = JSON.parse(buffer);
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: 'completed', result: finalResult })}\n\n`));
            } catch (e: any) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: 'completed', result: { description: buffer, recommendation: 'Please see a doctor.', firstAidTips: 'Keep clean and covered.' } })}\n\n`));
            }
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
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
    });
  } catch (error: any) {
    console.error('Community analyze error:', error);
    return new Response(JSON.stringify({ error: error?.message ?? 'Internal error' }), { status: 500 });
  }
}
