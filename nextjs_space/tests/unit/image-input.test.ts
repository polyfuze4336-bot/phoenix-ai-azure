/**
 * Unit tests — image input validation for the AI analysis routes.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateImageInput,
  validateImageBatchInput,
  checkRequestBodySize,
  approxBase64Bytes,
  maxImageRequestBytes,
  ALLOWED_IMAGE_MIME_TYPES,
} from '../../lib/ai/validation/image-input';

const tinyBase64 = 'aGVsbG8='; // "hello"

test('validateImageInput: missing/empty image is rejected', () => {
  assert.equal(validateImageInput({}).ok, false);
  assert.equal(validateImageInput({ image: '' }).ok, false);
  assert.equal(validateImageInput({ image: '   ' }).ok, false);
  assert.equal(validateImageInput({ image: 123 }).ok, false);
});

test('validateImageInput: defaults MIME to image/jpeg', () => {
  const result = validateImageInput({ image: tinyBase64 });
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.mimeType, 'image/jpeg');
});

test('validateImageInput: strips a data-URL prefix before decoding', () => {
  const result = validateImageInput({
    image: `data:image/png;base64,${tinyBase64}`,
    mimeType: 'image/png',
  });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.mimeType, 'image/png');
    assert.equal(result.base64, tinyBase64);
  }
});

test('validateImageInput: disallowed MIME type is rejected', () => {
  const result = validateImageInput({ image: tinyBase64, mimeType: 'image/tiff' });
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.error, /unsupported image type/i);
});

test('validateImageInput: every allowed MIME type is accepted', () => {
  for (const mime of ALLOWED_IMAGE_MIME_TYPES) {
    assert.equal(validateImageInput({ image: tinyBase64, mimeType: mime }).ok, true, mime);
  }
});

test('validateImageInput: oversized image is rejected', () => {
  const saved = process.env.AZURE_AI_MAX_IMAGE_MB;
  process.env.AZURE_AI_MAX_IMAGE_MB = '0.0001'; // ~104 bytes
  try {
    const big = 'A'.repeat(1000); // ~750 decoded bytes
    const result = validateImageInput({ image: big, mimeType: 'image/png' });
    assert.equal(result.ok, false);
    if (!result.ok) assert.match(result.error, /too large/i);
  } finally {
    if (saved === undefined) delete process.env.AZURE_AI_MAX_IMAGE_MB;
    else process.env.AZURE_AI_MAX_IMAGE_MB = saved;
  }
});

test('approxBase64Bytes: computes decoded length (ignoring whitespace/padding)', () => {
  assert.equal(approxBase64Bytes(tinyBase64), 5); // "hello"
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

test('checkRequestBodySize: supports higher body ceiling when multiple images are allowed', () => {
  const twoImageLimit = maxImageRequestBytes() * 2;
  assert.equal(checkRequestBodySize(String(twoImageLimit), 2).ok, true);
  assert.equal(checkRequestBodySize(String(twoImageLimit + 1), 2).ok, false);
});

test('validateImageBatchInput: validates multiple images and enforces max count', () => {
  const ok = validateImageBatchInput(
    [
      { image: tinyBase64, mimeType: 'image/png' },
      { image: tinyBase64, mimeType: 'image/jpeg' },
    ],
    { maxImages: 2 },
  );
  assert.equal(ok.ok, true);
  if (ok.ok) {
    assert.equal(ok.images.length, 2);
    assert.equal(ok.totalBytes > 0, true);
  }

  const tooMany = validateImageBatchInput(
    [
      { image: tinyBase64, mimeType: 'image/png' },
      { image: tinyBase64, mimeType: 'image/jpeg' },
    ],
    { maxImages: 1 },
  );
  assert.equal(tooMany.ok, false);
  if (!tooMany.ok) assert.match(tooMany.error, /too many images/i);
});
