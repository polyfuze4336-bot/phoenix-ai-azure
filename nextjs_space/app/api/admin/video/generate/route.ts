import { NextRequest, NextResponse } from 'next/server';
import { getVideoStudioConfig } from '@/lib/config/video-studio';
import { getAzureAiToken } from '@/lib/ai/azure-credential';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const config = getVideoStudioConfig();

  if (!config.enabled || !config.endpoint) {
    return NextResponse.json(
      { configured: false, message: 'Azure video generation is not configured. Set AZURE_VIDEO_GENERATION_ENABLED=true, AZURE_VIDEO_ENDPOINT, and AZURE_VIDEO_MODEL_DEPLOYMENT in app settings.' },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { prompt, width, height, duration } = (body ?? {}) as Record<string, unknown>;
  if (typeof prompt !== 'string' || prompt.trim().length < 10) {
    return NextResponse.json({ error: 'Prompt must be at least 10 characters.' }, { status: 400 });
  }

  const endpoint = config.endpoint.replace(/\/$/, '');
  const deployment = config.modelDeployment;
  const apiVersion = '2025-02-01-preview';
  const url = `${endpoint}/openai/deployments/${deployment}/video/generations/jobs?api-version=${apiVersion}`;

  let token: string;
  try {
    token = await getAzureAiToken();
  } catch {
    return NextResponse.json({ error: 'Azure credential error.' }, { status: 500 });
  }

  const azureBody = {
    prompt: String(prompt).trim().slice(0, 2000),
    size: `${width ?? 1280}x${height ?? 720}`,
    n_seconds: Number(duration ?? 8),
  };

  let azureResponse: Response;
  try {
    azureResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(azureBody),
    });
  } catch {
    return NextResponse.json({ error: 'Failed to reach Azure video generation API.' }, { status: 502 });
  }

  if (!azureResponse.ok) {
    const errText = await azureResponse.text().catch(() => '');
    return NextResponse.json(
      { error: `Azure API error: ${azureResponse.status}`, detail: errText.slice(0, 400) },
      { status: azureResponse.status >= 400 && azureResponse.status < 500 ? azureResponse.status : 502 },
    );
  }

  const data = await azureResponse.json().catch(() => null);
  return NextResponse.json({ jobId: data?.id, status: data?.status ?? 'queued', raw: data });
}
