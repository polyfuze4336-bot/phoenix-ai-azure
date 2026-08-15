import type { AppLanguage } from '@/lib/i18n';
import { collectCompletion, parseJsonObject, type CollectedCompletion } from './streaming/collect';
import type { AiMessage } from './types';
import { trackEvent } from '@/lib/telemetry/server';

export type DetectedLanguage = AppLanguage | 'unknown';

const ENGLISH_MARKERS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'because', 'but', 'by', 'can', 'for', 'from',
  'has', 'have', 'if', 'in', 'is', 'it', 'may', 'not', 'of', 'on', 'or', 'should', 'that',
  'the', 'this', 'to', 'was', 'were', 'will', 'with', 'you', 'your',
]);

const MALAY_MARKERS = new Set([
  'adalah', 'akan', 'anda', 'atau', 'bagi', 'bahawa', 'boleh', 'dalam', 'dan', 'dengan',
  'di', 'ini', 'itu', 'jika', 'juga', 'kepada', 'kerana', 'mungkin', 'oleh', 'pada',
  'perlu', 'sila', 'tidak', 'untuk', 'yang',
]);

export const LANGUAGE_REWRITE_INSTRUCTION =
  'Rewrite the complete response in the required language without changing its clinical meaning.';

export function parseRequestedLanguage(value: unknown): AppLanguage | null {
  return value === 'en' || value === 'ms' ? value : null;
}

export function languageInstruction(language: AppLanguage): string {
  return language === 'ms'
    ? 'Respond entirely in Bahasa Malaysia. Do not mix English prose into the response. Preserve clinical terms, proper nouns, abbreviations, numeric values, and required JSON property names and enum values.'
    : 'Respond entirely in English. Do not mix Bahasa Malaysia prose into the response. Preserve clinical terms, proper nouns, abbreviations, numeric values, and required JSON property names and enum values.';
}

export function withLanguageInstruction(systemPrompt: string, language: AppLanguage): string {
  return `${systemPrompt.trim()}\n\n=== REQUIRED OUTPUT LANGUAGE ===\n${languageInstruction(language)}`;
}

function collectStringValues(value: unknown, output: string[]): void {
  if (typeof value === 'string') {
    output.push(value);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectStringValues(item, output));
    return;
  }
  if (value && typeof value === 'object') {
    Object.values(value).forEach((item) => collectStringValues(item, output));
  }
}

export function textForLanguageDetection(output: string): string {
  const parsed = parseJsonObject(output);
  if (!parsed) return output;
  const values: string[] = [];
  collectStringValues(parsed, values);
  return values.join(' ');
}

export function detectOutputLanguage(output: string): DetectedLanguage {
  const words = textForLanguageDetection(output).toLowerCase().match(/[a-z]+/g) ?? [];
  let english = 0;
  let malay = 0;

  for (const word of words) {
    if (ENGLISH_MARKERS.has(word)) english += 1;
    if (MALAY_MARKERS.has(word)) malay += 1;
  }

  const strongest = Math.max(english, malay);
  const weakest = Math.min(english, malay);
  if (strongest < 4 || strongest < weakest * 1.5 + 2) return 'unknown';
  return english > malay ? 'en' : 'ms';
}

export function isConfidentLanguageMismatch(output: string, requested: AppLanguage): boolean {
  const detected = detectOutputLanguage(output);
  return detected !== 'unknown' && detected !== requested;
}

export interface LanguageValidatedCompletion extends CollectedCompletion {
  detectedLanguage: DetectedLanguage;
  retried: boolean;
}

export function languageTelemetryProperties(options: {
  correlationId?: string;
  route: string;
  requestedLanguage: AppLanguage;
  detectedLanguage: DetectedLanguage;
  attempt: 1 | 2;
  matched?: boolean;
}): Record<string, string | number | boolean | undefined> {
  return {
    correlationId: options.correlationId,
    route: options.route,
    requestedLanguage: options.requestedLanguage,
    detectedLanguage: options.detectedLanguage,
    attempt: options.attempt,
    ...(options.matched === undefined ? {} : { matched: options.matched }),
  };
}

export async function completeWithLanguageValidation(options: {
  messages: AiMessage[];
  language: AppLanguage;
  route: string;
  correlationId?: string;
  complete: (messages: AiMessage[]) => Promise<ReadableStream<Uint8Array>>;
}): Promise<LanguageValidatedCompletion> {
  const first = await collectCompletion(await options.complete(options.messages));
  const firstDetected = detectOutputLanguage(first.text);

  if (firstDetected === 'unknown' || firstDetected === options.language) {
    return { ...first, detectedLanguage: firstDetected, retried: false };
  }

  trackEvent('ai_output_language_mismatch', languageTelemetryProperties({
    correlationId: options.correlationId,
    route: options.route,
    requestedLanguage: options.language,
    detectedLanguage: firstDetected,
    attempt: 1,
  }));

  const rewriteMessages: AiMessage[] = [
    ...options.messages,
    { role: 'assistant', content: first.text },
    {
      role: 'user',
      content: `${LANGUAGE_REWRITE_INSTRUCTION} ${languageInstruction(options.language)}`,
    },
  ];
  const rewritten = await collectCompletion(await options.complete(rewriteMessages));
  const finalDetected = detectOutputLanguage(rewritten.text);

  trackEvent('ai_output_language_rewrite_completed', languageTelemetryProperties({
    correlationId: options.correlationId,
    route: options.route,
    requestedLanguage: options.language,
    detectedLanguage: finalDetected,
    attempt: 2,
    matched: finalDetected === options.language || finalDetected === 'unknown',
  }));

  return { ...rewritten, detectedLanguage: finalDetected, retried: true };
}
