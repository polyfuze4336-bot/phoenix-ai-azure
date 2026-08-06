/**
 * Phoenix AI — authentication abstraction (contract).
 *
 * PARITY + SECURITY NOTES
 * - The first Azure parity release ships DEMO authentication only: a small,
 *   fixed directory of fictional users that mirrors the original Abacus.AI mock
 *   login. It is deliberately NOT enterprise authentication.
 * - This contract is provider-neutral so a real `entra` (Microsoft Entra ID)
 *   provider can be added later WITHOUT touching the login UI or route guard.
 * - Demo passwords are resolved SERVER-SIDE only (see demo-users.ts). This file
 *   and the public directory the browser renders contain NO secrets.
 */

/** Supported authentication modes. Selected via the AUTH_MODE feature flag. */
export type AuthMode = 'demo' | 'entra';

/**
 * Canonical HCP role keys. Entra application roles / groups are mapped to one of
 * these; any of them grants access to the HCP portal. The community portal is
 * public and does not require a role.
 */
export type HcpRoleKey = 'administrator' | 'doctor' | 'nurse';

/** Human-readable label rendered in the HCP portal for each role key. */
export const HCP_ROLE_LABELS: Record<HcpRoleKey, string> = {
  administrator: 'Administrator',
  doctor: 'Doctor',
  nurse: 'Nurse',
};

/** The session identity persisted by the client (shape unchanged for parity). */
export interface AuthUser {
  name: string;
  role: string;
  email: string;
}

/**
 * Server-validated session payload for Entra mode. Carried in a signed,
 * httpOnly cookie (never sessionStorage) and verified on the server / in
 * middleware before any protected HCP route or API is served.
 */
export interface SessionUser {
  name: string;
  email: string;
  roleKey: HcpRoleKey;
  roleLabel: string;
}

/**
 * Non-secret directory entry safe to render in the browser (quick-login cards).
 * Never includes a password.
 */
export interface PublicDemoUser {
  email: string;
  name: string;
  role: string;
}

/**
 * Authentication provider contract. Implementations are SERVER-ONLY and are
 * reached exclusively through the /api/auth routes.
 */
export interface AuthProvider {
  readonly mode: AuthMode;
  /** Verify an email + password and return the session identity. */
  authenticate(email: string, password: string): Promise<AuthUser>;
  /** Issue a demo session for a known public user without a password. */
  quickAuthenticate(email: string): Promise<AuthUser>;
  /** Non-secret directory for rendering quick-login cards. */
  listPublicUsers(): PublicDemoUser[];
}

export type AuthErrorCode =
  | 'invalid_credentials'
  | 'quick_login_disabled'
  | 'unknown_user'
  | 'not_implemented'
  | 'unauthorized'
  | 'forbidden'
  | 'invalid_state'
  | 'auth_error';

/** Typed authentication error carrying an HTTP status for the API layer. */
export class AuthError extends Error {
  readonly code: AuthErrorCode;
  readonly status: number;

  constructor(message: string, code: AuthErrorCode = 'auth_error', status = 400) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.status = status;
  }
}
