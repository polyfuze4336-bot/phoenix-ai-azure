/**
 * Server-side persistence for retained HCP AI wound-analysis records.
 *
 * Orchestrates the two already-provisioned Azure building blocks:
 *  - Blob Storage (private `clinical-uploads` container) for the analysed image,
 *    accessed only through short-lived user-delegation SAS URLs.
 *  - PostgreSQL (Prisma model `AnalysisRecord`) for the structured assessment.
 *
 * History routes require a server-verified Entra HCP session. Demo identity is
 * client-only and must never grant access to retained clinical data.
 *
 * SERVER-ONLY. Never import from a client component.
 */

import { prisma, withDbRetry } from '@/lib/db';
import { getStorageProvider, validateUpload } from '@/lib/storage/storage-provider';
import type { StorageProvider } from '@/lib/storage/types';
import { validateImageInput } from '@/lib/ai/validation/image-input';
import type { AssessmentType } from '@/lib/assessment-type';

/** The structured HCP wound assessment produced by /api/analyze-wound. */
export type HcpAnalysisResult = Record<string, unknown> & {
  woundCategory?: string;
  woundType?: string;
  burnDegree?: string;
  severity?: string;
  confidence?: string;
  tbsaEstimate?: string;
  isBurn?: boolean;
};

export interface SaveAnalysisInput {
  id: string;
  result: HcpAnalysisResult;
  /** Base64 image payload (no data-URL prefix), as sent to the analysis route. */
  image?: string | null;
  mimeType?: string | null;
  clinicianName?: string | null;
  clinicianEmail?: string | null;
  assessmentType: AssessmentType;
}

export interface AnalysisRecordSummary {
  id: string;
  createdAt: string;
  clinicianName: string | null;
  woundCategory: string | null;
  woundType: string | null;
  burnDegree: string | null;
  severity: string | null;
  confidence: string | null;
  tbsaEstimate: string | null;
  isBurn: boolean;
  hasImage: boolean;
  assessmentType: AssessmentType | null;
}

export interface AnalysisRecordDetail extends AnalysisRecordSummary {
  clinicianEmail: string | null;
  result: HcpAnalysisResult;
  /** Short-lived read-only SAS URL for the analysed image, if one was stored. */
  imageUrl: string | null;
  imageMimeType: string | null;
}

