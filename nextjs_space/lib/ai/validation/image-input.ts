/**
 * Validation for user-supplied wound/burn images before they are sent to the
 * AI provider. Enforces a MIME-type allow-list and a maximum decoded size so a
 * malformed or oversized upload fails fast with a clear, non-leaky message.
 *
 * The image arrives as a base64 string (without the data-URL prefix) plus an
 * optional MIME type, matching the existing analysis route request shape.
 */

/** MIME types the vision model accepts. Keep in sync with the client uploader. */
export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
] as const;

const DEFAULT_MAX_IMAGE_MB = 10;

function maxImageBytes(): number {
  const configured = Number.parseFloat(process.env.AZURE_AI_MAX_IMAGE_MB ?? '');
  const mb = Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_MAX_IMAGE_MB;
  return Math.floor(mb * 1024 * 1024);
}

/** Approximate decoded byte length of a base64 payload (ignores whitespace). */
export function approxBase64Bytes(base64: string): number {
  const clean = base64.replace(/\s/g, '');
  const padding = clean.endsWith('==') ? 2 : clean.endsWith('=') ? 1 : 0;
  return Math.max(0, Math.floor((clean.length * 3) / 4) - padding);
}

/**
 * Upper bound on the raw HTTP request body for an image upload.
 *
 * The client sends the image base64-encoded inside a JSON envelope. Base64 inflates
 * the decoded size by ~33%, plus a small JSON/metadata overhead — so allow ~1.5x the
 * decoded image ceiling. This lets a route reject an oversized upload from the
 * Content-Length header BEFORE buffering the whole body into memory.
 */
export function maxImageRequestBytes(): number {
  return Math.floor(maxImageBytes() * 1.5) + 4096;
}

export interface BodySizeCheck {
  ok: boolean;
  error?: string;
}

/**
 * Reject a request whose declared Content-Length exceeds the image upload limit.
 * A missing/unparseable Content-Length passes here (the decoded-size check in
 * validateImageInput remains the authoritative guard after parsing).
 */
export function checkRequestBodySize(contentLength: string | null): BodySizeCheck {
  const declared = Number.parseInt(contentLength ?? '', 10);
  if (Number.isFinite(declared) && declared > maxImageRequestBytes()) {
    const limitMb = (maxImageRequestBytes() / (1024 * 1024)).toFixed(0);
    return { ok: false, error: `Request body too large. Maximum upload is about ${limitMb} MB.` };
  }
  return { ok: true };
}

export interface ImageInput {
  image?: unknown;
  mimeType?: unknown;
}

export type ImageValidationResult =
  | { ok: true; mimeType: string; bytes: number }
  | { ok: false; error: string };

/** Validate a base64 image payload + optional MIME type. */
export function validateImageInput(input: ImageInput): ImageValidationResult {
  const { image, mimeType } = input;

  if (typeof image !== 'string' || image.trim().length === 0) {
    return { ok: false, error: 'No image provided' };
  }

  // Accept a data-URL or a bare base64 string; strip any data-URL prefix.
  const base64 = image.includes(',') ? image.slice(image.indexOf(',') + 1) : image;

  const resolvedMime =
    typeof mimeType === 'string' && mimeType.trim().length > 0
      ? mimeType.trim().toLowerCase()
      : 'image/jpeg';

  if (!ALLOWED_IMAGE_MIME_TYPES.includes(resolvedMime as (typeof ALLOWED_IMAGE_MIME_TYPES)[number])) {
    return {
      ok: false,
      error: `Unsupported image type. Allowed types: ${ALLOWED_IMAGE_MIME_TYPES.join(', ')}.`,
    };
  }

  const bytes = approxBase64Bytes(base64);
  const limit = maxImageBytes();
  if (bytes > limit) {
    const limitMb = (limit / (1024 * 1024)).toFixed(0);
    return { ok: false, error: `Image is too large. Maximum size is ${limitMb} MB.` };
  }

  return { ok: true, mimeType: resolvedMime, bytes };
}
