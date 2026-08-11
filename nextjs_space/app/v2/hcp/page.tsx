import type { Metadata } from 'next';
import Link from 'next/link';
import { FolderKanban, Activity, Flame, AlertTriangle, ScanLine, ArrowRight, ClipboardList, Gauge } from 'lucide-react';
import { PhoenixV2Shell } from '@/components/v2/phoenix-v2-shell';
import { StatCard } from '@/components/v2/stat-card';
import { SectionHeading } from '@/components/v2/section-heading';
import { CaseCard } from '@/components/v2/case-card';
import { SyntheticDataNote } from '@/components/v2/demo-badge';
import { ColumnChart } from '@/components/v2/mini-bar-chart';
import { Button } from '@/components/ui/button';
import { getDashboardStats, getDemoCases, getWeeklyVolume } from '@/lib/v2/demo-data';

export const metadata: Metadata = { title: 'Overview · Phoenix AI v2.0' };

export default function V2HcpDashboardPage() {
  const stats = getDashboardStats();
  const recent = [...getDemoCases()]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 6);
  const weekly = getWeeklyVolume();
  const priority = getDemoCases()
    .filter((c) => c.priority !== 'ROUTINE' && c.status !== 'HEALED')
    .slice(0, 4);

  return (
    <PhoenixV2Shell variant="hcp" title="Clinical Overview" subtitle="Your caseload at a glance">
      <div className="space-y-8">
        {/* KPI row */}
        <section>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            <StatCard label="Total cases" value={stats.totalCases} icon={FolderKanban} accent="primary" hint={`${stats.activeCases} active`} />
            <StatCard label="Burn cases" value={stats.burnCases} icon={Flame} accent="secondary" hint={`avg ${stats.avgTbsa}% TBSA`} />
            <StatCard label="Critical priority" value={stats.criticalPriority} icon={AlertTriangle} accent="blue" hint="need review" />
            <StatCard label="Avg. confidence" value={`${Math.round(stats.avgConfidence * 100)}%`} icon={Gauge} accent="accent" hint="AI assessments" />
          </div>
          <SyntheticDataNote className="mt-3" />
        </section>

        {/* Quick actions */}
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Link href="/v2/hcp/analysis" className="group flex items-center justify-between rounded-xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><ScanLine className="h-5 w-5" /></span>
              <div>
                <p className="font-display text-sm font-bold tracking-tight">New Assessment</p>
                <p className="text-xs text-muted-foreground">Guided AI workflow</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
          </Link>
          <Link href="/v2/hcp/cases" className="group flex items-center justify-between rounded-xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/15 text-secondary"><ClipboardList className="h-5 w-5" /></span>
              <div>
                <p className="font-display text-sm font-bold tracking-tight">Browse Cases</p>
                <p className="text-xs text-muted-foreground">{stats.totalCases} records</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
          </Link>
          <Link href="/v2/hcp/calculators" className="group flex items-center justify-between rounded-xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent"><Activity className="h-5 w-5" /></span>
              <div>
                <p className="font-display text-sm font-bold tracking-tight">Calculators</p>
                <p className="text-xs text-muted-foreground">TBSA &amp; Parkland</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
          </Link>
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Recent cases */}
          <section className="lg:col-span-2">
            <SectionHeading
              title="Recent cases"
              description="Most recently updated"
              actions={
                <Button asChild variant="outline" size="sm">
                  <Link href="/v2/hcp/cases">View all</Link>
                </Button>
              }
            />
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {recent.map((c) => (
                <CaseCard key={c.id} c={c} />
              ))}
            </div>
          </section>

          {/* Side column */}
          <section className="space-y-6">
            <div className="rounded-xl border bg-card p-5">
              <h3 className="font-display text-sm font-bold tracking-tight">Weekly case volume</h3>
              <p className="text-xs text-muted-foreground">Last 8 weeks (synthetic)</p>
              <ColumnChart data={weekly} className="mt-4" />
            </div>

            <div className="rounded-xl border bg-card p-5">
              <h3 className="font-display text-sm font-bold tracking-tight">Priority queue</h3>
              <p className="text-xs text-muted-foreground">Urgent &amp; critical, not yet healed</p>
              <ul className="mt-4 space-y-2">
                {priority.length === 0 ? (
                  <li className="text-sm text-muted-foreground">Nothing needs attention.</li>
                ) : (
                  priority.map((c) => (
                    <li key={c.id}>
                      <Link href={`/v2/hcp/cases/${c.id}`} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-muted">
                        <span className="truncate font-medium">{c.alias}</span>
                        <span className="ml-2 shrink-0 text-xs font-semibold text-red-600">{c.priority === 'CRITICAL' ? 'Critical' : 'Urgent'}</span>
                      </Link>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </section>
        </div>
      </div>
    </PhoenixV2Shell>
  );
}
