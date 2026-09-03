/**
 * Unit tests — authentication mode + demo user directory.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveAuthMode, isDemoMode, isEntraMode } from '../../lib/auth/auth-config';
import { verifyDemoCredentials } from '../../lib/auth/demo-users';

function withAuthMode(value: string | undefined, fn: () => void): void {
  const saved = process.env.AUTH_MODE;
  if (value === undefined) delete process.env.AUTH_MODE;
  else process.env.AUTH_MODE = value;
  try {
    fn();
  } finally {
    if (saved === undefined) delete process.env.AUTH_MODE;
    else process.env.AUTH_MODE = saved;
  }
}

test('resolveAuthMode: defaults to demo when unset or unknown', () => {
  withAuthMode(undefined, () => {
    assert.equal(resolveAuthMode(), 'demo');
    assert.equal(isDemoMode(), true);
    assert.equal(isEntraMode(), false);
  });
  withAuthMode('something-else', () => assert.equal(resolveAuthMode(), 'demo'));
});

test('resolveAuthMode: AUTH_MODE=entra selects entra (case-insensitive)', () => {
  withAuthMode('entra', () => {
    assert.equal(resolveAuthMode(), 'entra');
    assert.equal(isEntraMode(), true);
    assert.equal(isDemoMode(), false);
  });
  withAuthMode('ENTRA', () => assert.equal(resolveAuthMode(), 'entra'));
});

test('verifyDemoCredentials: the intended demo account authenticates', () => {
  const user = verifyDemoCredentials('admin.phoenix', 'bfg123');
  assert.ok(user);
  assert.equal(user?.email, 'admin.phoenix');
  assert.equal(user?.name, 'Admin Phoenix');
});

test('verifyDemoCredentials: rejects the correct user ID with a wrong password', () => {
  assert.equal(verifyDemoCredentials('admin.phoenix', 'wrong'), null);
});

test('verifyDemoCredentials: rejects a wrong user ID with the correct password', () => {
  assert.equal(verifyDemoCredentials('not.admin', 'bfg123'), null);
});

test('verifyDemoCredentials: rejects all legacy demo accounts', () => {
  assert.equal(verifyDemoCredentials('doctor@phoenix.my', 'phoenix2026'), null);
  assert.equal(verifyDemoCredentials('nurse@phoenix.my', 'phoenix2026'), null);
  assert.equal(verifyDemoCredentials('admin@phoenix.my', 'admin123'), null);
});

test('verifyDemoCredentials: user ID match is case-insensitive', () => {
  assert.ok(verifyDemoCredentials('ADMIN.PHOENIX', 'bfg123'));
});
