/**
 * Unit tests — Phoenix AI v2.0 feature flags.
 *
 * Verifies the additive v2 flag layer (see ADR-0004) behaves safely: every flag
 * defaults to ENABLED and only the exact string "false" disables it. Runs under
 * the Node.js built-in test runner via tsx: npm run test:unit
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  featureFlags,
  isFeatureEnabled,
  isV2Enabled,
  type FeatureFlagKey,
} from '../../lib/v2/feature-flags';

const ALL_KEYS: FeatureFlagKey[] = [
  'v2Enabled',
  'cases',
  'reports',
  'insights',
  'guidelineAi',
  'notifications',
  'commandPalette',
];

test('feature flags: every known key is present and boolean', () => {
  for (const key of ALL_KEYS) {
    assert.equal(typeof featureFlags[key], 'boolean', `flag ${key} must be boolean`);
  }
});

test('feature flags: default ON when no env var is set (test env)', () => {
  // The test process sets no NEXT_PUBLIC_FEATURE_* vars, so all flags default ON.
  for (const key of ALL_KEYS) {
    assert.equal(isFeatureEnabled(key), true, `flag ${key} should default to enabled`);
  }
});

test('feature flags: isV2Enabled mirrors the v2Enabled flag', () => {
  assert.equal(isV2Enabled(), featureFlags.v2Enabled);
});

test('feature flags: isFeatureEnabled returns a boolean for every key', () => {
  for (const key of ALL_KEYS) {
    assert.equal(typeof isFeatureEnabled(key), 'boolean');
  }
});
