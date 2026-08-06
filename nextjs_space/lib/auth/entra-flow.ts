/**
 * Phoenix AI — Microsoft Entra ID OIDC flow (SERVER-ONLY, Node runtime).
 *
 * Implements the authorization-code flow with PKCE against Entra ID:
 *   1. buildAuthorizationUrl() — start sign-in (redirect the browser to Entra).
 *   2. exchangeCodeForTokens()  — swap the returned code for tokens (server-side).
 *   3. validateIdToken()        — verify the ID token signature, issuer, audience,
 *                                 and expiry against the tenant JWKS, then map the
 *                                 claims to an HCP session user.
 *
 * The client secret and all token exchange happen server-side; no token is ever
 * exposed to the browser. Sessions are minted separately (see session.ts).
 */
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { getEntraConfig, mapClaimsToRole, roleLabel } from './entra-config';
import { AuthError, type SessionUser } from './types';

export interface PkcePair {
  verifier: string;
  challenge: string;
}

export interface AuthorizationRequest {
  url: string;
  state: string;
  nonce: string;
  codeVerifier: string;
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function randomToken(byteLength = 32): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

async function createPkcePair(): Promise<PkcePair> {
  const verifier = randomToken(32);
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return { verifier, challenge: base64UrlEncode(new Uint8Array(digest)) };
}

/** Build the Entra authorization URL plus the state/nonce/verifier to persist. */
export async function buildAuthorizationRequest(): Promise<AuthorizationRequest> {
  const config = getEntraConfig();
  const { verifier, challenge } = await createPkcePair();
  const state = randomToken(24);
  const nonce = randomToken(24);

  const params = new URLSearchParams({
    client_id: config.clientId,
    response_type: 'code',
    redirect_uri: config.redirectUri,
    response_mode: 'query',
    scope: config.scopes,
    state,
    nonce,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  });

  return { url: `${config.authorizeUrl}?${params.toString()}`, state, nonce, codeVerifier: verifier };
}

interface TokenResponse {
  id_token?: string;
  access_token?: string;
  error?: string;
  error_description?: string;
}

/** Exchange the authorization code for tokens (confidential client + PKCE). */
export async function exchangeCodeForTokens(code: string, codeVerifier: string): Promise<TokenResponse> {
  const config = getEntraConfig();
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    grant_type: 'authorization_code',
    code,
    redirect_uri: config.redirectUri,
    code_verifier: codeVerifier,
    scope: config.scopes,
  });

  const res = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  const data = (await res.json()) as TokenResponse;
  if (!res.ok || !data.id_token) {
    // Do not surface Entra internals verbatim; log a generic marker server-side.
    console.error('[Phoenix AI][auth] Entra token exchange failed');
    throw new AuthError('Sign-in could not be completed', 'auth_error', 401);
  }
  return data;
}

// Cache the tenant JWKS lookup per issuer for the lifetime of the process.
const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function getJwks(jwksUrl: string): ReturnType<typeof createRemoteJWKSet> {
  let jwks = jwksCache.get(jwksUrl);
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(jwksUrl));
    jwksCache.set(jwksUrl, jwks);
  }
  return jwks;
}

/**
 * Verify the ID token (signature via tenant JWKS, issuer, audience, expiry, and
 * nonce) and map its claims to an HCP session user. Throws AuthError 403 when the
 * user carries no recognised HCP role (Forbidden), 401 on any token failure.
 */
export async function validateIdToken(idToken: string, expectedNonce: string): Promise<SessionUser> {
  const config = getEntraConfig();

  let payload: Record<string, unknown>;
  try {
    const result = await jwtVerify(idToken, getJwks(config.jwksUrl), {
      issuer: config.issuer,
      audience: config.clientId,
    });
    payload = result.payload as Record<string, unknown>;
  } catch {
    throw new AuthError('Invalid sign-in token', 'auth_error', 401);
  }

  if (typeof payload.nonce !== 'string' || payload.nonce !== expectedNonce) {
    throw new AuthError('Invalid sign-in token', 'auth_error', 401);
  }

  const roleKey = mapClaimsToRole({ roles: payload.roles, groups: payload.groups });
  if (!roleKey) {
    throw new AuthError('No Phoenix AI clinical role assigned to this account', 'forbidden', 403);
  }

  const email =
    (typeof payload.preferred_username === 'string' && payload.preferred_username) ||
    (typeof payload.email === 'string' && payload.email) ||
    (typeof payload.upn === 'string' && payload.upn) ||
    '';
  const name = (typeof payload.name === 'string' && payload.name) || email;

  if (!email) {
    throw new AuthError('Sign-in token missing account identifier', 'auth_error', 401);
  }

  return { name, email, roleKey, roleLabel: roleLabel(roleKey) };
}

/** Build the Entra logout URL (federated sign-out) with a post-logout redirect. */
export function buildLogoutUrl(): string {
  const config = getEntraConfig();
  const params = new URLSearchParams({ post_logout_redirect_uri: config.postLogoutRedirectUri });
  return `${config.logoutUrl}?${params.toString()}`;
}
