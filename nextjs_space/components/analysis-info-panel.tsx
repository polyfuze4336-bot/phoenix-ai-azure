'use client';

/**
 * Analysis assurance surfaces for the v2 assessment result:
 *  - `AssuranceStatusLine`: a compact, understated one-line status.
 *  - `AnalysisInfoPanel`: an expandable "Analysis Information" panel exposing the
 *    non-sensitive traceability metadata (model deployment, versions, image quality,
 *    review status). It never exposes API keys, system prompts or chain-of-thought.
 *
 * Tone: corporate + clinical. No shields, badges of approval, trust scores or
 * gamification — factual metadata only.
 */

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Info, ShieldCheck, Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AnalysisMetadata } from '@/lib/ai/analysis/metadata';
import { reviewStatusLabel } from '@/lib/ai/analysis/metadata';

const IMAGE_QUALITY_LABEL: Record<AnalysisMetadata['imageQuality'], string> = {
  good: 'Good',
  limited: 'Limited',
  insufficient: 'Insufficient',
  unknown: 'Not assessed',
};

/** Compact, factual status line shown directly under an AI-assisted result. */
export function AssuranceStatusLine({ meta }: { meta: AnalysisMetadata }) {
  const parts = ['AI-generated', 'Structured validation complete', reviewStatusLabel(meta.reviewStatus)];
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
      <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-primary/70" aria-hidden />
      {parts.map((p, i) => (
        <span key={p} className="flex items-center gap-2">
          {i > 0 ? <span className="text-muted-foreground/40">·</span> : null}
          <span>{p}</span>
        </span>
      ))}
    </div>
  );
}

interface Row {
  label: string;
  value: string;
}

/** Expandable metadata panel. `data` may be undefined (older results) — renders nothing. */
export function AnalysisInfoPanel({ meta }: { meta?: AnalysisMetadata }) {
  const [open, setOpen] = useState(false);
  if (!meta) return null;

  const rows: Row[] = [
    { label: 'Analysis ID', value: meta.analysisId },
    { label: 'Generated', value: safeTime(meta.generatedAt) },
    { label: 'Model deployment', value: meta.modelDeployment },
    { label: 'Pipeline', value: `${meta.pipelineMode} · v${meta.pipelineVersion}` },
    { label: 'Prompt versions', value: formatPromptVersions(meta.promptVersions) },
    { label: 'Schema version', value: meta.schemaVersion },
    { label: 'Image quality', value: IMAGE_QUALITY_LABEL[meta.imageQuality] },
    { label: 'Overall confidence', value: meta.overallConfidence },
    { label: 'Review status', value: reviewStatusLabel(meta.reviewStatus) },
  ];
  if (meta.deterministicCalculations.length > 0) {
    rows.push({ label: 'Deterministic calculations', value: meta.deterministicCalculations.join(', ') });
  }

  return (
    <div className="rounded-xl border bg-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 rounded-xl px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-muted/40"
      >
        <span className="flex items-center gap-2">
          <Info className="h-4 w-4 text-muted-foreground" aria-hidden />
          Analysis Information
        </span>
        <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-180')} aria-hidden />
      </button>
      {open ? (
        <div className="border-t px-4 py-3">
          <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
            {rows.map((r) => (
              <div key={r.label} className="flex flex-col">
                <dt className="text-xs text-muted-foreground">{r.label}</dt>
                <dd className="break-words text-sm font-medium">{r.value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
            <Cpu className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>
              Confidence reflects the model&apos;s self-report and image-quality gating — not validated
              diagnostic accuracy. See the{' '}
              <Link href="/hcp/ai-assurance" className="font-medium text-primary underline-offset-2 hover:underline">
                AI Assurance
              </Link>{' '}
              overview.
            </span>
          </p>
        </div>
      ) : null}
    </div>
  );
}

function safeTime(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

function formatPromptVersions(v: AnalysisMetadata['promptVersions']): string {
  return `obs ${v.visualObservation} · interp ${v.clinicalInterpretation} · mgmt ${v.management} · critic ${v.critic}`;
}
