/**
 * Client-side image ingestion pipeline.
 *
 * Converts any uploaded image to a canonical JPEG before AI analysis.
 * This eliminates browser-dependent MIME/encoding differences (Safari, Chrome,
 * mobile) and adds HEIC/HEIF support via browser decoding.
 */

export type NormalizedImage = {
  base64: string;
  mimeType: 'image/jpeg';
  previewDataUrl: string;
  originalMime: string;
  originalBytes: number;
  normalizedBytes: number;
  width: number;
  height: number;
  normalizationMethod: string;
};

export type IngestErrorCode =
  | 'FILE_TYPE_UNSUPPORTED'
  | 'FILE_READ_FAILED'
  | 'IMAGE_DECODE_FAILED'
  | 'IMAGE_NORMALIZATION_FAILED'
  | 'IMAGE_TOO_LARGE';

export type IngestError = { code: IngestErrorCode };

export type IngestResult =
  | { ok: true; image: NormalizedImage }
  | { ok: false; error: IngestError };

const MAX_LONG_EDGE = 2048;
const JPEG_QUALITY = 0.88;
const MAX_INPUT_BYTES = 30 * 1024 * 1024;

const ACCEPTED_MIME_SET = new Set([
  'image/jpeg', 'image/jpg', 'image/png',
  'image/webp', 'image/gif',
  'image/heic', 'image/heif',
]);

const EXT_TO_MIME: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
  webp: 'image/webp', gif: 'image/gif',
  heic: 'image/heic', heif: 'image/heif',
};

/** Detect actual image type from magic bytes — never trust file.type alone. */
function detectMimeFromBytes(b: Uint8Array): string | null {
  if (b.length < 12) return null;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png';
  const gif = String.fromCharCode(b[0], b[1], b[2], b[3], b[4], b[5]);
  if (gif === 'GIF87a' || gif === 'GIF89a') return 'image/gif';
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
      b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return 'image/webp';
  // HEIC/HEIF: ftyp box at offset 4
  if (b.length >= 12) {
    const brand = String.fromCharCode(b[4], b[5], b[6], b[7]);
    if (brand === 'ftyp') {
      const major = String.fromCharCode(b[8], b[9], b[10], b[11]).toLowerCase().trim();
      if (['heic', 'heix', 'heif', 'hevx', 'mif1', 'msf1', 'avci', 'avcs'].includes(major)) {
        return 'image/heic';
      }
    }
  }
  return null;
}

function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(new Error('FILE_READ_FAILED'));
    reader.readAsArrayBuffer(file);
  });
}

async function decodeViaImageBitmap(bytes: Uint8Array, mime: string): Promise<ImageBitmap> {
  const blob = new Blob([bytes], { type: mime });
  return createImageBitmap(blob);
}

function decodeViaHtmlImage(bytes: Uint8Array, mime: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([bytes], { type: mime });
    const url = URL.createObjectURL(blob);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      if (img.naturalWidth < 1 || img.naturalHeight < 1) {
        reject(new Error('IMAGE_DECODE_FAILED'));
      } else {
        resolve(img);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('IMAGE_DECODE_FAILED'));
    };
    img.src = url;
  });
}

function renderToCanvas(
  source: ImageBitmap | HTMLImageElement,
): { canvas: HTMLCanvasElement; width: number; height: number } {
  const sw = source instanceof ImageBitmap ? source.width : source.naturalWidth;
  const sh = source instanceof ImageBitmap ? source.height : source.naturalHeight;
  const scale = Math.min(1, MAX_LONG_EDGE / Math.max(sw, sh));
  const tw = Math.round(sw * scale);
  const th = Math.round(sh * scale);
  const canvas = document.createElement('canvas');
  canvas.width = tw;
  canvas.height = th;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('IMAGE_NORMALIZATION_FAILED');
  ctx.drawImage(source as CanvasImageSource, 0, 0, tw, th);
  return { canvas, width: tw, height: th };
}

function canvasToBase64Jpeg(canvas: HTMLCanvasElement): Promise<string> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) { reject(new Error('IMAGE_NORMALIZATION_FAILED')); return; }
        const reader = new FileReader();
        reader.onload = () => {
          const url = reader.result as string;
          const b64 = url.split(',')[1] ?? '';
          if (b64) resolve(b64);
          else reject(new Error('IMAGE_NORMALIZATION_FAILED'));
        };
        reader.onerror = () => reject(new Error('IMAGE_NORMALIZATION_FAILED'));
        reader.readAsDataURL(blob);
      },
      'image/jpeg',
      JPEG_QUALITY,
    );
  });
}

/** Normalise an uploaded image to canonical JPEG for consistent AI analysis. */
export async function ingestImage(file: File): Promise<IngestResult> {
  if (file.size === 0) return { ok: false, error: { code: 'FILE_READ_FAILED' } };
  if (file.size > MAX_INPUT_BYTES) return { ok: false, error: { code: 'IMAGE_TOO_LARGE' } };

  let ab: ArrayBuffer;
  try {
    ab = await readFileAsArrayBuffer(file);
  } catch {
    return { ok: false, error: { code: 'FILE_READ_FAILED' } };
  }

  const bytes = new Uint8Array(ab);
  const detectedMime = detectMimeFromBytes(bytes);
  const browserMime = file.type?.toLowerCase();
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const effectiveMime = detectedMime ?? (ACCEPTED_MIME_SET.has(browserMime) ? browserMime : EXT_TO_MIME[ext]);

  if (!effectiveMime) return { ok: false, error: { code: 'FILE_TYPE_UNSUPPORTED' } };

  const originalMime = effectiveMime;

  let source: ImageBitmap | HTMLImageElement;
  let normalizationMethod = 'canvas-imageBitmap';
  try {
    source = await decodeViaImageBitmap(bytes, effectiveMime);
  } catch {
    normalizationMethod = 'canvas-htmlImage';
    try {
      source = await decodeViaHtmlImage(bytes, effectiveMime);
    } catch {
      return { ok: false, error: { code: 'IMAGE_DECODE_FAILED' } };
    }
  }

  let canvas: HTMLCanvasElement;
  let width: number;
  let height: number;
  try {
    const r = renderToCanvas(source);
    canvas = r.canvas;
    width = r.width;
    height = r.height;
  } catch {
    return { ok: false, error: { code: 'IMAGE_NORMALIZATION_FAILED' } };
  } finally {
    if (source instanceof ImageBitmap) source.close();
  }

  let base64: string;
  try {
    base64 = await canvasToBase64Jpeg(canvas);
  } catch {
    return { ok: false, error: { code: 'IMAGE_NORMALIZATION_FAILED' } };
  }

  const normalizedBytes = Math.floor((base64.length * 3) / 4);
  return {
    ok: true,
    image: {
      base64,
      mimeType: 'image/jpeg',
      previewDataUrl: `data:image/jpeg;base64,${base64}`,
      originalMime,
      originalBytes: bytes.length,
      normalizedBytes,
      width,
      height,
      normalizationMethod,
    },
  };
}
