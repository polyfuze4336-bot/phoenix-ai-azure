/**
 * Unit tests — language switching (i18n translation lookup).
 * Tests the pure `t(key, lang)` function and the translation dictionary.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  APP_LANGUAGE_STORAGE_KEY,
  normalizeLanguage,
  t,
  translateCanonicalValue,
  translations,
  type AppLanguage,
} from '../../lib/i18n';

test('t: returns English and Bahasa Malaysia values for a known key', () => {
  assert.equal(t('landing.tagline', 'en'), 'Burn & Wound Care Assessment Tool');
  assert.equal(t('landing.tagline', 'ms'), 'Alat Penilaian Penjagaan Luka & Kelecuran');
});

test('t: en and ms differ for representative keys', () => {
  const keys = ['landing.tagline', 'hcp.tbsa', 'hcp.parkland', 'community.firstaid'];
  for (const key of keys) {
    assert.notEqual(t(key, 'en'), t(key, 'ms'), `expected en != ms for ${key}`);
  }
});

test('t: unknown key echoes the key back (safe fallback)', () => {
  assert.equal(t('this.key.does.not.exist', 'en'), 'this.key.does.not.exist');
  assert.equal(t('this.key.does.not.exist', 'ms'), 'this.key.does.not.exist');
});

test('translations: every entry provides both languages, non-empty', () => {
  const langs: AppLanguage[] = ['en', 'ms'];
  for (const [key, entry] of Object.entries(translations)) {
    for (const lang of langs) {
      assert.equal(typeof entry[lang], 'string', `${key}.${lang} must be a string`);
      assert.ok(entry[lang].length > 0, `${key}.${lang} must be non-empty`);
    }
  }
});

test('translations: switching language returns a different rendered string set', () => {
  const enValues = Object.keys(translations).map((k) => t(k, 'en'));
  const msValues = Object.keys(translations).map((k) => t(k, 'ms'));
  // At least the majority of strings should be translated (not identical).
  const identical = enValues.filter((v, i) => v === msValues[i]).length;
  assert.ok(identical < enValues.length / 2, 'most strings should differ between en and ms');
});

test('normalizeLanguage: accepts only canonical application language codes', () => {
  assert.equal(normalizeLanguage('ms'), 'ms');
  assert.equal(normalizeLanguage('en'), 'en');
  assert.equal(normalizeLanguage('bm'), 'en');
  assert.equal(normalizeLanguage(null), 'en');
  assert.equal(APP_LANGUAGE_STORAGE_KEY, 'phoenix-ai-language');
});

test('canonical clinical values are translated only at presentation time', () => {
  assert.equal(translateCanonicalValue('HIGH', 'en'), 'High');
  assert.equal(translateCanonicalValue('HIGH', 'ms'), 'Tinggi');
  assert.equal(translateCanonicalValue('emergency', 'ms'), 'Kecemasan');
  assert.equal(translateCanonicalValue('custom clinical phrase', 'ms'), 'custom clinical phrase');
  assert.equal(translateCanonicalValue(null, 'ms'), 'Tidak berkenaan');
});
