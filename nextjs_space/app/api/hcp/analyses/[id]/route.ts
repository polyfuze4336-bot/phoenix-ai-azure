export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 30;

import { NextRequest } from 'next/server';
import { getAnalysisRecord } from '@/lib/analysis/history';
import { getCurrentSession } from '@/lib/auth/current-session';
import { isEntraMode } from '@/lib/auth/auth-config';

/** Return a single retained analysis with a fresh short-lived image SAS URL. */
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = isEntraMode() ? await getCurrentSession() : null;
  if (!session) {
    return Response.json({ error: 'Authentication required', code: 'unauthorized' }, { status: 401 });
  }
  const id = params?.id?.trim();
  if (!id || !/^[a-zA-Z0-9_-]{1,128}$/.test(id)) {
    return new Response(JSON.stringify({ error: 'Invalid record id.' }), { status: 400 });
  }

  try {
    const record = await getAnalysisRecord(id, session.email, session.roleKey === 'administrator');
    if (!record) {
      return new Response(JSON.stringify({ error: 'Analysis not found.' }), { status: 404 });
    }
    return new Response(JSON.stringify({ record }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    console.error('[Phoenix AI] history detail failed', { category: 'database_or_storage_load_failed' });
    return new Response(
      JSON.stringify({ error: 'Unable to load this analysis right now.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
