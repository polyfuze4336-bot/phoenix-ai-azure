import { cn } from '@/lib/utils';

interface SectionHeadingProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

/** Consistent section header used across the v2 pages. */
export function SectionHeading({ title, description, actions, className }: SectionHeadingProps) {
  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div>
        <h2 className="font-display text-xl font-bold tracking-tight text-foreground md:text-2xl">{title}</h2>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}
