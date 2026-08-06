export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { AiMessage } from '@/lib/ai/types';
import { getAiProvider, aiErrorResponse } from '@/lib/ai/ai-provider';
import { createStructuredSseResponse } from '@/lib/ai/streaming/sse';
import { parseCommunityWoundAnalysis } from '@/lib/ai/validation/wound-analysis-schema';
import { communityWoundAnalysisSystemPrompt } from '@/lib/ai/prompts/community-wound-analysis';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image, mimeType, lang } = body ?? {};

    if (!image) {
      return new Response(JSON.stringify({ error: 'No image provided' }), { status: 400 });
    }

    const messages: AiMessage[] = [
      { role: 'system', content: communityWoundAnalysisSystemPrompt(lang) },
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Please check this wound/burn image and give me simple advice.' },
          { type: 'image_url', image_url: { url: `data:${mimeType || 'image/jpeg'};base64,${image}` } },
        ],
      },
    ];

    let upstream;
    try {
      upstream = await getAiProvider().streamChatCompletion({
        messages,
        maxOutputTokens: 1500,
        responseFormat: 'json_object',
      });
    } catch (err) {
      return aiErrorResponse(err, 'API error');
    }

    return createStructuredSseResponse({
      upstream: upstream.body,
      processingEvent: { status: 'processing' },
      buildResult: (buffer, phase) => parseCommunityWoundAnalysis(buffer, phase),
    });
  } catch (error: any) {
    console.error('Community analyze error:', error);
    return new Response(JSON.stringify({ error: error?.message ?? 'Internal error' }), { status: 500 });
  }
}
