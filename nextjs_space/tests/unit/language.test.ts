/**
 * Unit tests — language switching (i18n translation lookup).
 * Tests the pure `t(key, lang)` function and the translation dictionary.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { t, translations, type Lang } from '../../lib/i18n';
import { normalizeAiLanguage, responseLanguageInstruction } from '../../lib/ai/language';
import { hcpChatSystemPrompt } from '../../lib/ai/prompts/hcp-chat';

test('t: returns English and Bahasa Malaysia values for a known key', () => {
  assert.equal(t('landing.tagline', 'en'), 'Burn & Wound Care Assessment Tool');
  assert.equal(t('landing.tagline', 'bm'), 'Alat Penilaian Penjagaan Luka & Kelecuran');
});

test('t: en and bm differ for representative keys', () => {
  const keys = ['landing.tagline', 'hcp.tbsa', 'hcp.parkland', 'community.firstaid'];
  for (const key of keys) {
    assert.notEqual(t(key, 'en'), t(key, 'bm'), `expected en != bm for ${key}`);
  }
});

test('t: unknown key echoes the key back (safe fallback)', () => {
  assert.equal(t('this.key.does.not.exist', 'en'), 'this.key.does.not.exist');
  assert.equal(t('this.key.does.not.exist', 'bm'), 'this.key.does.not.exist');
});

test('translations: every entry provides both languages, non-empty', () => {
  const langs: Lang[] = ['en', 'bm'];
  for (const [key, entry] of Object.entries(translations)) {
    for (const lang of langs) {
      assert.equal(typeof entry[lang], 'string', `${key}.${lang} must be a string`);
      assert.ok(entry[lang].length > 0, `${key}.${lang} must be non-empty`);
    }
  }
});

test('translations: switching language returns a different rendered string set', () => {
  const enValues = Object.keys(translations).map((k) => t(k, 'en'));
  const bmValues = Object.keys(translations).map((k) => t(k, 'bm'));
  // At least the majority of strings should be translated (not identical).
  const identical = enValues.filter((v, i) => v === bmValues[i]).length;
  assert.ok(identical < enValues.length / 2, 'most strings should differ between en and bm');
});

test('AI language normalization accepts only the supported Bahasa Malaysia code', () => {
  assert.equal(normalizeAiLanguage('bm'), 'bm');
  assert.equal(normalizeAiLanguage('en'), 'en');
  assert.equal(normalizeAiLanguage('ms'), 'en');
  assert.equal(normalizeAiLanguage({}), 'en');
});

test('structured Bahasa Malaysia instruction preserves machine-readable tokens', () => {
  const instruction = responseLanguageInstruction('bm', true);
  assert.match(instruction, /Bahasa Malaysia/);
  assert.match(instruction, /JSON property names/);
  assert.match(instruction, /enum tokens/);
});

test('HCP chat prompt follows the selected response language', () => {
  assert.match(hcpChatSystemPrompt('bm'), /Respond in Bahasa Malaysia/);
  assert.match(hcpChatSystemPrompt('en'), /Respond in English/);
});
