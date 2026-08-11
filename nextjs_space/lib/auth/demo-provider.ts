/**
 * Phoenix AI — demo authentication provider (SERVER-ONLY).
 *
 * Validates against the fictional demo directory. Quick-login issues a session
 * for a known public user without a password, preserving the original one-tap
 * demo cards. This is DEMO behaviour, not enterprise authentication; the demo
 * environment is expected to be protected at the platform level (App Service
 * access restrictions / Entra Easy Auth) — see docs.
 */
import { findPublicDemoUser, listPublicDemoUsers, verifyDemoCredentials } from './demo-users';
import { AuthError, type AuthProvider, type AuthUser, type PublicDemoUser } from './types';

export class DemoAuthProvider implements AuthProvider {
  readonly mode = 'demo' as const;

  async authenticate(email: string, password: string): Promise<AuthUser> {
    const user = verifyDemoCredentials(email, password);
    if (!user) {
      throw new AuthError('Invalid email or password', 'invalid_credentials', 401);
    }
    return user;
  }

  async quickAuthenticate(email: string): Promise<AuthUser> {
    const user = findPublicDemoUser(email);
    if (!user) {
      throw new AuthError('Unknown demo user', 'unknown_user', 404);
    }
    return { name: user.name, role: user.role, email: user.email };
  }

  listPublicUsers(): PublicDemoUser[] {
    return listPublicDemoUsers();
  }
}
