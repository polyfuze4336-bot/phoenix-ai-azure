/**
 * Storage integration test.
 *
 * Verifies the Azure Blob Storage facade wiring (lib/storage/storage-provider) and
 * the enablement gating that the readiness probe relies on. It never performs a
 * network call: the provider builds its Azure client lazily, so construction and the
 * config/validation surface can be asserted offline. The "when enabled" behaviour is
 * driven by environment configuration, which is a supported disabled/enabled state —
 * not a broken workflow.
 *
 * Runs under: npm run test:integration  (tsx --test)
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { getStorageProvider, buildBlobPath, validateUpload } from '../../lib/storage/storage-provider';
import { getStorageConfig } from '../../lib/config/environment';

async function withEnv(
  overrides: Record<string, string | undefined>,
  fn: () => Promise<void> | void,
): Promise<void> {
  const keys = Object.keys(overrides);
  const saved = new Map<string, string | undefined>();
  for (const key of keys) saved.set(key, process.env[key]);
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  try {
    await fn();
  } finally {
    for (const key of keys) {
      const value = saved.get(key);
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

const STORAGE_ENV = {
  AZURE_STORAGE_ACCOUNT: undefined,
  AZURE_STORAGE_ACCOUNT_URL: undefined,
  AZURE_STORAGE_CONTAINER: undefined,
} as const;

test('storage provider is a lazily-constructed singleton (no network on construct)', () => {
  const a = getStorageProvider();
  const b = getStorageProvider();
  assert.equal(a, b, 'getStorageProvider must return the same instance');
  for (const method of ['upload', 'getReadUrl', 'delete', 'exists'] as const) {
    assert.equal(typeof (a as any)[method], 'function', `provider exposes ${method}()`);
  }
});

test('storage is disabled by default (unconfigured is not "broken")', async () => {
  await withEnv({ ...STORAGE_ENV }, () => {
    const config = getStorageConfig();
    assert.equal(config.enabled, false);
  });
});

test('storage enables with a configured account and default container', async () => {
  await withEnv({ ...STORAGE_ENV, AZURE_STORAGE_ACCOUNT: 'phoenixstorage' }, () => {
    const config = getStorageConfig();
    assert.equal(config.enabled, true);
    assert.equal(config.container, 'clinical-uploads');
  });
});

test('storage honours an explicit container name', async () => {
  await withEnv(
    { ...STORAGE_ENV, AZURE_STORAGE_ACCOUNT: 'phoenixstorage', AZURE_STORAGE_CONTAINER: 'wound-images' },
    () => {
      const config = getStorageConfig();
      assert.equal(config.enabled, true);
      assert.equal(config.container, 'wound-images');
    },
  );
});

test('validateUpload + buildBlobPath enforce the storage contract', () => {
  const ok = validateUpload('image/png', 1024);
  assert.equal(ok.ok, true);

  const tooBig = validateUpload('image/png', 999 * 1024 * 1024);
  assert.equal(tooBig.ok, false);

  const badType = validateUpload('application/x-msdownload', 1024);
  assert.equal(badType.ok, false);

  const path = buildBlobPath('wound', 'image/png', 'photo.png');
  assert.match(path, /^wound\/\d{4}\/\d{2}\/\d{2}\/[0-9a-f-]+\.png$/i);
  assert.ok(!path.includes('photo'), 'must not leak the original filename');
});
