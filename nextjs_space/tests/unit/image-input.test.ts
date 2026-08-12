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
  maxImageCollectionRequestBytes,
  checkImageCollectionRequestBodySize,
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_ANALYSIS_IMAGES,
  validateImageCollection,
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
  if (result.ok) assert.equal(result.mimeType, 'image/png');
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

test('checkImageCollectionRequestBodySize: uses a larger aggregate ceiling only for HCP collections', () => {
  assert.ok(maxImageCollectionRequestBytes() > maxImageRequestBytes());
  const betweenLimits = String(maxImageRequestBytes() + 1);
  assert.equal(checkRequestBodySize(betweenLimits).ok, false);
  assert.equal(checkImageCollectionRequestBodySize(betweenLimits).ok, true);
  assert.equal(checkImageCollectionRequestBodySize(String(maxImageCollectionRequestBytes() + 1)).ok, false);
});

test('validateImageCollection: accepts and normalizes one to five images', () => {
  const result = validateImageCollection([
    { image: `data:image/png;base64,${tinyBase64}`, mimeType: 'image/png' },
    { image: tinyBase64, mimeType: 'image/jpeg' },
  ]);
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.images.length, 2);
    assert.equal(result.images[0].image, tinyBase64);
    assert.equal(result.totalBytes, 10);
  }
});

test('validateImageCollection: rejects empty and over-limit collections', () => {
  assert.equal(validateImageCollection([]).ok, false);
  const tooMany = Array.from({ length: MAX_ANALYSIS_IMAGES + 1 }, () => ({ image: tinyBase64 }));
  const result = validateImageCollection(tooMany);
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.error, /maximum of 5/i);
});

test('validateImageCollection: enforces a combined decoded-size limit', () => {
  const saved = process.env.AZURE_AI_MAX_TOTAL_IMAGE_MB;
  process.env.AZURE_AI_MAX_TOTAL_IMAGE_MB = '0.00001';
  try {
    const result = validateImageCollection([
      { image: 'A'.repeat(12), mimeType: 'image/png' },
      { image: 'A'.repeat(12), mimeType: 'image/png' },
    ]);
    assert.equal(result.ok, false);
    if (!result.ok) assert.match(result.error, /combined images are too large/i);
  } finally {
    if (saved === undefined) delete process.env.AZURE_AI_MAX_TOTAL_IMAGE_MB;
    else process.env.AZURE_AI_MAX_TOTAL_IMAGE_MB = saved;
  }
});
