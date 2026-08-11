/**
 * Unit tests — runtime configuration + environment validation.
 * Manipulates process.env within each test (saved/restored) since the config
 * helpers read the environment at call time.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getAiConfig,
  getDatabaseConfig,
  getStorageConfig,
  getIdentityConfig,
  getSiteUrl,
  validateEnvironment,
} from '../../lib/config/environment';

const AI_KEYS = [
  'AZURE_AI_ENDPOINT', 'AZURE_AI_PROJECT_ENDPOINT', 'AZURE_OPENAI_ENDPOINT',
  'AZURE_AI_MODEL_DEPLOYMENT', 'AZURE_OPENAI_DEPLOYMENT', 'AZURE_AI_AUTH',
  'AZURE_AI_API_KEY', 'AZURE_OPENAI_API_KEY', 'AZURE_CLIENT_ID',
  'DATABASE_URL', 'AZURE_STORAGE_ACCOUNT_URL', 'AZURE_STORAGE_ACCOUNT',
  'AZURE_STORAGE_CONTAINER', 'NEXTAUTH_URL', 'WEBSITE_HOSTNAME',
];

function withEnv(overrides: Record<string, string | undefined>, fn: () => void): void {
  const saved: Record<string, string | undefined> = {};
  for (const k of AI_KEYS) saved[k] = process.env[k];
  // Clear all first for a clean slate.
  for (const k of AI_KEYS) delete process.env[k];
  for (const [k, v] of Object.entries(overrides)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  try {
    fn();
  } finally {
    for (const k of AI_KEYS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  }
}

test('getAiConfig: identity mode configured with endpoint + deployment', () => {
  withEnv(
    { AZURE_AI_ENDPOINT: 'https://x.openai.azure.com', AZURE_AI_MODEL_DEPLOYMENT: 'gpt-4o' },
    () => {
      const cfg = getAiConfig();
      assert.equal(cfg.configured, true);
      assert.equal(cfg.authMode, 'identity');
      assert.equal(cfg.endpointPresent, true);
      assert.equal(cfg.deploymentPresent, true);
    },
  );
});

test('getAiConfig: key mode requires an API key to be configured', () => {
  withEnv(
    {
      AZURE_AI_ENDPOINT: 'https://x.openai.azure.com',
      AZURE_AI_MODEL_DEPLOYMENT: 'gpt-4o',
      AZURE_AI_AUTH: 'key',
    },
    () => {
      assert.equal(getAiConfig().configured, false);
    },
  );
  withEnv(
    {
      AZURE_AI_ENDPOINT: 'https://x.openai.azure.com',
      AZURE_AI_MODEL_DEPLOYMENT: 'gpt-4o',
      AZURE_AI_AUTH: 'key',
      AZURE_AI_API_KEY: 'secret',
    },
    () => {
      const cfg = getAiConfig();
      assert.equal(cfg.authMode, 'key');
      assert.equal(cfg.configured, true);
    },
  );
});

test('validateEnvironment: missing AI endpoint/deployment yields ok:false with errors', () => {
  withEnv({}, () => {
    const result = validateEnvironment();
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((e) => e.includes('endpoint')));
    assert.ok(result.errors.some((e) => e.includes('deployment')));
  });
});

test('validateEnvironment: fully configured AI (identity) yields ok:true', () => {
  withEnv(
    {
      AZURE_AI_ENDPOINT: 'https://x.openai.azure.com',
      AZURE_AI_MODEL_DEPLOYMENT: 'gpt-4o',
      AZURE_CLIENT_ID: '00000000-0000-0000-0000-000000000000',
    },
    () => {
      assert.equal(validateEnvironment().ok, true);
    },
  );
});

test('getDatabaseConfig: enabled only when DATABASE_URL is set', () => {
  withEnv({}, () => assert.equal(getDatabaseConfig().enabled, false));
  withEnv({ DATABASE_URL: 'postgres://u:p@h/db' }, () =>
    assert.equal(getDatabaseConfig().enabled, true),
  );
});

test('getStorageConfig: default container and enablement', () => {
  withEnv({}, () => {
    const cfg = getStorageConfig();
    assert.equal(cfg.enabled, false);
    assert.equal(cfg.container, 'clinical-uploads');
  });
  withEnv(
    { AZURE_STORAGE_ACCOUNT_URL: 'https://a.blob.core.windows.net', AZURE_STORAGE_CONTAINER: 'my-container' },
    () => {
      const cfg = getStorageConfig();
      assert.equal(cfg.enabled, true);
      assert.equal(cfg.container, 'my-container');
    },
  );
});

test('getIdentityConfig: reflects AZURE_CLIENT_ID presence', () => {
  withEnv({}, () => assert.equal(getIdentityConfig().clientIdPresent, false));
  withEnv({ AZURE_CLIENT_ID: 'abc' }, () => assert.equal(getIdentityConfig().clientIdPresent, true));
});

test('getSiteUrl: precedence NEXTAUTH_URL > WEBSITE_HOSTNAME > localhost', () => {
  withEnv({ NEXTAUTH_URL: 'https://app.example.com' }, () =>
    assert.equal(getSiteUrl().toString(), 'https://app.example.com/'),
  );
  withEnv({ WEBSITE_HOSTNAME: 'app-phoenix.azurewebsites.net' }, () =>
    assert.equal(getSiteUrl().toString(), 'https://app-phoenix.azurewebsites.net/'),
  );
  withEnv({}, () => assert.equal(getSiteUrl().toString(), 'http://localhost:3000/'));
});
