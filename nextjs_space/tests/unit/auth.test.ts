/**
 * Unit tests — authentication mode + demo user directory.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveAuthMode, isDemoMode, isEntraMode } from '../../lib/auth/auth-config';
import {
  listPublicDemoUsers,
  findPublicDemoUser,
  verifyDemoCredentials,
} from '../../lib/auth/demo-users';

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

test('listPublicDemoUsers: returns the 3 demo users WITHOUT passwords', () => {
  const users = listPublicDemoUsers();
  assert.equal(users.length, 3);
  const emails = users.map((u) => u.email).sort();
  assert.deepEqual(emails, ['admin@phoenix.my', 'doctor@phoenix.my', 'nurse@phoenix.my']);
  for (const u of users) {
    assert.ok(!('password' in (u as Record<string, unknown>)), 'public user must not carry a password');
    assert.ok(u.name && u.role);
  }
});

test('findPublicDemoUser: case-insensitive email lookup, null on miss', () => {
  const doctor = findPublicDemoUser('DOCTOR@phoenix.my');
  assert.equal(doctor?.name, 'Dr. Ahmad Faizal');
  assert.equal(doctor?.role, 'Pakar Perubatan Kecemasan');
  assert.equal(findPublicDemoUser('nobody@phoenix.my'), null);
});

test('verifyDemoCredentials: correct shared password returns the AuthUser', () => {
  const user = verifyDemoCredentials('doctor@phoenix.my', 'phoenix2026');
  assert.ok(user);
  assert.equal(user?.email, 'doctor@phoenix.my');
  assert.equal(user?.name, 'Dr. Ahmad Faizal');
});

test('verifyDemoCredentials: admin uses its own password', () => {
  assert.ok(verifyDemoCredentials('admin@phoenix.my', 'admin123'));
  assert.equal(verifyDemoCredentials('admin@phoenix.my', 'phoenix2026'), null);
});

test('verifyDemoCredentials: wrong password returns null', () => {
  assert.equal(verifyDemoCredentials('doctor@phoenix.my', 'wrong'), null);
  assert.equal(verifyDemoCredentials('nobody@phoenix.my', 'phoenix2026'), null);
});

test('verifyDemoCredentials: email match is case-insensitive', () => {
  assert.ok(verifyDemoCredentials('DOCTOR@PHOENIX.MY', 'phoenix2026'));
});
