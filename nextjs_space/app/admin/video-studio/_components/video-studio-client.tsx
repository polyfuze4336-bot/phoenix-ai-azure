'use client';

import { useState, useCallback, useRef } from 'react';
import { extractYouTubeVideoId } from '@/lib/config/first-aid-video';
import { AlertCircle, CheckCircle2, Loader2, Play, RefreshCw, Video, Youtube, Sparkles } from 'lucide-react';

interface Props {
  currentEmbedUrl: string | null;
  currentVideoUrl: string | undefined;
  soraEnabled: boolean;
  soraModelDeployment: string;
}

type JobStatus = 'idle' | 'queued' | 'processing' | 'completed' | 'failed';

const FIRST_AID_TEMPLATE =
  'Create a professional healthcare education video demonstrating immediate first aid for a minor thermal burn. Show an adult placing the affected hand under clean, cool running tap water for at least 20 minutes. Do not show graphic injury, severe tissue damage, blood or distress. Show clear instructional actions: (1) move away from the heat source; (2) remove jewellery near the affected area when safe; (3) cool the burn under clean cool running water; (4) cover gently with a clean non-adherent dressing; (5) seek medical assessment when appropriate. Do not show ice, toothpaste, butter, oils or traditional remedies. Style: professional Malaysian public-health education video, clean healthcare environment, calm and factual, no dramatic effects.';

