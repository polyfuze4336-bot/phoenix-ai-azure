/**
 * Phoenix AI — Microsoft Entra ID configuration + role mapping (SERVER-ONLY).
 *
 * Reads the Entra (OIDC) settings and maps Entra application roles / group ids
 * to the canonical HCP role keys. Access to the HCP portal requires at least one
 * mapped role; the community portal is public and is never gated here.
 *
 * No secrets are ever sent to the browser. AZURE_ENTRA_CLIENT_SECRET is read
 * server-side only during the authorization-code token exchange.
 */
import { AuthError, HCP_ROLE_LABELS, type HcpRoleKey } from './types';

export interface EntraConfig {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  postLogoutRedirectUri: string;
  scopes: string;
  authority: string;
  authorizeUrl: string;
  tokenUrl: string;
  logoutUrl: string;
  jwksUrl: string;
  issuer: string;
}

/** True when the mandatory Entra environment variables are present. */
export function isEntraConfigured(): boolean {
  return Boolean(
    process.env.AZURE_ENTRA_TENANT_ID?.trim() &&
      process.env.AZURE_ENTRA_CLIENT_ID?.trim() &&
      process.env.AZURE_ENTRA_CLIENT_SECRET?.trim() &&
      process.env.AZURE_ENTRA_REDIRECT_URI?.trim(),
  );
}

/** Resolve and validate the Entra configuration; throws when incomplete. */
export function getEntraConfig(): EntraConfig {
  const tenantId = process.env.AZURE_ENTRA_TENANT_ID?.trim() ?? '';
  const clientId = process.env.AZURE_ENTRA_CLIENT_ID?.trim() ?? '';
  const clientSecret = process.env.AZURE_ENTRA_CLIENT_SECRET?.trim() ?? '';
  const redirectUri = process.env.AZURE_ENTRA_REDIRECT_URI?.trim() ?? '';

  if (!tenantId || !clientId || !clientSecret || !redirectUri) {
    throw new AuthError(
      'Entra ID is not configured (need AZURE_ENTRA_TENANT_ID, AZURE_ENTRA_CLIENT_ID, ' +
        'AZURE_ENTRA_CLIENT_SECRET, AZURE_ENTRA_REDIRECT_URI).',
      'auth_error',
      500,
    );
  }

  const authority = `https://login.microsoftonline.com/${tenantId}`;
  const postLogoutRedirectUri =
    process.env.AZURE_ENTRA_POST_LOGOUT_REDIRECT_URI?.trim() || deriveOrigin(redirectUri);
  const scopes = process.env.AZURE_ENTRA_SCOPES?.trim() || 'openid profile email';

  return {
    tenantId,
    clientId,
    clientSecret,
    redirectUri,
    postLogoutRedirectUri,
    scopes,
    authority,
    authorizeUrl: `${authority}/oauth2/v2.0/authorize`,
    tokenUrl: `${authority}/oauth2/v2.0/token`,
    logoutUrl: `${authority}/oauth2/v2.0/logout`,
    jwksUrl: `${authority}/discovery/v2.0/keys`,
    issuer: `https://login.microsoftonline.com/${tenantId}/v2.0`,
  };
}

function deriveOrigin(url: string): string {
  try {
    return new URL(url).origin;
  } catch {
    return '/';
  }
}

/**
 * Parse a `key=value,key2=value2` env string into a lookup map.
 * Used for AZURE_ENTRA_GROUP_* -> role mappings.
 */
function parseCsvList(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

/**
 * Build the mapping from Entra group object-ids to HCP role keys, read from
 * AZURE_ENTRA_GROUP_ADMIN / _DOCTOR / _NURSE (each a comma-separated id list).
 */
function groupRoleMap(): Map<string, HcpRoleKey> {
  const map = new Map<string, HcpRoleKey>();
  for (const id of parseCsvList(process.env.AZURE_ENTRA_GROUP_ADMIN)) map.set(id, 'administrator');
  for (const id of parseCsvList(process.env.AZURE_ENTRA_GROUP_DOCTOR)) map.set(id, 'doctor');
  for (const id of parseCsvList(process.env.AZURE_ENTRA_GROUP_NURSE)) map.set(id, 'nurse');
  return map;
}

/** Normalise an Entra app-role value (case-insensitive) to a canonical key. */
function appRoleToKey(role: string): HcpRoleKey | null {
  const value = role.trim().toLowerCase();
  if (value === 'administrator' || value === 'admin') return 'administrator';
  if (value === 'doctor') return 'doctor';
  if (value === 'nurse') return 'nurse';
  return null;
}

// Precedence: Administrator > Doctor > Nurse when a user carries several roles.
const ROLE_PRECEDENCE: HcpRoleKey[] = ['administrator', 'doctor', 'nurse'];

/**
 * Map the ID-token claims to a single canonical HCP role.
 *
 * Prefers application roles (the `roles` claim); falls back to group object-ids
 * (the `groups` claim) mapped via AZURE_ENTRA_GROUP_*. Returns null when the user
 * carries no recognised HCP role — the caller then renders the Forbidden state.
 */
export function mapClaimsToRole(claims: {
  roles?: unknown;
  groups?: unknown;
}): HcpRoleKey | null {
  const found = new Set<HcpRoleKey>();

  if (Array.isArray(claims.roles)) {
    for (const role of claims.roles) {
      if (typeof role === 'string') {
        const key = appRoleToKey(role);
        if (key) found.add(key);
      }
    }
  }

  if (found.size === 0 && Array.isArray(claims.groups)) {
    const map = groupRoleMap();
    for (const group of claims.groups) {
      if (typeof group === 'string' && map.has(group)) {
        found.add(map.get(group)!);
      }
    }
  }

  for (const key of ROLE_PRECEDENCE) {
    if (found.has(key)) return key;
  }
  return null;
}

/** Human-readable label for a canonical role key. */
export function roleLabel(key: HcpRoleKey): string {
  return HCP_ROLE_LABELS[key];
}
