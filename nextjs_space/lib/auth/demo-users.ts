/**
 * Phoenix AI — demo user directory (SERVER-ONLY).
 *
 * This module holds the fictional demo credentials. It must only ever be
 * imported by server code (the /api/auth routes via the demo provider). The
 * browser bundle renders a NON-SECRET public directory instead, so no password
 * ever reaches client source.
 *
 * The default users, names, roles and passwords match the original mock login so
 * the demo experience is byte-for-byte familiar. Passwords can be overridden per
 * environment via DEMO_AUTH_PASSWORD / DEMO_AUTH_ADMIN_PASSWORD without changing
 * code. These are DEMONSTRATION credentials only — not real accounts.
 */
import type { AuthUser, PublicDemoUser } from './types';

interface DemoRecord extends PublicDemoUser {
  password: string;
}

// Parity defaults — mirror the original Abacus.AI mock login.
const DEFAULT_SHARED_PASSWORD = 'phoenix2026';
const DEFAULT_ADMIN_PASSWORD = 'admin123';

function buildDirectory(): DemoRecord[] {
  const sharedPassword = process.env.DEMO_AUTH_PASSWORD?.trim() || DEFAULT_SHARED_PASSWORD;
  const adminPassword = process.env.DEMO_AUTH_ADMIN_PASSWORD?.trim() || DEFAULT_ADMIN_PASSWORD;

  return [
    { email: 'doctor@phoenix.my', name: 'Dr. Ahmad Faizal', role: 'Pakar Perubatan Kecemasan', password: sharedPassword },
    { email: 'nurse@phoenix.my', name: 'Nurse Siti Aminah', role: 'Jururawat Kanan', password: sharedPassword },
    { email: 'admin@phoenix.my', name: 'Admin Phoenix', role: 'Pentadbir Sistem', password: adminPassword },
  ];
}

function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

function toAuthUser(record: DemoRecord): AuthUser {
  return { name: record.name, role: record.role, email: record.email };
}

/** Non-secret directory (no passwords) for rendering quick-login cards. */
export function listPublicDemoUsers(): PublicDemoUser[] {
  return buildDirectory().map(({ email, name, role }) => ({ email, name, role }));
}

/** Look up a public user by email (no password comparison). */
export function findPublicDemoUser(email: string): PublicDemoUser | null {
  const target = normalizeEmail(email);
  const record = buildDirectory().find((u) => u.email === target);
  return record ? { email: record.email, name: record.name, role: record.role } : null;
}

/** Verify email + password against the demo directory; null when invalid. */
export function verifyDemoCredentials(email: string, password: string): AuthUser | null {
  const target = normalizeEmail(email);
  const record = buildDirectory().find((u) => u.email === target && u.password === password);
  return record ? toAuthUser(record) : null;
}
