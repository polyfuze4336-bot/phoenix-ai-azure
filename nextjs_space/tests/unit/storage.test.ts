/**
 * Unit tests — storage upload validation + blob path derivation.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateUpload,
  ALLOWED_STORAGE_MIME_TYPES,
  maxStorageFileBytes,
  isAllowedStorageContentType,
  buildBlobPath,
} from '../../lib/storage/types';

test('isAllowedStorageContentType: accepts the allow-list, rejects others', () => {
  for (const mime of ALLOWED_STORAGE_MIME_TYPES) {
    assert.equal(isAllowedStorageContentType(mime), true);
  }
  assert.equal(isAllowedStorageContentType('text/html'), false);
  assert.equal(isAllowedStorageContentType('application/octet-stream'), false);
});

test('validateUpload: allowed type + valid size passes (normalised content type)', () => {
  const result = validateUpload('IMAGE/JPEG', 1024);
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.contentType, 'image/jpeg');
    assert.equal(result.size, 1024);
  }
});

test('validateUpload: empty content type is rejected', () => {
  const result = validateUpload('', 1024);
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.error, /content type is required/i);
});

test('validateUpload: disallowed type is rejected', () => {
  const result = validateUpload('application/zip', 1024);
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.error, /unsupported file type/i);
});

test('validateUpload: empty/zero-size file is rejected', () => {
  const result = validateUpload('image/png', 0);
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.error, /empty/i);
});

test('validateUpload: oversized file is rejected (default 15 MB limit)', () => {
  const oversize = maxStorageFileBytes() + 1;
  const result = validateUpload('image/png', oversize);
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.error, /too large/i);
});

test('maxStorageFileBytes: default is 15 MB', () => {
  const saved = process.env.AZURE_STORAGE_MAX_FILE_MB;
  delete process.env.AZURE_STORAGE_MAX_FILE_MB;
  try {
    assert.equal(maxStorageFileBytes(), 15 * 1024 * 1024);
  } finally {
    if (saved === undefined) delete process.env.AZURE_STORAGE_MAX_FILE_MB;
    else process.env.AZURE_STORAGE_MAX_FILE_MB = saved;
  }
});

test('buildBlobPath: date-partitioned, uuid file name, correct extension, no verbatim name', () => {
  const path = buildBlobPath('wound-analysis', 'image/png', 'my-secret-patient-photo.PNG');
  assert.match(path, /^wound-analysis\/\d{4}\/\d{2}\/\d{2}\/[0-9a-f-]{36}\.png$/);
  assert.ok(!path.includes('my-secret-patient-photo'), 'original file name must not appear');
});

test('buildBlobPath: sanitises an unsafe category and defaults when missing', () => {
  const unsafe = buildBlobPath('../../etc', 'image/jpeg');
  assert.ok(!unsafe.includes('..'), 'path traversal must be stripped');
  assert.match(unsafe, /\.jpg$/);
  const missing = buildBlobPath(undefined, 'application/pdf');
  assert.match(missing, /^misc\/\d{4}\/\d{2}\/\d{2}\/[0-9a-f-]{36}\.pdf$/);
});
