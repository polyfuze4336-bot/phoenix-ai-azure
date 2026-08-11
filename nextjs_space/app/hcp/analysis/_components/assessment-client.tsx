'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Upload, Check, ChevronRight, ChevronLeft, Loader2, AlertTriangle,
  ScanLine, ClipboardList, Sparkles, RotateCcw, ImageIcon, Scale, Flame, MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
// import { StructuredAnalysis, type StructuredAnalysisData } from './structured-analysis';
import { AnalysisInfoPanel, AssuranceStatusLine } from '@/components/analysis-info-panel';
import type { AnalysisMetadata } from '@/lib/ai/analysis/metadata';

interface AnalysisResult {
  woundCategory: string;
  woundType: string;
  burnDegree: string;
  severity: string;
  confidence: string;
  tbsaRange: string;
  isBurn: boolean;
  meta?: AnalysisMetadata;
  [k: string]: unknown;
}

const STEPS = [
  { id: 1, label: 'Context', icon: ClipboardList },
  { id: 2, label: 'Capture', icon: ImageIcon },
  { id: 3, label: 'Quality', icon: ScanLine },
  { id: 4, label: 'Analysis', icon: Sparkles },
] as const;

async function readAnalysisStream(response: Response): Promise<AnalysisResult | null> {
  const reader = response.body?.getReader();
  if (!reader) return null;
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') return null;
        try {
          const parsed = JSON.parse(data);
          if (parsed?.status === 'completed' && parsed?.result) return parsed.result as AnalysisResult;
        } catch {
          /* skip partial */
        }
      }
    }
  }
  return null;
}

