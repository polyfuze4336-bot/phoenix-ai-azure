/**
 * Phoenix AI — server-validated session (SERVER + EDGE safe).
 *
 * The Entra sign-in flow issues a signed, httpOnly session cookie. The session
 * is verified on the server and in middleware before any protected HCP route or
 * API is served — there is NO client-only route protection and the session is
 * never placed in sessionStorage/localStorage.
 *
 * Uses `jose` (HS256) so the same code runs in the Edge middleware runtime and
 * in Node route handlers. The signing secret is SERVER-ONLY.
 */
import { SignJWT, jwtVerify } from 'jose';
import { AuthError, HCP_ROLE_LABELS, type HcpRoleKey, type SessionUser } from './types';

/** Cookie that carries the signed HCP session (httpOnly, server-verified). */
export const SESSION_COOKIE = 'hcp_session';

const DEFAULT_TTL_MINUTES = 60;
const MIN_SECRET_LENGTH = 32;

function getSessionSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET?.trim();
  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    throw new AuthError(
      'SESSION_SECRET is missing or too short (need >= 32 chars) for Entra sessions.',
      'auth_error',
      500,
    );
  }
  return new TextEncoder().encode(secret);
}

/** Session lifetime in minutes (AUTH_SESSION_TTL_MINUTES, default 60, clamped). */
export function sessionTtlMinutes(): number {
  const raw = Number(process.env.AUTH_SESSION_TTL_MINUTES);
  if (!Number.isFinite(raw) || raw <= 0) return DEFAULT_TTL_MINUTES;
  return Math.min(Math.max(Math.floor(raw), 5), 24 * 60);
}

function isValidRoleKey(value: unknown): value is HcpRoleKey {
  return value === 'administrator' || value === 'doctor' || value === 'nurse';
}

/** Sign a session token for a mapped HCP user (expires after the configured TTL). */
export async function createSessionToken(user: SessionUser): Promise<string> {
  const ttl = sessionTtlMinutes();
  return new SignJWT({ name: user.name, email: user.email, roleKey: user.roleKey, roleLabel: user.roleLabel })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(user.email)
    .setIssuedAt()
    .setExpirationTime(`${ttl}m`)
    .sign(getSessionSecret());
}

/**
 * Verify a session token. Returns the session user, or null when the token is
 * absent, malformed, tampered with, or EXPIRED (session expiration is enforced
 * here via the JWT `exp` claim).
 */
export async function verifySessionToken(token: string | undefined | null): Promise<SessionUser | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSessionSecret());
    const roleKey = payload.roleKey;
    if (!isValidRoleKey(roleKey)) return null;
    const email = typeof payload.email === 'string' ? payload.email : '';
    const name = typeof payload.name === 'string' ? payload.name : email;
    const roleLabel = typeof payload.roleLabel === 'string' ? payload.roleLabel : HCP_ROLE_LABELS[roleKey];
    if (!email) return null;
    return { name, email, roleKey, roleLabel };
  } catch {
    // Invalid signature, malformed token, or expired session.
    return null;
  }
}

/** Standard cookie options for the session cookie. */
export function sessionCookieOptions(): {
  httpOnly: true;
  secure: boolean;
  sameSite: 'lax';
  path: string;
  maxAge: number;
} {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: sessionTtlMinutes() * 60,
  };
}
