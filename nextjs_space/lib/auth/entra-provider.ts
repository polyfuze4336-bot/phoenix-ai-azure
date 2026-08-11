/**
 * Phoenix AI — Microsoft Entra ID authentication provider (PLACEHOLDER).
 *
 * The parity release does NOT implement application-level Entra sign-in. The
 * recommended path is PLATFORM-LEVEL Microsoft Entra authentication — App Service
 * Authentication (Easy Auth) or access restrictions in front of the app — which
 * needs no code here. This class exists so AUTH_MODE=entra is a recognised,
 * type-safe option and fails loudly with guidance until a real integration lands.
 */
import { AuthError, type AuthProvider, type AuthUser, type PublicDemoUser } from './types';

const NOT_IMPLEMENTED_MESSAGE =
  'AUTH_MODE=entra is not implemented in the parity release. Protect the app with ' +
  'platform-level Microsoft Entra authentication (App Service Easy Auth) or access ' +
  'restrictions, or keep AUTH_MODE=demo.';

export class EntraAuthProvider implements AuthProvider {
  readonly mode = 'entra' as const;

  private notImplemented(): never {
    throw new AuthError(NOT_IMPLEMENTED_MESSAGE, 'not_implemented', 501);
  }

  async authenticate(): Promise<AuthUser> {
    this.notImplemented();
  }

  async quickAuthenticate(): Promise<AuthUser> {
    this.notImplemented();
  }

  listPublicUsers(): PublicDemoUser[] {
    return [];
  }
}
