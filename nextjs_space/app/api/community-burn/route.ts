export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { validateImageInput, checkRequestBodySize } from '@/lib/ai/validation/image-input';
import { getAiProvider, aiErrorResponse } from '@/lib/ai/ai-provider';
import { completeWithLanguageValidation, languageInstruction, parseRequestedLanguage } from '@/lib/ai/language';
import { parseJsonObject } from '@/lib/ai/streaming/collect';
import { classifyCommunityBurn, type BurnAnswers } from '@/lib/clinical/community-burn';

const triState = z.enum(['yes', 'no', 'unsure']);
const questionnaire = z.object({
  cause: z.enum(['flame', 'scald', 'contact', 'chemical', 'electrical', 'other', 'unsure', 'sun']),
  sizeScore: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(4)]),
  appearanceScore: z.union([z.literal(0), z.literal(2), z.literal(4)]),
  painScore: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  shortnessOfBreath: triState, chestPain: triState, dizziness: triState,
  blurredVision: triState, tinnitus: triState, blast: triState,
  lossOfConsciousness: triState, faceOrEyes: triState,
}).strict();

export async function POST(request: NextRequest) {
  const size = checkRequestBodySize(request.headers.get('content-length'));
  if (!size.ok) return Response.json({ error: size.error }, { status: 413 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request.' }, { status: 400 });
  }
  const data = body as Record<string, unknown> | null;
  const language = parseRequestedLanguage(data?.language);
  const answers = questionnaire.safeParse(data?.answers);
  if (!language || !answers.success) return Response.json({ error: 'Invalid questionnaire or language.' }, { status: 400 });
  const image = validateImageInput({ image: data?.image, mimeType: data?.mimeType });
  if (!image.ok) return Response.json({ error: image.error, code: image.code }, { status: image.code === 'IMAGE_TOO_LARGE' ? 413 : 400 });

  const result = classifyCommunityBurn(answers.data as BurnAnswers);
  try {
    const completion = await completeWithLanguageValidation({
      language, route: 'community-burn',
      messages: [
        { role: 'system', content: `You are a public-facing burn image observation assistant. ${languageInstruction(language)}
Return JSON with exactly one key "observation": a short plain-language visual observation only.
Do not classify severity, diagnose depth, estimate age, suggest disposition, give numerical burn measurements, or infer symptoms.
Do not provide hidden reasoning. The questionnaire and deterministic rules determine disposition; the image cannot override them.` },
        { role: 'user', content: [
          { type: 'text', text: 'Describe only what is visibly observable in this burn image. Do not infer its cause or urgency.' },
          { type: 'image_url', image_url: { url: `data:${image.mimeType};base64,${image.base64}` } },
        ] },
      ],
      complete: async (messages) => (await getAiProvider().streamChatCompletion({
        messages, responseFormat: 'json_object', maxOutputTokens: 160,
        route: 'community-burn', timeoutMs: 30000,
      })).body,
    });
    const parsed = parseJsonObject(completion.text);
    const observation = typeof parsed?.observation === 'string' ? parsed.observation.trim().slice(0, 400) : '';
    if (!observation) return Response.json({ error: 'Image assessment unavailable.' }, { status: 502 });
    return Response.json({ ...result, observation });
  } catch (error) {
    return aiErrorResponse(error);
  }
}
