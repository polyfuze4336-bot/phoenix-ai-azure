export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

import { NextRequest } from 'next/server';
import { checkRequestBodySize } from '@/lib/ai/validation/image-input';
import { getOrCreateCorrelationId } from '@/lib/telemetry/correlation';
import { trackEvent } from '@/lib/telemetry/server';
import {
  listAnalysisRecords,
  saveAnalysisRecord,
  type HcpAnalysisResult,
} from '@/lib/analysis/history';
import { parseAssessmentType } from '@/lib/assessment-type';

/** Persist a completed HCP analysis (image + structured result) for later reference. */
export async function POST(request: NextRequest) {
  try {
    const bodySize = checkRequestBodySize(request.headers.get('content-length'));
    if (!bodySize.ok) {
      return new Response(JSON.stringify({ error: bodySize.error }), { status: 413 });
    }

    const body = await request.json().catch(() => null);
    const result = body?.result as HcpAnalysisResult | undefined;
    const assessmentType = parseAssessmentType(body?.assessmentType);
    if (!result || typeof result !== 'object') {
      return new Response(JSON.stringify({ error: 'An analysis result is required.' }), { status: 400 });
    }
    if (!assessmentType) {
      return new Response(JSON.stringify({ error: 'A valid assessment type is required.' }), { status: 400 });
    }

    const correlationId = getOrCreateCorrelationId(request.headers);
    // Privacy-safe marker only: no image bytes or clinical text are recorded here.
    trackEvent('hcp_analysis_saved', { correlationId, hasImage: Boolean(body?.image) });

    const { id } = await saveAnalysisRecord({
      result,
      image: body?.image ?? null,
      mimeType: body?.mimeType ?? null,
      clinicianName: body?.clinician?.name ?? null,
      clinicianEmail: body?.clinician?.email ?? null,
      assessmentType,
    });

    return new Response(JSON.stringify({ id }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Save analysis error:', error?.message ?? error);
    return new Response(
      JSON.stringify({ error: 'Unable to save this analysis right now.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    );
  }
}

/** List retained analyses (newest first) for the history page. */
export async function GET(request: NextRequest) {
  try {
    const assessmentType = parseAssessmentType(request.nextUrl.searchParams.get('assessmentType'));
    if (!assessmentType) {
      return new Response(JSON.stringify({ error: 'A valid assessment type is required.', records: [] }), { status: 400 });
    }
    const { records, legacyCount } = await listAnalysisRecords(assessmentType);
    return new Response(JSON.stringify({ records, legacyCount }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('List analyses error:', error?.message ?? error);
    return new Response(
      JSON.stringify({ error: 'Unable to load saved analyses right now.', records: [] }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
