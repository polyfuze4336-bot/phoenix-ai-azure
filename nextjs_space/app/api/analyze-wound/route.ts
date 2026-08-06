export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// Image analysis is the slowest call (vision model + structured output). Allow a
// generous ceiling, comfortably under the App Service front-end idle timeout (~230s).
export const maxDuration = 120;

import { NextRequest } from 'next/server';
import { AiMessage } from '@/lib/ai/types';
import { getAiProvider, aiErrorResponse } from '@/lib/ai/ai-provider';
import { createStructuredSseResponse } from '@/lib/ai/streaming/sse';
import { parseHcpWoundAnalysis } from '@/lib/ai/validation/wound-analysis-schema';
import { validateImageInput, checkRequestBodySize } from '@/lib/ai/validation/image-input';
import { newCorrelationId } from '@/lib/ai/telemetry';
import { HCP_WOUND_ANALYSIS_SYSTEM_PROMPT } from '@/lib/ai/prompts/hcp-wound-analysis';

export async function POST(request: NextRequest) {
  try {
    const bodySize = checkRequestBodySize(request.headers.get('content-length'));
    if (!bodySize.ok) {
      return new Response(JSON.stringify({ error: bodySize.error }), { status: 413 });
    }

    const body = await request.json();
    const { image, mimeType } = body ?? {};

    const validation = validateImageInput({ image, mimeType });
    if (!validation.ok) {
      return new Response(JSON.stringify({ error: validation.error }), { status: 400 });
    }

    const correlationId = newCorrelationId();
    const messages: AiMessage[] = [
      { role: 'system', content: HCP_WOUND_ANALYSIS_SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Please analyze this wound/burn image and provide a structured clinical assessment in JSON format.' },
          { type: 'image_url', image_url: { url: `data:${validation.mimeType};base64,${image}` } },
        ],
      },
    ];

    let upstream;
    try {
      upstream = await getAiProvider().streamChatCompletion({
        messages,
        maxOutputTokens: 2000,
        responseFormat: 'json_object',
        correlationId,
        route: 'analyze-wound',
        timeoutMs: 110_000,
      });
    } catch (err) {
      return aiErrorResponse(err, 'LLM API error');
    }

    return createStructuredSseResponse({
      upstream: upstream.body,
      processingEvent: { status: 'processing', message: 'Analyzing' },
      buildResult: (buffer) => parseHcpWoundAnalysis(buffer),
      correlationId: upstream.correlationId,
    });
  } catch (error: any) {
    console.error('Analyze wound error:', error);
    return new Response(JSON.stringify({ error: error?.message ?? 'Internal error' }), { status: 500 });
  }
}
