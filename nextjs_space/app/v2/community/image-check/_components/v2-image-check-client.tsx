'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Upload, Loader2, AlertTriangle, Ambulance, Hospital, Home, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/components/language-provider';

interface CommunityResult {
  recommendation?: string;
  summary?: string;
  whatYouSee?: string;
  careAdvice?: string;
  warningSigns?: string;
  [k: string]: unknown;
}

function recStyle(rec: string) {
  const lower = rec.toLowerCase();
  if (lower.includes('emergency') || lower.includes('kecemasan')) return { bg: 'border-red-200 bg-red-50 dark:bg-red-950/40', text: 'text-red-700 dark:text-red-300', icon: Ambulance };
  if (lower.includes('doctor') || lower.includes('doktor') || lower.includes('clinic') || lower.includes('klinik')) return { bg: 'border-orange-200 bg-orange-50 dark:bg-orange-950/40', text: 'text-orange-700 dark:text-orange-300', icon: Hospital };
  return { bg: 'border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-300', icon: Home };
}

export function V2ImageCheckClient() {
  const { lang } = useLanguage();
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<CommunityResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    setError(null);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(f);
  }, []);

  const analyze = useCallback(async () => {
    if (!file) return;
    setAnalyzing(true);
    setError(null);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string)?.split(',')[1] ?? '');
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const response = await fetch('/api/community-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, mimeType: file.type || 'image/jpeg', lang }),
      });
      if (!response.ok) throw new Error('Analysis failed. Please try again.');
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      if (reader) {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6);
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data);
              if (parsed?.status === 'completed' && parsed?.result) setResult(parsed.result as CommunityResult);
            } catch {
              /* skip */
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed.');
    } finally {
      setAnalyzing(false);
    }
  }, [file, lang]);

  const reset = () => {
    setPreview(null);
    setFile(null);
    setResult(null);
    setError(null);
  };

  const rec = result?.recommendation ? recStyle(result.recommendation) : null;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="rounded-xl border bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>This is general guidance, not a diagnosis. In an emergency, call your local emergency number now.</p>
        </div>
      </div>

      {!preview ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center rounded-xl border-2 border-dashed p-10 text-center transition-colors hover:border-primary/40 hover:bg-primary/5"
        >
          <Upload className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium text-foreground">Upload a photo</p>
          <p className="mt-1 text-xs text-muted-foreground">JPEG or PNG</p>
        </button>
      ) : (
        <div className="relative mx-auto aspect-video w-full max-w-md overflow-hidden rounded-lg border">
          <Image src={preview} alt="Selected" fill className="object-contain" />
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" onChange={onFile} className="hidden" />

      {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</div> : null}

      {preview && !result ? (
        <div className="flex justify-center gap-2">
          <Button variant="outline" onClick={reset}>Change photo</Button>
          <Button onClick={analyze} disabled={analyzing}>
            {analyzing ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Checking…</> : 'Check image'}
          </Button>
        </div>
      ) : null}

      {result ? (
        <div className="space-y-3">
          {rec && result.recommendation ? (
            <div className={cn('flex items-center gap-3 rounded-xl border p-4', rec.bg)}>
              <rec.icon className={cn('h-6 w-6 shrink-0', rec.text)} />
              <p className={cn('text-sm font-semibold', rec.text)}>{result.recommendation}</p>
            </div>
          ) : null}
          {result.whatYouSee ? <InfoBlock title="What this looks like" body={result.whatYouSee} /> : null}
          {result.summary ? <InfoBlock title="Summary" body={result.summary} /> : null}
          {result.careAdvice ? <InfoBlock title="Care advice" body={result.careAdvice} /> : null}
          {result.warningSigns ? <InfoBlock title="Warning signs" body={result.warningSigns} /> : null}
          <div className="flex justify-center">
            <Button variant="outline" onClick={reset}><RotateCcw className="mr-1.5 h-4 w-4" /> Check another</Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function InfoBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <h3 className="font-display text-sm font-bold tracking-tight">{title}</h3>
      <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
