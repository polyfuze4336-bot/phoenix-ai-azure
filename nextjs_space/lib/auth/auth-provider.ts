/**
 * Phoenix AI — authentication provider factory (SERVER-ONLY).
 *
 * Resolves the active provider from the AUTH_MODE feature flag. Only the
 * /api/auth routes import this module, keeping demo credentials off the browser.
 */
import { isDemoMode, resolveAuthMode } from './auth-config';
import { DemoAuthProvider } from './demo-provider';
import { EntraAuthProvider } from './entra-provider';
import type { AuthMode, AuthProvider } from './types';

let cachedProvider: AuthProvider | null = null;
let cachedMode: AuthMode | null = null;

/** Get the authentication provider for the configured AUTH_MODE. */
export function getAuthProvider(): AuthProvider {
  const mode = resolveAuthMode();
  if (cachedProvider && cachedMode === mode) {
    return cachedProvider;
  }
  cachedProvider = mode === 'entra' ? new EntraAuthProvider() : new DemoAuthProvider();
  cachedMode = mode;
  return cachedProvider;
}

export { isDemoMode, resolveAuthMode };
export { AuthError } from './types';
export type { AuthMode, AuthProvider, AuthUser, PublicDemoUser } from './types';
