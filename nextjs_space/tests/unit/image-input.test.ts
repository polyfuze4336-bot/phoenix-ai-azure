/**
 * Unit tests — image input validation for the AI analysis routes.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateImageInput,
  checkRequestBodySize,
  approxBase64Bytes,
  maxImageRequestBytes,
  ALLOWED_IMAGE_MIME_TYPES,
} from '../../lib/ai/validation/image-input';

const tinyPngBase64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const jpegSignatureBase64 = Buffer.from([0xff, 0xd8, 0xff, 0xe0]).toString('base64');

test('validateImageInput: missing/empty image is rejected', () => {
  assert.equal(validateImageInput({}).ok, false);
  assert.equal(validateImageInput({ image: '' }).ok, false);
  assert.equal(validateImageInput({ image: '   ' }).ok, false);
  assert.equal(validateImageInput({ image: 123 }).ok, false);
});

test('validateImageInput: rejects a truncated JPEG that only has a valid signature', () => {
  const result = validateImageInput({ image: jpegSignatureBase64 });
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.code, 'IMAGE_INVALID');
});

test('validateImageInput: normalizes a data URL and uses its MIME type', () => {
  const result = validateImageInput({
    image: `data:image/png;base64,${tinyPngBase64}`,
  });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.mimeType, 'image/png');
    assert.equal(result.base64, tinyPngBase64);
    assert.deepEqual([result.width, result.height], [1, 1]);
  }
});

test('validateImageInput: disallowed MIME type is rejected', () => {
  const result = validateImageInput({ image: tinyPngBase64, mimeType: 'image/heic' });
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.error, /unsupported image type/i);
});

test('validateImageInput: malformed base64 is rejected', () => {
  const result = validateImageInput({ image: 'not_base64!', mimeType: 'image/png' });
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.error, /invalid/i);
});

test('validateImageInput: declared MIME must match the image signature', () => {
  const result = validateImageInput({ image: tinyPngBase64, mimeType: 'image/jpeg' });
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.error, /does not match/i);
});

test('validateImageInput: data-URL MIME must match a supplied MIME type', () => {
  const result = validateImageInput({
    image: `data:image/png;base64,${tinyPngBase64}`,
    mimeType: 'image/jpeg',
  });
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.error, /does not match/i);
});

test('validateImageInput: every allowed MIME type has a signature check', () => {
  assert.deepEqual(ALLOWED_IMAGE_MIME_TYPES, ['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
});

test('validateImageInput: oversized image is rejected', () => {
  const saved = process.env.AZURE_AI_MAX_IMAGE_MB;
  process.env.AZURE_AI_MAX_IMAGE_MB = '0.0001'; // ~104 bytes
  try {
    const big = 'A'.repeat(1000); // ~750 decoded bytes
    const result = validateImageInput({ image: big, mimeType: 'image/png' });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.code, 'IMAGE_TOO_LARGE');
      assert.match(result.error, /too large/i);
    }
  } finally {
    if (saved === undefined) delete process.env.AZURE_AI_MAX_IMAGE_MB;
    else process.env.AZURE_AI_MAX_IMAGE_MB = saved;
  }
});

test('approxBase64Bytes: computes decoded length (ignoring whitespace/padding)', () => {
  assert.equal(approxBase64Bytes('aGVsbG8='), 5); // "hello"
  assert.equal(approxBase64Bytes('QQ=='), 1); // "A"
  assert.equal(approxBase64Bytes(''), 0);
});

test('checkRequestBodySize: rejects over-limit Content-Length, passes null/valid', () => {
  const over = String(maxImageRequestBytes() + 1);
  assert.equal(checkRequestBodySize(over).ok, false);
  assert.equal(checkRequestBodySize(null).ok, true);
  assert.equal(checkRequestBodySize('1024').ok, true);
  assert.equal(checkRequestBodySize('not-a-number').ok, true);
});
