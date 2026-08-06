/**
 * Phoenix AI — authentication feature flag.
 *
 * The AUTH_MODE flag selects the active authentication provider. It defaults to
 * `demo` so the first parity release behaves exactly like the original mock
 * login. Set AUTH_MODE=entra later to switch to a real identity provider (which
 * is a placeholder in this release — platform-level Entra is preferred; see docs).
 */
import type { AuthMode } from './types';

export const DEFAULT_AUTH_MODE: AuthMode = 'demo';

/** Resolve the configured auth mode from the AUTH_MODE env flag. */
export function resolveAuthMode(): AuthMode {
  const raw = (process.env.AUTH_MODE ?? '').trim().toLowerCase();
  if (raw === 'entra') return 'entra';
  // Empty or any other value falls back to the safe demo default.
  return DEFAULT_AUTH_MODE;
}

/** True when the app is running in demo authentication mode. */
export function isDemoMode(): boolean {
  return resolveAuthMode() === 'demo';
}