export function VideoStudioClient({ currentEmbedUrl, currentVideoUrl, soraEnabled, soraModelDeployment }: Props) {
  // YouTube section
  const [ytInput, setYtInput] = useState('');
  const [ytPreviewId, setYtPreviewId] = useState<string | null>(null);
  const [ytError, setYtError] = useState('');

  // Sora section
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState(8);
  const [generating, setGenerating] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus>('idle');
  const [jobError, setJobError] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [approved, setApproved] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const validateYt = useCallback(() => {
    const id = extractYouTubeVideoId(ytInput);
    if (id) {
      setYtPreviewId(id);
      setYtError('');
    } else {
      setYtPreviewId(null);
      setYtError('Not a recognised YouTube URL. Try https://www.youtube.com/watch?v=... or https://youtu.be/...');
    }
  }, [ytInput]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const pollStatus = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/admin/video/status/${encodeURIComponent(id)}`);
      if (!res.ok) { stopPolling(); setJobStatus('failed'); setJobError(`Status check failed: ${res.status}`); return; }
      const data = await res.json();
      const status = String(data?.status ?? '').toLowerCase();
      if (status === 'completed' || status === 'succeeded') {
        stopPolling();
        setJobStatus('completed');
        if (data?.result?.url) setVideoUrl(data.result.url);
      } else if (status === 'failed' || status === 'cancelled') {
        stopPolling();
        setJobStatus('failed');
        setJobError(`Generation ${status}.`);
      } else {
        setJobStatus(status === 'running' || status === 'processing' ? 'processing' : 'queued');
      }
    } catch {
      stopPolling();
      setJobStatus('failed');
      setJobError('Could not reach status API.');
    }
  }, [stopPolling]);

  const generateVideo = useCallback(async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setJobId(null);
    setJobStatus('queued');
    setJobError('');
    setVideoUrl(null);
    setApproved(false);
    stopPolling();
    try {
      const res = await fetch('/api/admin/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), width: 1280, height: 720, duration }),
      });
      const data = await res.json();
      if (!res.ok) {
        setJobStatus('failed');
        setJobError(data?.error ?? `API error ${res.status}`);
        return;
      }
      if (data?.jobId) {
        setJobId(data.jobId);
        pollRef.current = setInterval(() => { void pollStatus(data.jobId); }, 5000);
      } else {
        setJobStatus('completed');
      }
    } catch {
      setJobStatus('failed');
      setJobError('Request failed.');
    } finally {
      setGenerating(false);
    }
  }, [prompt, duration, stopPolling, pollStatus]);

  const statusLabel: Record<JobStatus, string> = {
    idle: 'Ready', queued: 'Queued', processing: 'Generating…',
    completed: 'Completed', failed: 'Failed',
  };
  const statusColor: Record<JobStatus, string> = {
    idle: 'text-gray-500', queued: 'text-amber-600', processing: 'text-blue-600',
    completed: 'text-green-700', failed: 'text-red-600',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo admin banner */}
      <div className="bg-amber-50 border-b border-amber-300 px-4 py-2 text-center text-xs font-semibold text-amber-800">
        Demo Administration — this route is not linked from navigation and does not have production-grade access control.
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 space-y-8">
        <header>
          <h1 className="font-display text-2xl font-bold text-gray-900">First Aid Video Studio</h1>
          <p className="text-sm text-gray-500 mt-1">Manage the first aid video shown on the Community portal.</p>
        </header>

        {/* ── Current published video ── */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2"><Play className="w-4 h-4 text-[#8B0000]" /> Current Published Video</h2>
          {currentEmbedUrl ? (
            <>
              <div className="rounded-lg overflow-hidden bg-black aspect-video">
                <iframe className="w-full h-full border-0" src={currentEmbedUrl} title="Current first aid video"
                  allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen" allowFullScreen />
              </div>
              <p className="text-xs text-gray-500 break-all">Source: <code className="bg-gray-100 px-1 rounded">{currentVideoUrl ?? '(env: FIRST_AID_VIDEO_URL)'}</code></p>
              <p className="text-xs text-amber-700 bg-amber-50 rounded p-2 border border-amber-200">
                To change the default video, update <code className="font-mono">FIRST_AID_VIDEO_URL</code> in Azure Container App environment settings and redeploy.
              </p>
            </>
          ) : (
            <div className="flex items-center gap-2 text-amber-800 bg-amber-50 rounded-lg p-3 text-sm border border-amber-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              No video configured. Set <code className="font-mono mx-1">FIRST_AID_VIDEO_URL</code> in environment settings.
            </div>
          )}
        </section>

        {/* ── YouTube URL management ── */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2"><Youtube className="w-4 h-4 text-red-600" /> YouTube Video</h2>
          <p className="text-xs text-gray-500">Validate and preview a YouTube URL before updating the environment variable.</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={ytInput}
              onChange={(e) => setYtInput(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#8B0000]/30"
            />
            <button onClick={validateYt} className="px-4 py-2 bg-[#8B0000] text-white rounded-lg text-sm font-medium hover:bg-[#7a0000]">Validate & Preview</button>
          </div>
          {ytError && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {ytError}</p>}
          {ytPreviewId && (
            <>
              <div className="flex items-center gap-1 text-xs text-green-700"><CheckCircle2 className="w-3 h-3" /> Valid YouTube video ID: <code className="font-mono">{ytPreviewId}</code></div>
              <div className="rounded-lg overflow-hidden bg-black aspect-video">
                <iframe className="w-full h-full border-0"
                  src={`https://www.youtube-nocookie.com/embed/${ytPreviewId}?autoplay=0&controls=1`}
                  title="YouTube preview"
                  allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen" allowFullScreen />
              </div>
              <p className="text-xs text-gray-500 bg-gray-50 rounded p-2 border">
                To set as first aid video: update <code className="font-mono">FIRST_AID_VIDEO_URL=https://www.youtube.com/watch?v={ytPreviewId}</code> in Azure Container App environment settings.
              </p>
            </>
          )}
        </section>

        {/* ── Azure AI Video Generation ── */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2"><Sparkles className="w-4 h-4 text-purple-600" /> AI Video Generation</h2>

          {!soraEnabled ? (
            <div className="flex items-start gap-3 rounded-lg bg-gray-50 border border-gray-200 p-4 text-sm text-gray-700">
              <Video className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Azure video generation is not configured.</p>
                <p className="mt-1 text-xs text-gray-500">To enable, set the following in Azure Container App environment settings:</p>
                <pre className="mt-2 text-xs bg-gray-100 rounded p-2 overflow-x-auto">{`AZURE_VIDEO_GENERATION_ENABLED=true
AZURE_VIDEO_ENDPOINT=https://<resource>.openai.azure.com
AZURE_VIDEO_MODEL_DEPLOYMENT=sora-2`}</pre>
                <p className="mt-2 text-xs text-gray-500">A compatible Azure OpenAI Sora or Sora 2 deployment in the target resource is required.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 rounded p-2 border border-green-200">
                <CheckCircle2 className="w-3 h-3" /> Azure video generation configured — model: <code className="font-mono">{soraModelDeployment}</code>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Prompt</label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={5}
                    placeholder="Describe the educational video to generate…"
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#8B0000]/30"
                  />
                  <button
                    onClick={() => setPrompt(FIRST_AID_TEMPLATE)}
                    className="mt-1 text-xs text-[#8B0000] hover:underline"
                  >Use First Aid Template</button>
                </div>

                <div className="flex gap-4 items-center">
                  <label className="text-xs font-semibold text-gray-600">Duration</label>
                  {[4, 8, 12].map((d) => (
                    <button key={d}
                      onClick={() => setDuration(d)}
                      className={`px-3 py-1 rounded text-xs font-medium border ${duration === d ? 'bg-[#8B0000] text-white border-[#8B0000]' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                    >{d}s</button>
                  ))}
                </div>

                <button
                  onClick={() => { void generateVideo(); }}
                  disabled={generating || !prompt.trim() || jobStatus === 'processing' || jobStatus === 'queued'}
                  className="flex items-center gap-2 px-4 py-2 bg-[#8B0000] text-white rounded-lg text-sm font-medium hover:bg-[#7a0000] disabled:opacity-50"
                >
                  {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Generate Video
                </button>
              </div>

              {jobStatus !== 'idle' && (
                <div className="rounded-lg border border-gray-200 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">Generation Status</span>
                    <span className={`text-sm font-semibold ${statusColor[jobStatus]}`}>{statusLabel[jobStatus]}</span>
                  </div>
                  {jobId && <p className="text-xs text-gray-500">Job ID: <code className="font-mono">{jobId}</code></p>}
                  {(jobStatus === 'queued' || jobStatus === 'processing') && (
                    <div className="flex items-center gap-2 text-xs text-blue-700">
                      <Loader2 className="w-3 h-3 animate-spin" /> Auto-refreshing…
                      <button onClick={() => jobId && void pollStatus(jobId)} className="underline ml-1">Refresh now</button>
                    </div>
                  )}
                  {jobError && <p className="text-xs text-red-600">{jobError}</p>}
                  {jobStatus === 'completed' && (
                    <div className="space-y-3">
                      <div className="rounded-lg bg-amber-50 border border-amber-300 p-3 text-xs text-amber-800">
                        AI-generated educational content — review before publication.
                      </div>
                      {videoUrl && (
                        <video controls className="w-full rounded-lg bg-black aspect-video" src={videoUrl}>
                          Your browser does not support the video tag.
                        </video>
                      )}
                      {!videoUrl && <p className="text-xs text-gray-500">Video URL not returned by API. Check raw job result in Azure portal.</p>}
                      <div className="flex gap-2 flex-wrap">
                        <button onClick={() => { void generateVideo(); }}
                          className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200">
                          <RefreshCw className="w-3 h-3 inline mr-1" /> Regenerate
                        </button>
                        <button onClick={() => { setJobStatus('idle'); setJobId(null); setVideoUrl(null); setApproved(false); }}
                          className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200">
                          Discard
                        </button>
                        <button onClick={() => setApproved(true)}
                          className="px-3 py-2 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700">
                          <CheckCircle2 className="w-3 h-3 inline mr-1" /> Approve for Demo
                        </button>
                      </div>
                      {approved && (
                        <div className="text-xs text-green-800 bg-green-50 rounded p-2 border border-green-200">
                          Approved. To publish as the live first aid video, host the generated video file and update <code className="font-mono">FIRST_AID_VIDEO_URL</code> to point to the hosted URL, or use the Azure Blob Storage integration.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
