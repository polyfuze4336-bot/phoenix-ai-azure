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
import { getCurrentSession } from '@/lib/auth/current-session';
import { isEntraMode } from '@/lib/auth/auth-config';

async function authorizedSession() {
  return isEntraMode() ? getCurrentSession() : null;
}

const unauthorized = () => Response.json({ error: 'Authentication required', code: 'unauthorized' }, { status: 401 });

/** Persist a completed HCP analysis (image + structured result) for later reference. */
export async function POST(request: NextRequest) {
  const session = await authorizedSession();
  if (!session) return unauthorized();
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
    if (typeof body?.id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.id)) {
      return new Response(JSON.stringify({ error: 'A valid analysis ID is required.' }), { status: 400 });
    }

    const correlationId = getOrCreateCorrelationId(request.headers);
    // Privacy-safe marker only: no image bytes or clinical text are recorded here.
    const { id } = await saveAnalysisRecord({
      id: body.id,
      result,
      image: body?.image ?? null,
      mimeType: body?.mimeType ?? null,
      clinicianName: session.name,
      clinicianEmail: session.email,
      assessmentType,
    });
    trackEvent('hcp_analysis_saved', { correlationId, hasImage: true, assessmentType });

    return new Response(JSON.stringify({ id }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Phoenix AI] history save failed', {
      category: error instanceof Error && error.message === 'image_validation_failed'
        ? 'image_validation_failed' : 'database_or_storage_save_failed',
    });
    return new Response(
      JSON.stringify({ error: 'Unable to save this analysis right now.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    );
  }
}

/** List retained analyses (newest first) for the history page. */
export async function GET(request: NextRequest) {
  const session = await authorizedSession();
  if (!session) return unauthorized();
  try {
    const selected = request.nextUrl.searchParams.get('assessmentType');
    const assessmentType = selected === 'legacy' ? null : parseAssessmentType(selected);
    if (selected !== 'legacy' && !assessmentType) {
      return new Response(JSON.stringify({ error: 'A valid assessment type is required.', records: [] }), { status: 400 });
    }
    const { records, legacyCount } = await listAnalysisRecords(assessmentType, session.email, session.roleKey === 'administrator');
    return new Response(JSON.stringify({ records, legacyCount }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    console.error('[Phoenix AI] history list failed', { category: 'database_load_failed' });
    return new Response(
      JSON.stringify({ error: 'Unable to load saved analyses right now.', records: [] }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
