import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import type { PrismaClient } from '@prisma/client';
import type { StorageProvider } from '../../lib/storage/types';
import { getAnalysisRecord, saveAnalysisRecord } from '../../lib/analysis/history';
import type { AssessmentType } from '../../lib/assessment-type';

const image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const clinicianEmail = 'clinician@example.test';

function storageStub() {
  const uploaded: string[] = [];
  const deleted: string[] = [];
  let blobAvailable = true;
  const storage: StorageProvider = {
    async upload(input) {
      assert.equal(input.contentType, 'image/png');
      assert.equal(input.data.length, Buffer.from(image, 'base64').length);
      const blobPath = `wound-analysis/${randomUUID()}.png`;
      uploaded.push(blobPath);
      return { blobPath, contentType: input.contentType, size: input.data.length, uploadedAt: new Date().toISOString() };
    },
    async delete(path) { deleted.push(path); },
    async exists(path) { return blobAvailable && uploaded.includes(path); },
    async getReadUrl(path) {
      assert.ok(uploaded.includes(path));
      return { url: `https://private.example.test/${path}?temporary-read-only`, expiresAt: new Date().toISOString() };
    },
  };
  return { storage, uploaded, deleted, hideBlob: () => { blobAvailable = false; } };
}

function recordStub() {
  const rows = new Map<string, Record<string, any>>();
  let failCreate = false;
  let loseResponse = false;
  const records = {
    async findUnique({ where }: { where: { id: string } }) { return rows.get(where.id) ?? null; },
    async create({ data }: { data: Record<string, any> }) {
      if (failCreate) throw new Error('simulated database failure');
      rows.set(data.id, { ...data, createdAt: new Date() });
      if (loseResponse) throw new Error('simulated lost response');
      return { id: data.id };
    },
  } as unknown as Pick<PrismaClient['analysisRecord'], 'findUnique' | 'create'>;
  return { rows, records, fail: () => { failCreate = true; }, loseResponse: () => { loseResponse = true; } };
}

for (const assessmentType of ['acute_burn', 'general_wound'] as AssessmentType[]) {
  test(`${assessmentType}: saves private image before record and reloads after service re-instantiation`, async () => {
    const blob = storageStub();
    const database = recordStub();
    const id = randomUUID();
    const result = assessmentType === 'acute_burn'
      ? { woundType: 'burn', burnDegree: 'unknown' }
      : { woundType: 'wound', generalWound: { timers: {} } };
    const input = { id, result, image, mimeType: 'image/png', clinicianEmail, assessmentType };

    assert.deepEqual(await saveAnalysisRecord(input, { storage: blob.storage, records: database.records }), { id });
    const stored = database.rows.get(id)!;
    assert.equal(stored.assessmentType, assessmentType);
    assert.equal(stored.imageKey, blob.uploaded[0]);
    assert.equal(stored.result, result);
    assert.equal(blob.uploaded.length, 1);

    // Simulate a lost HTTP response: the same ID must not create another blob/record.
    assert.deepEqual(await saveAnalysisRecord(input, { storage: blob.storage, records: database.records }), { id });
    assert.equal(blob.uploaded.length, 1);

    const reloaded = await getAnalysisRecord(id, clinicianEmail, false, { storage: blob.storage, records: database.records });
    assert.equal(reloaded?.assessmentType, assessmentType);
    assert.equal(reloaded?.imageUrl?.includes('temporary-read-only'), true);
    assert.deepEqual(reloaded?.result, result);
    assert.equal(await getAnalysisRecord(id, 'other@example.test', false, { storage: blob.storage, records: database.records }), null);

    blob.hideBlob();
    const missingImage = await getAnalysisRecord(id, clinicianEmail, false, { storage: blob.storage, records: database.records });
    assert.equal(missingImage?.imageUrl, null);
    assert.deepEqual(missingImage?.result, result);
  });
}

test('failed database write cleans uploaded image and does not save broken reference', async () => {
  const blob = storageStub();
  const database = recordStub();
  database.fail();
  await assert.rejects(
    saveAnalysisRecord({ id: randomUUID(), result: { woundType: 'burn' }, image, mimeType: 'image/png', clinicianEmail, assessmentType: 'acute_burn' },
      { storage: blob.storage, records: database.records }),
    /simulated database failure/,
  );
  assert.deepEqual(blob.deleted, blob.uploaded);
  assert.equal(database.rows.size, 0);
});

test('ambiguous database response preserves the blob referenced by a committed record', async () => {
  const blob = storageStub();
  const database = recordStub();
  database.loseResponse();
  const id = randomUUID();
  assert.deepEqual(await saveAnalysisRecord({
    id, result: { woundType: 'burn' }, image, mimeType: 'image/png',
    clinicianEmail, assessmentType: 'acute_burn',
  }, { storage: blob.storage, records: database.records }), { id });
  assert.equal(database.rows.get(id)?.imageKey, blob.uploaded[0]);
  assert.deepEqual(blob.deleted, []);
});

test('invalid image cannot reach private blob storage', async () => {
  const blob = storageStub();
  const database = recordStub();
  await assert.rejects(
    saveAnalysisRecord({ id: randomUUID(), result: { woundType: 'wound' }, image: 'not-an-image', mimeType: 'image/png', clinicianEmail, assessmentType: 'general_wound' },
      { storage: blob.storage, records: database.records }),
    /image_validation_failed/,
  );
  assert.equal(blob.uploaded.length, 0);
});

test('legacy record with no blob retains the structured assessment for an administrator', async () => {
  const blob = storageStub();
  const database = recordStub();
  const id = randomUUID();
  database.rows.set(id, { id, createdAt: new Date(), clinicianName: null, clinicianEmail: null,
    imageKey: null, imageMimeType: null, assessmentType: null, woundCategory: null, woundType: null,
    burnDegree: null, severity: null, confidence: null, tbsaEstimate: null, isBurn: true,
    result: { woundType: 'burn' } });
  assert.equal(await getAnalysisRecord(id, clinicianEmail, false, { storage: blob.storage, records: database.records }), null);
  const legacy = await getAnalysisRecord(id, clinicianEmail, true, { storage: blob.storage, records: database.records });
  assert.equal(legacy?.imageUrl, null);
  assert.deepEqual(legacy?.result, { woundType: 'burn' });
});
