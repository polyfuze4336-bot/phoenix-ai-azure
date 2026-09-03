/**
 * Phoenix AI — demo account (SERVER-ONLY).
 *
 * DEMO/TEST ACCOUNT ONLY — NOT FOR PRODUCTION USE.
 * This module must only ever be imported by server code.
 */
import type { AuthUser } from './types';

interface DemoRecord extends AuthUser {
  password: string;
}

const DEMO_ACCOUNT: DemoRecord = {
  email: 'admin.phoenix',
  name: 'Admin Phoenix',
  role: 'Pentadbir Sistem',
  password: 'bfg123',
};

function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/** Verify the user ID and password against the single demo account. */
export function verifyDemoCredentials(userId: string, password: string): AuthUser | null {
  if (normalizeEmail(userId) !== DEMO_ACCOUNT.email || password !== DEMO_ACCOUNT.password) {
    return null;
  }
  return {
    email: DEMO_ACCOUNT.email,
    name: DEMO_ACCOUNT.name,
    role: DEMO_ACCOUNT.role,
  };
}
