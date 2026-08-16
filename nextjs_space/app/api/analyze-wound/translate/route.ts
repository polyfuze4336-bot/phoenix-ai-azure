export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { aiErrorResponse } from '@/lib/ai/ai-provider';
import { translateAnalysisResult } from '@/lib/ai/analysis/translation';
import { parseRequestedLanguage } from '@/lib/ai/language';
import { getOrCreateCorrelationId } from '@/lib/telemetry/correlation';

const MAX_TRANSLATION_REQUEST_BYTES = 512 * 1024;

export async function POST(request: NextRequest) {
  const declaredLength = Number.parseInt(request.headers.get('content-length') ?? '', 10);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_TRANSLATION_REQUEST_BYTES) {
    return Response.json({ error: 'Analysis result is too large to translate.' }, { status: 413 });
  }

  try {
    const body = await request.json();
    const language = parseRequestedLanguage(body?.language);
    if (!language) {
      return Response.json({ error: 'Invalid language. Use "en" or "ms".' }, { status: 400 });
    }
    if (!body?.result || typeof body.result !== 'object' || Array.isArray(body.result)) {
      return Response.json({ error: 'A structured analysis result is required.' }, { status: 400 });
    }

    const result = await translateAnalysisResult(
      body.result as Record<string, unknown>,
      language,
      getOrCreateCorrelationId(request.headers),
    );
    return Response.json({ result });
  } catch (error) {
    return aiErrorResponse(error, 'Translation error');
  }
}