export function AssessmentClient() {
  const [step, setStep] = useState(1);
  const [weightKg, setWeightKg] = useState('');
  const [mechanism, setMechanism] = useState('');
  const [site, setSite] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [refining, setRefining] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastBase64 = useRef('');
  const lastMime = useRef('image/jpeg');

  const patientContext = useCallback(() => {
    const w = parseFloat(weightKg);
    const ctx = {
      weightKg: Number.isFinite(w) && w > 0 ? w : undefined,
      mechanism: mechanism.trim() || undefined,
      anatomicalSite: site.trim() || undefined,
    };
    return ctx.weightKg || ctx.mechanism || ctx.anatomicalSite ? ctx : undefined;
  }, [weightKg, mechanism, site]);

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setResult(null);
    setError(null);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const runAnalysis = useCallback(async () => {
    if (!imageFile) return;
    setAnalyzing(true);
    setError(null);
    setStep(4);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string)?.split(',')[1] ?? '');
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
      });
      const mime = imageFile.type || 'image/jpeg';
      lastBase64.current = base64;
      lastMime.current = mime;
      const response = await fetch('/api/analyze-wound', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, mimeType: mime, patient: patientContext() }),
      });
      if (!response.ok) throw new Error('Analysis failed. Please try again.');
      const completed = await readAnalysisStream(response);
      if (completed) setResult(completed);
      else throw new Error('The analysis did not return a result.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed.');
    } finally {
      setAnalyzing(false);
    }
  }, [imageFile, patientContext]);

  const refineAnalysis = useCallback(
    async (answers: string) => {
      if (!lastBase64.current || !result?.structured) return;
      setRefining(true);
      setError(null);
      try {
        const response = await fetch('/api/analyze-wound', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: lastBase64.current,
            mimeType: lastMime.current,
            patient: patientContext(),
            priorAnalysis: result.structured,
            refineAnswers: answers,
          }),
        });
        if (!response.ok) throw new Error('Refine failed.');
        const completed = await readAnalysisStream(response);
        if (completed) setResult(completed);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Refine failed.');
      } finally {
        setRefining(false);
      }
    },
    [result, patientContext],
  );

  const reset = useCallback(() => {
    setStep(1);
    setImagePreview(null);
    setImageFile(null);
    setResult(null);
    setError(null);
  }, []);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Stepper */}
      <ol className="flex items-center justify-between gap-2">
        {STEPS.map((s, idx) => {
          const active = step === s.id;
          const done = step > s.id;
          return (
            <li key={s.id} className="flex flex-1 items-center gap-2">
              <div
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-colors',
                  done && 'border-primary bg-primary text-primary-foreground',
                  active && 'border-primary bg-primary/10 text-primary',
                  !active && !done && 'border-border bg-card text-muted-foreground',
                )}
              >
                {done ? <Check className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
              </div>
              <span className={cn('hidden text-sm font-medium sm:block', active ? 'text-foreground' : 'text-muted-foreground')}>{s.label}</span>
              {idx < STEPS.length - 1 ? <span className="mx-1 hidden h-px flex-1 bg-border sm:block" /> : null}
            </li>
          );
        })}
      </ol>

      <div className="rounded-xl border bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>Decision-support only. AI output does not replace clinical judgement. Do not upload identifiable patient information.</p>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</div>
      ) : null}

      {/* Step 1: Context */}
      {step === 1 ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 rounded-xl border bg-card p-5 md:p-6">
          <div>
            <h3 className="font-display text-lg font-bold tracking-tight">Patient context</h3>
            <p className="text-sm text-muted-foreground">Optional — but supplying weight and mechanism improves accuracy and enables fluid calculation.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="flex items-center gap-1.5 text-sm font-medium"><Scale className="h-4 w-4 text-muted-foreground" /> Weight (kg)</span>
              <Input type="number" inputMode="decimal" min={0} value={weightKg} onChange={(e) => setWeightKg(e.target.value)} placeholder="e.g. 70" />
            </label>
            <label className="space-y-1.5">
              <span className="flex items-center gap-1.5 text-sm font-medium"><MapPin className="h-4 w-4 text-muted-foreground" /> Anatomical site</span>
              <Input value={site} onChange={(e) => setSite(e.target.value)} placeholder="e.g. right forearm" />
            </label>
            <label className="space-y-1.5 sm:col-span-2">
              <span className="flex items-center gap-1.5 text-sm font-medium"><Flame className="h-4 w-4 text-muted-foreground" /> Mechanism of injury</span>
              <Input value={mechanism} onChange={(e) => setMechanism(e.target.value)} placeholder="e.g. scald from hot water" />
            </label>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setStep(2)}>
              Continue <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      ) : null}

      {/* Step 2: Capture */}
      {step === 2 ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 rounded-xl border bg-card p-5 md:p-6">
          <div>
            <h3 className="font-display text-lg font-bold tracking-tight">Wound image</h3>
            <p className="text-sm text-muted-foreground">Upload a clear, well-lit photo. Include a scale reference (e.g. ruler) if possible.</p>
          </div>
          {imagePreview ? (
            <div className="relative mx-auto aspect-video w-full max-w-md overflow-hidden rounded-lg border">
              <Image src={imagePreview} alt="Selected wound" fill className="object-contain" />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full flex-col items-center rounded-xl border-2 border-dashed p-10 text-center transition-colors hover:border-primary/40 hover:bg-primary/5"
            >
              <Upload className="mb-3 h-10 w-10 text-muted-foreground" />
              <p className="font-medium text-foreground">Click to upload an image</p>
              <p className="mt-1 text-xs text-muted-foreground">JPEG or PNG — max 10MB</p>
            </button>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(1)}>
              <ChevronLeft className="mr-1 h-4 w-4" /> Back
            </Button>
            <div className="flex gap-2">
              {imagePreview ? (
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>Replace</Button>
              ) : null}
              <Button onClick={() => setStep(3)} disabled={!imagePreview}>
                Continue <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      ) : null}

      {/* Step 3: Quality */}
      {step === 3 ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 rounded-xl border bg-card p-5 md:p-6">
          <div>
            <h3 className="font-display text-lg font-bold tracking-tight">Pre-analysis quality check</h3>
            <p className="text-sm text-muted-foreground">Confirm the image before running the AI assessment. The AI also re-checks quality and gates its confidence accordingly.</p>
          </div>
          {imagePreview ? (
            <div className="relative mx-auto aspect-video w-full max-w-md overflow-hidden rounded-lg border">
              <Image src={imagePreview} alt="Selected wound" fill className="object-contain" />
            </div>
          ) : null}
          <ul className="space-y-2 text-sm">
            {['Wound is in focus and well-lit', 'The full wound margin is visible', 'A scale reference is included (recommended)', 'No identifiable patient information is visible'].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <span className="text-muted-foreground">{item}</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(2)}>
              <ChevronLeft className="mr-1 h-4 w-4" /> Back
            </Button>
            <Button onClick={runAnalysis} disabled={!imageFile}>
              <Sparkles className="mr-1.5 h-4 w-4" /> Run AI assessment
            </Button>
          </div>
        </motion.div>
      ) : null}

      {/* Step 4: Analysis */}
      {step === 4 ? (
        <div className="space-y-5">
          {analyzing ? (
            <div className="flex flex-col items-center justify-center rounded-xl border bg-card p-12 text-center">
              <Loader2 className="mb-4 h-10 w-10 animate-spin text-primary" />
              <p className="font-display text-lg font-bold tracking-tight">Analysing image…</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">Running the staged pipeline: visual observation, clinical interpretation, management guidance, and a consistency check.</p>
            </div>
          ) : null}

          {!analyzing && result ? (
            <>
              {result.meta ? <AssuranceStatusLine meta={result.meta} /> : null}
              {/* StructuredAnalysis component not yet available; using fallback rendering */}
              {/* {result.structured ? (
                <StructuredAnalysis data={result.structured} onRefine={refineAnalysis} refining={refining} />
              ) : ( */}
                <div className="rounded-xl border bg-card p-5">
                  <h3 className="font-display text-lg font-bold tracking-tight">Assessment</h3>
                  <dl className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                    <div><dt className="text-muted-foreground">Category</dt><dd className="font-medium">{result.woundCategory}</dd></div>
                    <div><dt className="text-muted-foreground">Type</dt><dd className="font-medium">{result.woundType}</dd></div>
                    <div><dt className="text-muted-foreground">Severity</dt><dd className="font-medium">{result.severity}</dd></div>
                    <div><dt className="text-muted-foreground">Confidence</dt><dd className="font-medium">{result.confidence}</dd></div>
                  </dl>
                </div>
              {/* )} */}
              {result.meta ? <AnalysisInfoPanel meta={result.meta} /> : null}
              
              {/* Data Protection Notice */}
              <div className="rounded-xl border bg-gradient-to-r from-blue-50/80 to-cyan-50/80 p-4 dark:from-blue-950/30 dark:to-cyan-950/30">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-blue-600 flex items-center justify-center">
                    <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="space-y-1.5">
                    <p className="font-semibold text-sm text-blue-900 dark:text-blue-300">Data Protection Notice</p>
                    <p className="text-xs leading-relaxed text-blue-800 dark:text-blue-200">
                      All patient data and images are protected in accordance with the laws and governance of Malaysia under the Ministry of Health (KKM), including the Personal Data Protection Act 2010 (PDPA) and relevant medical confidentiality regulations. This analysis is confidential and intended for authorized healthcare professionals only.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <Button variant="outline" onClick={reset}>
                  <RotateCcw className="mr-1.5 h-4 w-4" /> Start a new assessment
                </Button>
              </div>
            </>
          ) : null}

          {!analyzing && !result && error ? (
            <div className="flex justify-center gap-2">
              <Button variant="ghost" onClick={() => setStep(3)}>
                <ChevronLeft className="mr-1 h-4 w-4" /> Back
              </Button>
              <Button onClick={runAnalysis}>Try again</Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
