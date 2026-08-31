import { NextRequest, NextResponse } from 'next/server';
import { getVideoStudioConfig } from '@/lib/config/video-studio';
import { getAzureAiToken } from '@/lib/ai/azure-credential';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  if (!id || !/^[\w-]{1,200}$/.test(id)) {
    return NextResponse.json({ error: 'Invalid job ID' }, { status: 400 });
  }

  const config = getVideoStudioConfig();
  if (!config.enabled || !config.endpoint) {
    return NextResponse.json({ configured: false }, { status: 503 });
  }

  const endpoint = config.endpoint.replace(/\/$/, '');
  const deployment = config.modelDeployment;
  const apiVersion = '2025-02-01-preview';
  const url = `${endpoint}/openai/deployments/${deployment}/video/generations/jobs/${encodeURIComponent(id)}?api-version=${apiVersion}`;

  let token: string;
  try {
    token = await getAzureAiToken();
  } catch {
    return NextResponse.json({ error: 'Azure credential error.' }, { status: 500 });
  }

  let azureResponse: Response;
  try {
    azureResponse = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to reach Azure video generation API.' }, { status: 502 });
  }

  if (!azureResponse.ok) {
    return NextResponse.json({ error: `Azure API error: ${azureResponse.status}` }, { status: 502 });
  }

  const data = await azureResponse.json().catch(() => null);
  return NextResponse.json({ status: data?.status, progress: data?.progress, result: data?.result, raw: data });
}
