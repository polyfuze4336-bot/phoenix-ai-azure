/**
 * Phoenix AI — current-session helpers for Node route handlers (SERVER-ONLY).
 *
 * Reads and verifies the signed session cookie from `next/headers`. Used by
 * protected HCP API routes and the session endpoint. Middleware performs the
 * same verification at the edge for page + API gating.
 */
import { cookies } from 'next/headers';
import { SESSION_COOKIE, verifySessionToken } from './session';
import type { SessionUser } from './types';

/** Return the verified session user for the current request, or null. */
export async function getCurrentSession(): Promise<SessionUser | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  return verifySessionToken(token);
}
