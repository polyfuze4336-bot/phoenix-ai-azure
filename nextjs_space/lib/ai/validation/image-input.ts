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
  | { ok: true; mimeType: string; base64: string; bytes: number }
  | { ok: false; error: string };

function hasExpectedSignature(bytes: Buffer, mimeType: string): boolean {
  if (mimeType === 'image/jpeg') {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (mimeType === 'image/png') {
    return bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'));
  }
  if (mimeType === 'image/webp') {
    return bytes.length >= 12 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
  }
  if (mimeType === 'image/gif') {
    const signature = bytes.toString('ascii', 0, 6);
    return signature === 'GIF87a' || signature === 'GIF89a';
  }
  return false;
}

/** Validate a base64 image payload + optional MIME type. */
export function validateImageInput(input: ImageInput): ImageValidationResult {
  const { image, mimeType } = input;

  if (typeof image !== 'string' || image.trim().length === 0) {
    return { ok: false, error: 'No image provided' };
  }

  const rawImage = image.trim();
  const dataUrl = rawImage.match(/^data:([^;,]+);base64,([\s\S]*)$/i);
  if (rawImage.toLowerCase().startsWith('data:') && !dataUrl) {
    return { ok: false, error: 'Image data is invalid. Please upload a JPEG, PNG, WebP, or GIF image.' };
  }

  const suppliedMime = typeof mimeType === 'string' && mimeType.trim().length > 0
    ? mimeType.trim().toLowerCase()
    : undefined;
  const dataUrlMime = dataUrl?.[1]?.trim().toLowerCase();
  if (suppliedMime && dataUrlMime && suppliedMime !== dataUrlMime) {
    return { ok: false, error: 'Image type does not match the uploaded file.' };
  }

  const resolvedMime = suppliedMime ?? dataUrlMime ?? 'image/jpeg';

  if (!ALLOWED_IMAGE_MIME_TYPES.includes(resolvedMime as (typeof ALLOWED_IMAGE_MIME_TYPES)[number])) {
    return {
      ok: false,
      error: 'Unsupported image type. Please upload a JPEG, PNG, WebP, or GIF image.',
    };
  }

  const unpaddedBase64 = (dataUrl?.[2] ?? rawImage).replace(/\s/g, '');
  if (
    unpaddedBase64.length === 0 ||
    !/^[A-Za-z0-9+/]*={0,2}$/.test(unpaddedBase64) ||
    unpaddedBase64.length % 4 === 1 ||
    (unpaddedBase64.includes('=') && unpaddedBase64.length % 4 !== 0)
  ) {
    return { ok: false, error: 'Image data is invalid. Please upload a JPEG, PNG, WebP, or GIF image.' };
  }

  const base64 = unpaddedBase64.padEnd(unpaddedBase64.length + ((4 - (unpaddedBase64.length % 4)) % 4), '=');
  const bytes = approxBase64Bytes(base64);
  const limit = maxImageBytes();
  if (bytes > limit) {
    const limitMb = (limit / (1024 * 1024)).toFixed(0);
    return { ok: false, error: `Image is too large. Maximum size is ${limitMb} MB.` };
  }

  const decoded = Buffer.from(base64, 'base64');
  if (decoded.toString('base64') !== base64 || !hasExpectedSignature(decoded, resolvedMime)) {
    return { ok: false, error: 'Image content does not match its file type. Please upload a valid JPEG, PNG, WebP, or GIF image.' };
  }

  return { ok: true, mimeType: resolvedMime, base64, bytes };
}
