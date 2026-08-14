import { resolveAuthMode } from './auth-config';
import { getCurrentSession } from './current-session';
import type { SessionUser } from './types';

/**
 * Retained clinical records require a server-verifiable identity. Demo auth is
 * client-only and therefore must never authorize persistence or retrieval.
 */
export async function getAuthorizedAnalysisSession(
  readSession: () => Promise<SessionUser | null> = getCurrentSession,
): Promise<SessionUser | null> {
  if (resolveAuthMode() !== 'entra') return null;
  return readSession();
}
