export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 30;

import { NextRequest } from 'next/server';
import { getAnalysisRecord } from '@/lib/analysis/history';
import { getAuthorizedAnalysisSession } from '@/lib/auth/analysis-api-authorization';

/** Return a single retained analysis with a fresh short-lived image SAS URL. */
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const id = params?.id?.trim();
  if (!id) {
    return new Response(JSON.stringify({ error: 'A record id is required.' }), { status: 400 });
  }

  try {
    const session = await getAuthorizedAnalysisSession();
    if (!session) {
      return new Response(JSON.stringify({ error: 'Authentication required.' }), { status: 401 });
    }
    const record = await getAnalysisRecord(id, session.email);
    if (!record) {
      return new Response(JSON.stringify({ error: 'Analysis not found.' }), { status: 404 });
    }
    return new Response(JSON.stringify({ record }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Get analysis error:', error?.message ?? error);
    return new Response(
      JSON.stringify({ error: 'Unable to load this analysis right now.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
