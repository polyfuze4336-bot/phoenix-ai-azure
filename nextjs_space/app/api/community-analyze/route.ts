export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { AiMessage } from '@/lib/ai/types';
import { getAiProvider, aiErrorResponse } from '@/lib/ai/ai-provider';
import { createStructuredSseResponse } from '@/lib/ai/streaming/sse';
import { parseCommunityWoundAnalysis } from '@/lib/ai/validation/wound-analysis-schema';
import { validateImageInput } from '@/lib/ai/validation/image-input';
import { newCorrelationId } from '@/lib/ai/telemetry';
import { communityWoundAnalysisSystemPrompt } from '@/lib/ai/prompts/community-wound-analysis';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image, mimeType, lang } = body ?? {};

    const validation = validateImageInput({ image, mimeType });
    if (!validation.ok) {
      return new Response(JSON.stringify({ error: validation.error }), { status: 400 });
    }

    const correlationId = newCorrelationId();
    const messages: AiMessage[] = [
      { role: 'system', content: communityWoundAnalysisSystemPrompt(lang) },
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Please check this wound/burn image and give me simple advice.' },
          { type: 'image_url', image_url: { url: `data:${validation.mimeType};base64,${image}` } },
        ],
      },
    ];

    let upstream;
    try {
      upstream = await getAiProvider().streamChatCompletion({
        messages,
        maxOutputTokens: 1500,
        responseFormat: 'json_object',
        correlationId,
        route: 'community-analyze',
      });
    } catch (err) {
      return aiErrorResponse(err, 'API error');
    }

    return createStructuredSseResponse({
      upstream: upstream.body,
      processingEvent: { status: 'processing' },
      buildResult: (buffer, phase) => parseCommunityWoundAnalysis(buffer, phase),
      correlationId: upstream.correlationId,
    });
  } catch (error: any) {
    console.error('Community analyze error:', error);
    return new Response(JSON.stringify({ error: error?.message ?? 'Internal error' }), { status: 500 });
  }
}
