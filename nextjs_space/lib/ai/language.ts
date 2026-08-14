export type AiResponseLanguage = 'en' | 'bm';

export function normalizeAiLanguage(value: unknown): AiResponseLanguage {
  return value === 'bm' ? 'bm' : 'en';
}

export function responseLanguageInstruction(
  language: AiResponseLanguage,
  structured = false,
): string {
  if (language === 'en') {
    return structured
      ? 'Write all clinician-facing narrative string values in English. Keep JSON property names and required enum tokens exactly as specified.'
      : 'Respond in English.';
  }

  return structured
    ? 'Write all clinician-facing narrative string values in Bahasa Malaysia. Keep JSON property names and required enum tokens (including confidence, referralLevel, booleans, and schema values) exactly as specified in English so validation remains stable.'
    : 'Respond in Bahasa Malaysia, including clinical explanations and the clinical decision-support disclaimer.';
}
