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
import { getAuthorizedAnalysisSession } from '@/lib/auth/analysis-api-authorization';

/** Persist a completed HCP analysis (image + structured result) for later reference. */
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthorizedAnalysisSession();
    if (!session) {
      return new Response(JSON.stringify({ error: 'Authentication required.' }), { status: 401 });
    }
    const bodySize = checkRequestBodySize(request.headers.get('content-length'));
    if (!bodySize.ok) {
      return new Response(JSON.stringify({ error: bodySize.error }), { status: 413 });
    }

    const body = await request.json().catch(() => null);
    const result = body?.result as HcpAnalysisResult | undefined;
    if (!result || typeof result !== 'object') {
      return new Response(JSON.stringify({ error: 'An analysis result is required.' }), { status: 400 });
    }

    const correlationId = getOrCreateCorrelationId(request.headers);
    // Privacy-safe marker only: no image bytes or clinical text are recorded here.
    trackEvent('hcp_analysis_saved', { correlationId, hasImage: Boolean(body?.image) });

    const { id } = await saveAnalysisRecord({
      result,
      image: body?.image ?? null,
      mimeType: body?.mimeType ?? null,
      clinicianName: session.name,
      clinicianEmail: session.email,
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
export async function GET() {
  try {
    const session = await getAuthorizedAnalysisSession();
    if (!session) {
      return new Response(JSON.stringify({ error: 'Authentication required.' }), { status: 401 });
    }
    const records = await listAnalysisRecords(session.email);
    return new Response(JSON.stringify({ records }), {
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
