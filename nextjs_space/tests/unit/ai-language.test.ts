import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LANGUAGE_REWRITE_INSTRUCTION,
  completeWithLanguageValidation,
  detectOutputLanguage,
  languageInstruction,
  parseRequestedLanguage,
  textForLanguageDetection,
} from '../../lib/ai/language';

function completionStream(text: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`));
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });
}

test('parseRequestedLanguage accepts only en and ms', () => {
  assert.equal(parseRequestedLanguage('en'), 'en');
  assert.equal(parseRequestedLanguage('ms'), 'ms');
  assert.equal(parseRequestedLanguage('bm'), null);
  assert.equal(parseRequestedLanguage(undefined), null);
});

test('strict instructions prohibit mixed-language prose', () => {
  assert.match(languageInstruction('en'), /entirely in English/i);
  assert.match(languageInstruction('en'), /Do not mix Bahasa Malaysia prose/i);
  assert.match(languageInstruction('ms'), /entirely in Bahasa Malaysia/i);
  assert.match(languageInstruction('ms'), /Do not mix English prose/i);
  assert.equal(
    LANGUAGE_REWRITE_INSTRUCTION,
    'Rewrite the complete response in the required language without changing its clinical meaning.',
  );
});

test('detector recognizes confident English and Bahasa Malaysia prose', () => {
  assert.equal(
    detectOutputLanguage('This is a minor wound and you should keep it clean with a dressing.'),
    'en',
  );
  assert.equal(
    detectOutputLanguage('Ini adalah luka ringan dan anda perlu memastikan luka ini bersih dengan pembalut.'),
    'ms',
  );
  assert.equal(detectOutputLanguage('TBSA 4%, N/A'), 'unknown');
});

test('structured detection inspects JSON values rather than English property names', () => {
  const output = JSON.stringify({
    description: 'Ini adalah luka ringan dan anda perlu memastikan luka ini bersih.',
    recommendation: 'Sila dapatkan rawatan jika keadaan menjadi lebih teruk.',
  });
  assert.doesNotMatch(textForLanguageDetection(output), /description|recommendation/);
  assert.equal(detectOutputLanguage(output), 'ms');
});

test('language validation retries once on a confident mismatch', async () => {
  const outputs = [
    'This is a burn and you should keep it clean with a sterile dressing.',
    'Ini adalah kelecuran dan anda perlu memastikan kawasan ini bersih dengan pembalut steril.',
  ];
  let calls = 0;
  const result = await completeWithLanguageValidation({
    messages: [{ role: 'system', content: languageInstruction('ms') }],
    language: 'ms',
    route: 'test',
    complete: async () => completionStream(outputs[calls++] ?? outputs[1]),
  });

  assert.equal(calls, 2);
  assert.equal(result.retried, true);
  assert.equal(result.detectedLanguage, 'ms');
});

test('language validation never exceeds one rewrite', async () => {
  let calls = 0;
  const result = await completeWithLanguageValidation({
    messages: [{ role: 'system', content: languageInstruction('ms') }],
    language: 'ms',
    route: 'test',
    complete: async () => {
      calls += 1;
      return completionStream('This is still English and it should remain a complete clinical response.');
    },
  });

  assert.equal(calls, 2);
  assert.equal(result.retried, true);
  assert.equal(result.detectedLanguage, 'en');
});
