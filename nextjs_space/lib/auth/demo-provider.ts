/**
 * Phoenix AI — demo authentication provider (SERVER-ONLY).
 *
 * Validates against one fictional demo/test account. This is DEMO behaviour,
 * not enterprise authentication; the demo
 * environment is expected to be protected at the platform level (App Service
 * access restrictions / Entra Easy Auth) — see docs.
 */
import { verifyDemoCredentials } from './demo-users';
import { AuthError, type AuthProvider, type AuthUser } from './types';

export class DemoAuthProvider implements AuthProvider {
  readonly mode = 'demo' as const;

  async authenticate(userId: string, password: string): Promise<AuthUser> {
    const user = verifyDemoCredentials(userId, password);
    if (!user) {
      throw new AuthError('Invalid User ID or password.', 'invalid_credentials', 401);
    }
    return user;
  }
}
