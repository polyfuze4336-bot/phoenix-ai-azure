/**
 * Responsible AI — control register integrity.
 *
 * Guards the single source of truth (`lib/rai/controls.ts`) so the AI Assurance page
 * and documentation cannot drift into inconsistency: unique IDs, valid enums, and
 * evidence for every control.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  RAI_CONTROLS,
  ASSURANCE_STAGES,
  controlStatusCounts,
  RAI_PRINCIPLE_LABELS,
  ASSURANCE_LAYER_LABELS,
  CONTROL_STATUS_LABELS,
} from '../../lib/rai/controls';
import {
  completeWithLanguageValidation,
  languageInstruction,
  languageTelemetryProperties,
  withLanguageInstruction,
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

test('control IDs are unique', () => {
  const ids = RAI_CONTROLS.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('every control has a known principle, layer, status and evidence', () => {
  for (const c of RAI_CONTROLS) {
    assert.ok(RAI_PRINCIPLE_LABELS[c.principle], `${c.id} principle`);
    assert.ok(ASSURANCE_LAYER_LABELS[c.layer], `${c.id} layer`);
    assert.ok(CONTROL_STATUS_LABELS[c.status], `${c.id} status`);
    assert.ok(c.evidence.length > 0, `${c.id} must cite evidence`);
    assert.ok(c.title.trim().length > 0, `${c.id} title`);
    assert.ok(c.description.trim().length > 0, `${c.id} description`);
  }
});

test('evidence paths look like repo-relative source files', () => {
  for (const c of RAI_CONTROLS) {
    for (const e of c.evidence) {
      assert.match(e, /\.(ts|tsx|prisma|mjs|md)$/, `${c.id} evidence ${e}`);
      assert.ok(!e.startsWith('/'), `${c.id} evidence should be repo-relative: ${e}`);
    }
  }
});

test('status counts sum to the number of controls', () => {
  const counts = controlStatusCounts();
  assert.equal(counts.active + counts.partial + counts.planned, RAI_CONTROLS.length);
  // The register must reflect a real, implemented posture — most controls active.
  assert.ok(counts.active >= counts.partial + counts.planned);
});

test('presentation-dependent controls are partial and not user-visible', () => {
  for (const id of ['RAI-TRANS-003', 'RAI-ACCT-001']) {
    const control = RAI_CONTROLS.find((candidate) => candidate.id === id);
    assert.equal(control?.status, 'partial', id);
    assert.equal(control?.userVisible, false, id);
  }
});

test('RAI-PRIV-007 is active and states legal and clinical boundaries in both languages', () => {
  const control = RAI_CONTROLS.find((item) => item.id === 'RAI-PRIV-007');
  assert.equal(control?.status, 'active');
  assert.equal(control?.userVisible, true);

  const translations = readFileSync(new URL('../../lib/i18n.ts', import.meta.url), 'utf8');
  assert.match(translations, /applicable Malaysian personal data protection requirements/);
  assert.match(translations, /does not replace professional clinical judgement/);
  assert.match(translations, /keperluan perlindungan data peribadi Malaysia yang berkenaan/);
  assert.match(translations, /tidak menggantikan pertimbangan profesional klinikal/);
  assert.doesNotMatch(translations, /PDPA Compliant/);
});

test('the five assurance stages are present and ordered', () => {
  assert.deepEqual(
    ASSURANCE_STAGES.map((s) => s.layer),
    ['input', 'analysis', 'output', 'oversight', 'operations'],
  );
});

test('RAI-INCL-003 applies strict, non-mixed language instructions', () => {
  assert.match(withLanguageInstruction('Clinical system prompt', 'en'), /entirely in English/i);
  assert.match(languageInstruction('en'), /Do not mix Bahasa Malaysia prose/i);
  assert.match(withLanguageInstruction('Clinical system prompt', 'ms'), /entirely in Bahasa Malaysia/i);
  assert.match(languageInstruction('ms'), /Do not mix English prose/i);
});

test('RAI-INCL-003 permits no more than one language rewrite', async () => {
  let calls = 0;
  const result = await completeWithLanguageValidation({
    messages: [{ role: 'system', content: languageInstruction('ms') }],
    language: 'ms',
    route: 'rai-test',
    complete: async () => {
      calls += 1;
      return completionStream('This is a complete clinical response and you should keep the wound clean with a dressing.');
    },
  });

  assert.equal(calls, 2);
  assert.equal(result.retried, true);
});

test('RAI-INCL-003 telemetry contains metadata only', () => {
  const properties = languageTelemetryProperties({
    correlationId: 'test-correlation',
    route: 'analyze-wound',
    requestedLanguage: 'ms',
    detectedLanguage: 'en',
    attempt: 1,
  });

  assert.deepEqual(Object.keys(properties).sort(), [
    'attempt',
    'correlationId',
    'detectedLanguage',
    'requestedLanguage',
    'route',
  ]);
  assert.doesNotMatch(JSON.stringify(properties), /image|message|prompt|response|clinicalContent/i);
});
