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

export type ImageValidationErrorCode = 'IMAGE_INVALID' | 'IMAGE_TOO_LARGE';

export type ImageValidationResult =
  | { ok: true; mimeType: string; base64: string; bytes: number; width: number; height: number }
  | { ok: false; code: ImageValidationErrorCode; error: string };

interface ImageDimensions {
  width: number;
  height: number;
}

const invalidImage = (error: string): ImageValidationResult => ({
  ok: false,
  code: 'IMAGE_INVALID',
  error,
});

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

function readJpegDimensions(bytes: Buffer): ImageDimensions | null {
  if (bytes.length < 4 || bytes[bytes.length - 2] !== 0xff || bytes[bytes.length - 1] !== 0xd9) {
    return null;
  }

  let offset = 2;
  while (offset + 3 < bytes.length - 2) {
    if (bytes[offset] !== 0xff) return null;
    while (offset < bytes.length && bytes[offset] === 0xff) offset += 1;
    const marker = bytes[offset++];
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd9)) continue;
    if (offset + 2 > bytes.length) return null;
    const segmentLength = bytes.readUInt16BE(offset);
    if (segmentLength < 2 || offset + segmentLength > bytes.length) return null;
    if (
      marker !== undefined &&
      ((marker >= 0xc0 && marker <= 0xc3) ||
        (marker >= 0xc5 && marker <= 0xc7) ||
        (marker >= 0xc9 && marker <= 0xcb) ||
        (marker >= 0xcd && marker <= 0xcf))
    ) {
      if (segmentLength < 7) return null;
      return { height: bytes.readUInt16BE(offset + 3), width: bytes.readUInt16BE(offset + 5) };
    }
    offset += segmentLength;
  }
  return null;
}

function readPngDimensions(bytes: Buffer): ImageDimensions | null {
  if (bytes.length < 33 || bytes.toString('ascii', 12, 16) !== 'IHDR') return null;
  const iend = bytes.subarray(bytes.length - 12);
  if (iend.readUInt32BE(0) !== 0 || iend.toString('ascii', 4, 8) !== 'IEND') return null;
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

function readGifDimensions(bytes: Buffer): ImageDimensions | null {
  if (bytes.length < 14 || bytes[bytes.length - 1] !== 0x3b) return null;
  return { width: bytes.readUInt16LE(6), height: bytes.readUInt16LE(8) };
}

function readWebpDimensions(bytes: Buffer): ImageDimensions | null {
  if (bytes.length < 30 || bytes.readUInt32LE(4) + 8 !== bytes.length) return null;
  const chunk = bytes.toString('ascii', 12, 16);
  if (chunk === 'VP8X') {
    return {
      width: 1 + bytes.readUIntLE(24, 3),
      height: 1 + bytes.readUIntLE(27, 3),
    };
  }
  if (chunk === 'VP8L' && bytes[20] === 0x2f) {
    const dimensions = bytes.readUInt32LE(21);
    return {
      width: (dimensions & 0x3fff) + 1,
      height: ((dimensions >> 14) & 0x3fff) + 1,
    };
  }
  if (chunk === 'VP8 ' && bytes.length >= 30 && bytes.subarray(23, 26).equals(Buffer.from([0x9d, 0x01, 0x2a]))) {
    return {
      width: bytes.readUInt16LE(26) & 0x3fff,
      height: bytes.readUInt16LE(28) & 0x3fff,
    };
  }
  return null;
}

function readImageDimensions(bytes: Buffer, mimeType: string): ImageDimensions | null {
  if (mimeType === 'image/jpeg') return readJpegDimensions(bytes);
  if (mimeType === 'image/png') return readPngDimensions(bytes);
  if (mimeType === 'image/gif') return readGifDimensions(bytes);
  if (mimeType === 'image/webp') return readWebpDimensions(bytes);
  return null;
}

/** Validate a base64 image payload + optional MIME type. */
export function validateImageInput(input: ImageInput): ImageValidationResult {
  const { image, mimeType } = input;

  if (typeof image !== 'string' || image.trim().length === 0) {
    return invalidImage('No image provided');
  }

  const rawImage = image.trim();
  const dataUrl = rawImage.match(/^data:([^;,]+);base64,([\s\S]*)$/i);
  if (rawImage.toLowerCase().startsWith('data:') && !dataUrl) {
    return invalidImage('Image data is invalid. Please upload a JPEG, PNG, WebP, or GIF image.');
  }

  const suppliedMime = typeof mimeType === 'string' && mimeType.trim().length > 0
    ? mimeType.trim().toLowerCase()
    : undefined;
  const dataUrlMime = dataUrl?.[1]?.trim().toLowerCase();
  if (suppliedMime && dataUrlMime && suppliedMime !== dataUrlMime) {
    return invalidImage('Image type does not match the uploaded file.');
  }

  const resolvedMime = suppliedMime ?? dataUrlMime ?? 'image/jpeg';

  if (!ALLOWED_IMAGE_MIME_TYPES.includes(resolvedMime as (typeof ALLOWED_IMAGE_MIME_TYPES)[number])) {
    return invalidImage('Unsupported image type. Please upload a JPEG, PNG, WebP, or GIF image.');
  }

  const unpaddedBase64 = (dataUrl?.[2] ?? rawImage).replace(/\s/g, '');
  if (
    unpaddedBase64.length === 0 ||
    !/^[A-Za-z0-9+/]*={0,2}$/.test(unpaddedBase64) ||
    unpaddedBase64.length % 4 === 1 ||
    (unpaddedBase64.includes('=') && unpaddedBase64.length % 4 !== 0)
  ) {
    return invalidImage('Image data is invalid. Please upload a JPEG, PNG, WebP, or GIF image.');
  }

  const base64 = unpaddedBase64.padEnd(unpaddedBase64.length + ((4 - (unpaddedBase64.length % 4)) % 4), '=');
  const bytes = approxBase64Bytes(base64);
  const limit = maxImageBytes();
  if (bytes > limit) {
    const limitMb = (limit / (1024 * 1024)).toFixed(0);
    return { ok: false, code: 'IMAGE_TOO_LARGE', error: `Image is too large. Maximum size is ${limitMb} MB.` };
  }

  const decoded = Buffer.from(base64, 'base64');
  if (decoded.toString('base64') !== base64 || !hasExpectedSignature(decoded, resolvedMime)) {
    return invalidImage('Image content does not match its file type. Please upload a valid JPEG, PNG, WebP, or GIF image.');
  }

  const dimensions = readImageDimensions(decoded, resolvedMime);
  if (!dimensions || dimensions.width < 1 || dimensions.height < 1) {
    return invalidImage('The image could not be processed. Please try another JPEG, PNG, WebP, or GIF image.');
  }

  return { ok: true, mimeType: resolvedMime, base64, bytes, ...dimensions };
}
