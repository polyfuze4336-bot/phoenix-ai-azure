import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
  trend?: { direction: 'up' | 'down' | 'flat'; label: string };
  accent?: 'primary' | 'secondary' | 'accent' | 'blue';
  className?: string;
}

const accentMap: Record<NonNullable<StatCardProps['accent']>, string> = {
  primary: 'text-primary bg-primary/10',
  secondary: 'text-secondary bg-secondary/15',
  accent: 'text-accent bg-accent/10',
  blue: 'text-blue-600 bg-blue-500/10',
};

export function StatCard({ label, value, icon: Icon, hint, trend, accent = 'primary', className }: StatCardProps) {
  return (
    <div className={cn('v2-stat-gradient rounded-xl border p-4 md:p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-1.5 font-mono text-2xl font-bold tracking-tight text-foreground md:text-3xl">{value}</p>
          {hint ? <p className="mt-1 truncate text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', accentMap[accent])}>
          <Icon className="h-5 w-5" aria-hidden />
        </span>
      </div>
      {trend ? (
        <p
          className={cn(
            'mt-3 text-xs font-medium',
            trend.direction === 'up' && 'text-emerald-600',
            trend.direction === 'down' && 'text-red-600',
            trend.direction === 'flat' && 'text-muted-foreground',
          )}
        >
          {trend.label}
        </p>
      ) : null}
    </div>
  );
}
