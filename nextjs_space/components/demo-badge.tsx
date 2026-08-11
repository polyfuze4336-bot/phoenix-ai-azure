'use client';

import { FlaskConical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DEMO_ENVIRONMENT_LABEL, SYNTHETIC_DATA_LABEL } from '@/lib/version';

/**
 * Discreet marker that labels the v2 experience as a demonstration so synthetic
 * data is never mistaken for real clinical records.
 */
export function DemoBadge({ className, variant = 'full' }: { className?: string; variant?: 'full' | 'compact' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-700',
        className,
      )}
      title={SYNTHETIC_DATA_LABEL}
    >
      <FlaskConical className="h-3 w-3" aria-hidden />
      {variant === 'full' ? DEMO_ENVIRONMENT_LABEL : 'Demo'}
    </span>
  );
}

/** Inline caption stating data is synthetic. */
export function SyntheticDataNote({ className }: { className?: string }) {
  return (
    <p className={cn('text-xs text-muted-foreground', className)}>
      {SYNTHETIC_DATA_LABEL} — fictional records for demonstration only. No real patients or PII.
    </p>
  );
}
