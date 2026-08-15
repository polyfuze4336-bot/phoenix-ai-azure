export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// Vision analysis; generous ceiling under the App Service front-end idle timeout.
export const maxDuration = 120;

import { NextRequest } from 'next/server';
import { AiMessage } from '@/lib/ai/types';
import { getAiProvider, aiErrorResponse } from '@/lib/ai/ai-provider';
import { createResultSseResponse } from '@/lib/ai/streaming/sse';
import { parseCommunityWoundAnalysis } from '@/lib/ai/validation/wound-analysis-schema';
import { validateImageInput, checkRequestBodySize } from '@/lib/ai/validation/image-input';
import { getOrCreateCorrelationId } from '@/lib/telemetry/correlation';
import { trackEvent } from '@/lib/telemetry/server';
import { communityWoundAnalysisSystemPrompt } from '@/lib/ai/prompts/community-wound-analysis';
import { completeWithLanguageValidation, parseRequestedLanguage } from '@/lib/ai/language';

export async function POST(request: NextRequest) {
  try {
    const bodySize = checkRequestBodySize(request.headers.get('content-length'));
    if (!bodySize.ok) {
      return new Response(JSON.stringify({ error: bodySize.error }), { status: 413 });
    }

    const body = await request.json();
    const { image, mimeType } = body ?? {};
    const language = parseRequestedLanguage(body?.language);
    if (!language) {
      return new Response(JSON.stringify({ error: 'Invalid language. Use "en" or "ms".' }), { status: 400 });
    }

    const validation = validateImageInput({ image, mimeType });
    if (!validation.ok) {
      return new Response(JSON.stringify({ error: validation.error }), { status: 400 });
    }

    const correlationId = getOrCreateCorrelationId(request.headers);
    // Privacy-safe marker: a community image-analysis request started. Only the
    // correlation ID + a flag are recorded — never the image or any advice text.
    trackEvent('community_analysis_requested', { correlationId, hasImage: true });
    const messages: AiMessage[] = [
      { role: 'system', content: communityWoundAnalysisSystemPrompt(language) },
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Please check this wound/burn image and give me simple advice.' },
          { type: 'image_url', image_url: { url: `data:${validation.mimeType};base64,${validation.base64}` } },
        ],
      },
    ];

    let completion;
    try {
      completion = await completeWithLanguageValidation({
        messages,
        language,
        route: 'community-analyze',
        correlationId,
        complete: async (completionMessages) => (await getAiProvider().streamChatCompletion({
          messages: completionMessages,
          maxOutputTokens: 1500,
          responseFormat: 'json_object',
          correlationId,
          route: 'community-analyze',
          timeoutMs: 110_000,
        })).body,
      });
    } catch (err) {
      return aiErrorResponse(err, 'API error');
    }

    return createResultSseResponse({
      result: parseCommunityWoundAnalysis(completion.text, 'done'),
      processingEvent: { status: 'processing' },
      correlationId,
    });
  } catch (error: any) {
    console.error('Community analyze error:', error);
    return new Response(JSON.stringify({ error: error?.message ?? 'Internal error' }), { status: 500 });
  }
}