function str(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

/**
 * Persist an analysis result (and its image) for later reference.
 * Uploads the image to Blob Storage first, then writes the DB row.
 */
export async function saveAnalysisRecord(
  input: SaveAnalysisInput,
  dependencies: {
    storage?: StorageProvider;
    records?: Pick<typeof prisma.analysisRecord, 'findUnique' | 'create'>;
  } = {},
): Promise<{ id: string }> {
  const records = dependencies.records ?? prisma.analysisRecord;
  const existing = await withDbRetry(() => records.findUnique({ where: { id: input.id } }));
  if (existing) {
    if (existing.clinicianEmail !== input.clinicianEmail || existing.assessmentType !== input.assessmentType) {
      throw new Error('History ID already in use');
    }
    return { id: existing.id };
  }
  const { result } = input;
  if (!result || typeof result !== 'object') {
    throw new Error('An analysis result is required.');
  }

  let imageKey: string | null = null;
  let imageMimeType: string | null = null;

  const image = validateImageInput({ image: input.image, mimeType: input.mimeType });
  if (!image.ok) throw new Error('image_validation_failed');
  const data = Buffer.from(image.base64, 'base64');
  const validation = validateUpload(image.mimeType, data.byteLength);
  if (!validation.ok) throw new Error('image_validation_failed');
  const storage = dependencies.storage ?? getStorageProvider();
  const uploaded = await storage.upload({
    data,
    contentType: validation.contentType,
    category: 'wound-analysis',
    metadata: { source: 'phoenix-ai' },
  });
  imageKey = uploaded.blobPath;
  imageMimeType = validation.contentType;

  try {
    const record = await withDbRetry(() =>
      records.create({
        data: {
          id: input.id,
          clinicianName: str(input.clinicianName),
          clinicianEmail: str(input.clinicianEmail),
          imageKey,
          imageMimeType,
          woundCategory: str(result.woundCategory),
          woundType: str(result.woundType),
          burnDegree: str(result.burnDegree),
          severity: str(result.severity),
          confidence: str(result.confidence),
          tbsaEstimate: str(result.tbsaEstimate),
          isBurn: result.isBurn === true,
          assessmentType: input.assessmentType,
          result: result as object,
        },
        select: { id: true },
      }),
    );
    return { id: record.id };
  } catch (error) {
    // A lost DB response may follow a committed insert. Keep its referenced blob.
    const committed = await withDbRetry(() => records.findUnique({ where: { id: input.id } })).catch(() => null);
    if (committed?.imageKey === uploaded.blobPath &&
        committed.clinicianEmail === input.clinicianEmail &&
        committed.assessmentType === input.assessmentType) {
      return { id: committed.id };
    }
    try {
      await storage.delete(uploaded.blobPath);
    } catch {
      console.error('[Phoenix AI] history orphan cleanup failed', { category: 'database_save_failed' });
    }
    if (committed && committed.clinicianEmail === input.clinicianEmail && committed.assessmentType === input.assessmentType) {
      return { id: committed.id };
    }
    throw error;
  }
}

/** Return retained analyses, newest first, for the history list. */
export async function listAnalysisRecords(
  assessmentType: AssessmentType | null,
  ownerEmail: string,
  isAdministrator = false,
  limit = 100,
): Promise<{ records: AnalysisRecordSummary[]; legacyCount: number }> {
  const ownerFilter = isAdministrator ? {} : { clinicianEmail: ownerEmail };
  const [rows, legacyCount] = await withDbRetry(() =>
    prisma.$transaction([
      prisma.analysisRecord.findMany({
        where: { ...ownerFilter, assessmentType },
        orderBy: { createdAt: 'desc' },
        take: Math.min(Math.max(limit, 1), 200),
        select: {
          id: true,
          createdAt: true,
          clinicianName: true,
          woundCategory: true,
          woundType: true,
          burnDegree: true,
          severity: true,
          confidence: true,
          tbsaEstimate: true,
          isBurn: true,
          imageKey: true,
          assessmentType: true,
        },
      }),
      prisma.analysisRecord.count({ where: { ...ownerFilter, assessmentType: null } }),
    ]),
  );

  return { records: rows.map((r) => ({
    id: r.id,
    createdAt: r.createdAt.toISOString(),
    clinicianName: r.clinicianName,
    woundCategory: r.woundCategory,
    woundType: r.woundType,
    burnDegree: r.burnDegree,
    severity: r.severity,
    confidence: r.confidence,
    tbsaEstimate: r.tbsaEstimate,
    isBurn: r.isBurn,
    hasImage: Boolean(r.imageKey),
    assessmentType: r.assessmentType as AssessmentType | null,
  })), legacyCount };
}

/** Return a single retained analysis with a fresh image SAS URL. */
export async function getAnalysisRecord(
  id: string,
  ownerEmail: string,
  isAdministrator = false,
  dependencies: { storage?: StorageProvider; records?: Pick<typeof prisma.analysisRecord, 'findUnique'> } = {},
): Promise<AnalysisRecordDetail | null> {
  const row = await withDbRetry(() =>
    (dependencies.records ?? prisma.analysisRecord).findUnique({ where: { id } }),
  );
  if (!row || (!isAdministrator && row.clinicianEmail !== ownerEmail)) return null;

  let imageUrl: string | null = null;
  if (row.imageKey) {
    try {
      const storage = dependencies.storage ?? getStorageProvider();
      if (await storage.exists(row.imageKey)) {
        const read = await storage.getReadUrl(row.imageKey);
        imageUrl = read.url;
      }
    } catch {
      // A missing/unreadable blob must not break viewing the textual assessment.
      imageUrl = null;
    }
  }

  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    clinicianName: row.clinicianName,
    clinicianEmail: row.clinicianEmail,
    woundCategory: row.woundCategory,
    woundType: row.woundType,
    burnDegree: row.burnDegree,
    severity: row.severity,
    confidence: row.confidence,
    tbsaEstimate: row.tbsaEstimate,
    isBurn: row.isBurn,
    hasImage: Boolean(row.imageKey),
    assessmentType: row.assessmentType as AssessmentType | null,
    result: (row.result as HcpAnalysisResult) ?? {},
    imageUrl,
    imageMimeType: row.imageMimeType,
  };
}
