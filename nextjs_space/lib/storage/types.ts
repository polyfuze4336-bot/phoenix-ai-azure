/**
 * Provider-neutral storage contract for Phoenix AI.
 *
 * This layer is the sanctioned, Azure-native replacement for the legacy (unused)
 * AWS S3 helpers. It is SERVER-ONLY: it authenticates with a managed identity and
 * mints short-lived read URLs, so a storage account key never reaches the browser.
 *
 * IMPORTANT (parity + privacy):
 * - No current Phoenix AI workflow persists user files — wound/burn images are read
 *   client-side via FileReader and sent to the AI routes as ephemeral base64. This
 *   provider is therefore intentionally NOT wired into any UI workflow; it exists as
 *   a secure building block for any future feature that genuinely needs persistence.
 * - Clinical images must only ever live in a PRIVATE container. Never make the
 *   container public and never log image bytes or metadata values.
 */

import { randomUUID } from 'node:crypto';

/** Non-sensitive, ASCII-only key/value metadata stored alongside a blob. */
export type StorageMetadata = Record<string, string>;

export interface UploadInput {
  /** Raw file bytes (server-side only — never a browser File in this layer). */
  data: Buffer | Uint8Array;
  /** MIME type; validated against the allow-list before upload. */
  contentType: string;
  /** Original file name; used only to derive a safe extension. */
  fileName?: string;
  /** Logical grouping used as a path prefix (e.g. 'wound-analysis'). */
  category?: string;
  /** Optional non-sensitive metadata to store on the blob (never image content). */
  metadata?: StorageMetadata;
  /** Optional server-side progress callback (bytes transferred so far). */
  onProgress?: (loadedBytes: number) => void;
}

export interface UploadResult {
  /** Container-relative blob path — the opaque key callers persist. */
  blobPath: string;
  contentType: string;
  size: number;
  etag?: string;
  uploadedAt: string;
}

export interface ReadUrlOptions {
  /** Requested SAS lifetime in seconds. Clamped by the provider to a safe bound. */
  expiresInSeconds?: number;
}

export interface ReadUrl {
  /** Short-lived, read-only URL (user delegation SAS). */
  url: string;
  expiresAt: string;
}

export type StorageValidation =
  | { ok: true; contentType: string; size: number }
  | { ok: false; error: string };

/** Minimal storage surface. Implemented by AzureBlobProvider. */
export interface StorageProvider {
  upload(input: UploadInput): Promise<UploadResult>;
  /** Mint a short-lived read-only URL for a private blob (no account key). */
  getReadUrl(blobPath: string, options?: ReadUrlOptions): Promise<ReadUrl>;
  /** Delete a blob if it exists (including snapshots). Idempotent. */
  delete(blobPath: string): Promise<void>;
  exists(blobPath: string): Promise<boolean>;
}

export class StorageError extends Error {
  readonly code: string;
  constructor(message: string, code = 'storage_error') {
    super(message);
    this.name = 'StorageError';
    this.code = code;
  }
}

// ---------------------------------------------------------------------------
// Shared configuration & validation (pure — no sibling imports, no I/O).
// ---------------------------------------------------------------------------

/** MIME types the storage layer accepts. Images plus PDF (for future reports). */
export const ALLOWED_STORAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
  'application/pdf',
] as const;

export type AllowedStorageMimeType = (typeof ALLOWED_STORAGE_MIME_TYPES)[number];

const DEFAULT_MAX_FILE_MB = 15;

const EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/heic': '.heic',
  'image/heif': '.heif',
  'application/pdf': '.pdf',
};

/** Maximum accepted upload size in bytes (configurable via env). */
export function maxStorageFileBytes(): number {
  const configured = Number.parseFloat(process.env.AZURE_STORAGE_MAX_FILE_MB ?? '');
  const mb = Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_MAX_FILE_MB;
  return Math.floor(mb * 1024 * 1024);
}

export function isAllowedStorageContentType(contentType: string): contentType is AllowedStorageMimeType {
  return (ALLOWED_STORAGE_MIME_TYPES as readonly string[]).includes(contentType);
}

/** Validate an upload's MIME type and byte length before touching storage. */
export function validateUpload(contentType: string, size: number): StorageValidation {
  const resolved = (contentType ?? '').trim().toLowerCase();
  if (!resolved) {
    return { ok: false, error: 'A content type is required.' };
  }
  if (!isAllowedStorageContentType(resolved)) {
    return {
      ok: false,
      error: `Unsupported file type. Allowed types: ${ALLOWED_STORAGE_MIME_TYPES.join(', ')}.`,
    };
  }
  if (!Number.isFinite(size) || size <= 0) {
    return { ok: false, error: 'The file is empty.' };
  }
  const limit = maxStorageFileBytes();
  if (size > limit) {
    const limitMb = (limit / (1024 * 1024)).toFixed(0);
    return { ok: false, error: `File is too large. Maximum size is ${limitMb} MB.` };
  }
  return { ok: true, contentType: resolved, size };
}

function safeExtension(contentType: string, fileName?: string): string {
  const fromMime = EXTENSION_BY_MIME[contentType.trim().toLowerCase()];
  if (fromMime) return fromMime;
  const match = fileName?.match(/\.([a-z0-9]{1,8})$/i);
  return match ? `.${match[1].toLowerCase()}` : '';
}

/**
 * Build a unique, collision-free, date-partitioned blob path. The original file
 * name is never used verbatim (only a safe extension is derived) to avoid path
 * traversal and to keep clinical file names out of the object key.
 */
export function buildBlobPath(category: string | undefined, contentType: string, fileName?: string): string {
  const safeCategory = (category ?? 'misc').replace(/[^a-z0-9-]/gi, '-').toLowerCase() || 'misc';
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(now.getUTCDate()).padStart(2, '0');
  const ext = safeExtension(contentType, fileName);
  return `${safeCategory}/${yyyy}/${mm}/${dd}/${randomUUID()}${ext}`;
}
