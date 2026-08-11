'use client';

/**
 * Clinical review panel — the human-oversight surface on a case.
 *
 * AI-assisted output is decision-support only. This panel makes the review state
 * explicit and lets a clinician record their decision (reviewed / modified /
 * escalated). AI is never marked "approved" — only a clinician reviews it.
 *
 * On the synthetic demo cases this records to local component state (clearly a
 * demonstration); in a wired deployment the same actions would persist to the
 * case audit record. See `lib/ai/analysis/metadata.ts` (ReviewStatus) and
 * control RAI-ACCT-001.
 */

import { useState } from 'react';
import { UserCheck, PencilLine, AlertTriangle, ClipboardCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ReviewStatus } from '@/lib/ai/analysis/metadata';
import { reviewStatusLabel } from '@/lib/ai/analysis/metadata';

const STATUS_STYLE: Record<ReviewStatus, string> = {
  awaiting_review: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300',
  reviewed: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300',
  modified: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300',
  escalated: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300',
};

interface LogEntry {
  status: ReviewStatus;
  at: string;
  by: string;
}

export function ClinicalReviewPanel({
  initialStatus = 'awaiting_review',
  clinician,
}: {
  initialStatus?: ReviewStatus;
  clinician: string;
}) {
  const [status, setStatus] = useState<ReviewStatus>(initialStatus);
  const [log, setLog] = useState<LogEntry[]>([]);

  const record = (next: ReviewStatus) => {
    setStatus(next);
    setLog((prev) => [{ status: next, at: new Date().toLocaleString(), by: clinician }, ...prev]);
  };

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 font-display text-sm font-bold tracking-tight">
          <ClipboardCheck className="h-4 w-4 text-primary" aria-hidden /> Clinical review
        </h3>
        <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium', STATUS_STYLE[status])}>
          {reviewStatusLabel(status)}
        </span>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        AI-assisted findings are decision-support only and require clinician confirmation. Record your review below.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" variant={status === 'reviewed' ? 'default' : 'outline'} onClick={() => record('reviewed')}>
          <UserCheck className="mr-1.5 h-4 w-4" /> Mark reviewed
        </Button>
        <Button size="sm" variant={status === 'modified' ? 'default' : 'outline'} onClick={() => record('modified')}>
          <PencilLine className="mr-1.5 h-4 w-4" /> Modified by clinician
        </Button>
        <Button size="sm" variant={status === 'escalated' ? 'default' : 'outline'} onClick={() => record('escalated')}>
          <AlertTriangle className="mr-1.5 h-4 w-4" /> Escalate
        </Button>
      </div>

      {log.length > 0 ? (
        <ul className="mt-4 space-y-1.5 border-t pt-3 text-xs text-muted-foreground">
          {log.map((e, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
              <span className="font-medium text-foreground">{reviewStatusLabel(e.status)}</span>
              <span>· {e.by} · {e.at}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
