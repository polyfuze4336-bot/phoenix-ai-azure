/**
 * Health / readiness integration test.
 *
 * Exercises the real readiness-aggregation logic (lib/health/readiness) that backs
 * the /api/health/ready probe, wiring together the AI, database and storage config
 * modules. Environment is controlled per-test so the assertions are deterministic
 * and never touch the network (DATABASE_URL is cleared for the config-shape cases).
 *
 * Runs under: npm run test:integration  (tsx --test)
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { getReadiness } from '../../lib/health/readiness';

/** Save the given env keys, run fn with the provided overrides, then restore. */
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

/** All the env vars that influence readiness — cleared to a known baseline. */
const READINESS_ENV = {
  AZURE_AI_ENDPOINT: undefined,
  AZURE_AI_PROJECT_ENDPOINT: undefined,
  AZURE_OPENAI_ENDPOINT: undefined,
  AZURE_AI_MODEL_DEPLOYMENT: undefined,
  AZURE_OPENAI_DEPLOYMENT: undefined,
  AZURE_AI_AUTH: undefined,
  AZURE_AI_API_KEY: undefined,
  AZURE_OPENAI_API_KEY: undefined,
  DATABASE_URL: undefined,
  AZURE_STORAGE_ACCOUNT: undefined,
  AZURE_STORAGE_ACCOUNT_URL: undefined,
  AZURE_STORAGE_CONTAINER: undefined,
} as const;

test('readiness always reports the four essential checks', async () => {
  await withEnv({ ...READINESS_ENV }, async () => {
    const readiness = await getReadiness();
    const names = readiness.checks.map((c) => c.name);
    assert.deepEqual(
      [...names].sort(),
      ['azure-ai', 'blob-storage', 'postgresql', 'runtime'],
      'must always surface runtime, azure-ai, postgresql and blob-storage checks',
    );
    assert.equal(typeof readiness.ok, 'boolean');
    assert.ok(readiness.time, 'time stamp present');
  });
});

test('runtime check is always ok', async () => {
  await withEnv({ ...READINESS_ENV }, async () => {
    const readiness = await getReadiness();
    const runtime = readiness.checks.find((c) => c.name === 'runtime');
    assert.equal(runtime?.status, 'ok');
  });
});

test('unconfigured AI degrades readiness (ok:false, not_ready)', async () => {
  await withEnv({ ...READINESS_ENV }, async () => {
    const readiness = await getReadiness();
    const ai = readiness.checks.find((c) => c.name === 'azure-ai');
    assert.equal(ai?.status, 'degraded');
    assert.equal(readiness.ok, false);
    assert.equal(readiness.status, 'not_ready');
  });
});

test('disabled database + storage are skipped, not degraded', async () => {
  await withEnv({ ...READINESS_ENV }, async () => {
    const readiness = await getReadiness();
    const db = readiness.checks.find((c) => c.name === 'postgresql');
    const blob = readiness.checks.find((c) => c.name === 'blob-storage');
    assert.equal(db?.status, 'skipped');
    assert.equal(blob?.status, 'skipped');
  });
});

test('fully configured AI (identity) makes AI healthy', async () => {
  await withEnv(
    {
      ...READINESS_ENV,
      AZURE_AI_ENDPOINT: 'https://example-foundry.cognitiveservices.azure.com',
      AZURE_AI_MODEL_DEPLOYMENT: 'gpt-4o',
      AZURE_AI_AUTH: 'identity',
    },
    async () => {
      const readiness = await getReadiness();
      const ai = readiness.checks.find((c) => c.name === 'azure-ai');
      assert.equal(ai?.status, 'ok');
      // DB + storage still disabled -> readiness overall ok (no degraded checks).
      assert.equal(readiness.ok, true);
      assert.equal(readiness.status, 'ready');
    },
  );
});

test('enabled blob storage reports ok with the configured container', async () => {
  await withEnv(
    {
      ...READINESS_ENV,
      AZURE_AI_ENDPOINT: 'https://example-foundry.cognitiveservices.azure.com',
      AZURE_AI_MODEL_DEPLOYMENT: 'gpt-4o',
      AZURE_AI_AUTH: 'identity',
      AZURE_STORAGE_ACCOUNT: 'phoenixstorage',
      AZURE_STORAGE_CONTAINER: 'clinical-uploads',
    },
    async () => {
      const readiness = await getReadiness();
      const blob = readiness.checks.find((c) => c.name === 'blob-storage');
      assert.equal(blob?.status, 'ok');
      assert.match(blob?.detail ?? '', /clinical-uploads/);
    },
  );
});
