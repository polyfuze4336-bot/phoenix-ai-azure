/**
 * Server-side persistence for retained HCP AI wound-analysis records.
 *
 * Orchestrates the two already-provisioned Azure building blocks:
 *  - Blob Storage (private `clinical-uploads` container) for the analysed image,
 *    accessed only through short-lived user-delegation SAS URLs.
 *  - PostgreSQL (Prisma model `AnalysisRecord`) for the structured assessment.
 *
 * Demo-auth note: the clinician name/email are supplied by the (client-side) demo
 * session and are stored for display only. They are NOT a security boundary — do
 * not use them for access control.
 *
 * SERVER-ONLY. Never import from a client component.
 */

import { prisma, withDbRetry } from '@/lib/db';
import { getStorageProvider, validateUpload } from '@/lib/storage/storage-provider';

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
  result: HcpAnalysisResult;
  /** Base64 image payload (no data-URL prefix), as sent to the analysis route. */
  image?: string | null;
  mimeType?: string | null;
  clinicianName?: string | null;
  clinicianEmail?: string | null;
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
export async function saveAnalysisRecord(input: SaveAnalysisInput): Promise<{ id: string }> {
  const { result } = input;
  if (!result || typeof result !== 'object') {
    throw new Error('An analysis result is required.');
  }

  let imageKey: string | null = null;
  let imageMimeType: string | null = null;

  const base64 = str(input.image);
  const mime = str(input.mimeType);
  if (base64 && mime) {
    const data = Buffer.from(base64, 'base64');
    const validation = validateUpload(mime, data.byteLength);
    if (!validation.ok) {
      throw new Error(validation.error);
    }
    const uploaded = await getStorageProvider().upload({
      data,
      contentType: validation.contentType,
      category: 'wound-analysis',
      metadata: { source: 'phoenix-ai' },
    });
    imageKey = uploaded.blobPath;
    imageMimeType = validation.contentType;
  }

  const record = await withDbRetry(() =>
    prisma.analysisRecord.create({
      data: {
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
        result: result as object,
      },
      select: { id: true },
    }),
  );

  return { id: record.id };
}

/** Return retained analyses, newest first, for the history list. */
export async function listAnalysisRecords(limit = 100): Promise<AnalysisRecordSummary[]> {
  const rows = await withDbRetry(() =>
    prisma.analysisRecord.findMany({
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
      },
    }),
  );

  return rows.map((r) => ({
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
  }));
}

/** Return a single retained analysis with a fresh image SAS URL. */
export async function getAnalysisRecord(id: string): Promise<AnalysisRecordDetail | null> {
  const row = await withDbRetry(() =>
    prisma.analysisRecord.findUnique({ where: { id } }),
  );
  if (!row) return null;

  let imageUrl: string | null = null;
  if (row.imageKey) {
    try {
      const read = await getStorageProvider().getReadUrl(row.imageKey);
      imageUrl = read.url;
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
    result: (row.result as HcpAnalysisResult) ?? {},
    imageUrl,
    imageMimeType: row.imageMimeType,
  };
}
