export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { AiMessage } from '@/lib/ai/types';
import { getAiProvider, aiErrorResponse } from '@/lib/ai/ai-provider';
import { createStructuredSseResponse } from '@/lib/ai/streaming/sse';
import { parseHcpWoundAnalysis } from '@/lib/ai/validation/wound-analysis-schema';
import { HCP_WOUND_ANALYSIS_SYSTEM_PROMPT } from '@/lib/ai/prompts/hcp-wound-analysis';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image, mimeType } = body ?? {};

    if (!image) {
      return new Response(JSON.stringify({ error: 'No image provided' }), { status: 400 });
    }

    const messages: AiMessage[] = [
      { role: 'system', content: HCP_WOUND_ANALYSIS_SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Please analyze this wound/burn image and provide a structured clinical assessment in JSON format.' },
          { type: 'image_url', image_url: { url: `data:${mimeType || 'image/jpeg'};base64,${image}` } },
        ],
      },
    ];

    let upstream;
    try {
      upstream = await getAiProvider().streamChatCompletion({
        messages,
        maxOutputTokens: 2000,
        responseFormat: 'json_object',
      });
    } catch (err) {
      return aiErrorResponse(err, 'LLM API error');
    }

    return createStructuredSseResponse({
      upstream: upstream.body,
      processingEvent: { status: 'processing', message: 'Analyzing' },
      buildResult: (buffer) => parseHcpWoundAnalysis(buffer),
    });
  } catch (error: any) {
    console.error('Analyze wound error:', error);
    return new Response(JSON.stringify({ error: error?.message ?? 'Internal error' }), { status: 500 });
  }
}
