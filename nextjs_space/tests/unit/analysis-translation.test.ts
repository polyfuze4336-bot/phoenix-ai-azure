import test from 'node:test';
import assert from 'node:assert/strict';
import {
  analysisTranslationEntries,
  applyAnalysisTranslations,
} from '../../lib/ai/analysis/translation';

const source = {
  language: 'en',
  woundCategory: 'Burn',
  severity: 'Moderate',
  tbsaEstimate: '15.0',
  characteristics: 'Blistering across 15.0% TBSA',
  management: ['Cool the burn for 20 minutes'],
  structured: {
    analysisQuality: 'HIGH',
    parkland: {
      indicated: 'yes',
      total24hMl: 4200,
      summary: 'Give 4200 mL over 24 hours',
    },
  },
  meta: { analysisId: 'unchanged-id' },
};

test('translation entries exclude canonical, numeric, language, and metadata fields', () => {
  const entries = analysisTranslationEntries(source);
  assert.deepEqual(entries.map((entry) => entry.id), [
    'characteristics',
    'management.0',
    'structured.parkland.summary',
  ]);
});

test('translated narrative preserves canonical and deterministic clinical values', () => {
  const result = applyAnalysisTranslations(source, [
    { id: 'characteristics', text: 'Lepuh pada 15.0% TBSA' },
    { id: 'management.0', text: 'Sejukkan kelecuran selama 20 minit' },
    { id: 'structured.parkland.summary', text: 'Berikan 4200 mL selama 24 jam' },
  ], 'ms');

  assert.equal(result.language, 'ms');
  assert.equal(result.woundCategory, 'Burn');
  assert.equal(result.severity, 'Moderate');
  assert.equal(result.tbsaEstimate, '15.0');
  assert.equal((result.structured as any).parkland.total24hMl, 4200);
  assert.equal((result.meta as any).analysisId, 'unchanged-id');
});

test('translation is rejected if any numeric value changes', () => {
  assert.throws(() => applyAnalysisTranslations(source, [
    { id: 'characteristics', text: 'Lepuh pada 16.0% TBSA' },
    { id: 'management.0', text: 'Sejukkan kelecuran selama 20 minit' },
    { id: 'structured.parkland.summary', text: 'Berikan 4200 mL selama 24 jam' },
  ], 'ms'), /numeric value/);
});

test('translation is rejected if fields are omitted or duplicated', () => {
  assert.throws(() => applyAnalysisTranslations(source, [
    { id: 'characteristics', text: 'Lepuh pada 15.0% TBSA' },
  ], 'ms'), /preserve the result structure/);
});

test('translation is rejected for unsafe object paths', () => {
  const unsafeSource = JSON.parse('{"__proto__":{"guidance":"Keep clean"}}') as Record<string, unknown>;

  assert.throws(() => applyAnalysisTranslations(unsafeSource, [
    { id: '__proto__.guidance', text: 'Pastikan bersih' },
  ], 'ms'), /unsafe result path/);
});
