import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Flame, FolderKanban, Gauge, TrendingUp } from 'lucide-react';
import { PhoenixShell } from '@/components/phoenix-v2-shell';
import { StatCard } from '@/components/stat-card';
import { SectionHeading } from '@/components/section-heading';
import { SyntheticDataNote } from '@/components/demo-badge';
import { MiniBarChart, ColumnChart } from '@/components/mini-bar-chart';
import { DonutChart } from '@/components/donut-chart';
import {
  getDashboardStats, getCaseTypeDistribution, getSeverityDistribution,
  getStatusDistribution, getWeeklyVolume,
} from '@/lib/demo-data';
import { isFeatureEnabled } from '@/lib/feature-flags';

export const metadata: Metadata = { title: 'Insights · Phoenix AI v2.0' };

export default function V2InsightsPage() {
  if (!isFeatureEnabled('insights')) notFound();
  const stats = getDashboardStats();
  const byType = getCaseTypeDistribution();
  const bySeverity = getSeverityDistribution();
  const byStatus = getStatusDistribution();
  const weekly = getWeeklyVolume();

  return (
    <PhoenixShell variant="hcp" title="Insights" subtitle="Operational analytics (synthetic)">
      <div className="space-y-8">
        <section>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            <StatCard label="Total cases" value={stats.totalCases} icon={FolderKanban} accent="primary" />
            <StatCard label="Burn cases" value={stats.burnCases} icon={Flame} accent="secondary" hint={`avg ${stats.avgTbsa}% TBSA`} />
            <StatCard label="Healed" value={stats.healed} icon={TrendingUp} accent="accent" />
            <StatCard label="Avg. confidence" value={`${Math.round(stats.avgConfidence * 100)}%`} icon={Gauge} accent="blue" />
          </div>
          <SyntheticDataNote className="mt-3" />
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border bg-card p-5">
            <SectionHeading title="Case types" description="Distribution across categories" />
            <div className="mt-5">
              <DonutChart data={byType} />
            </div>
          </div>
          <div className="rounded-xl border bg-card p-5">
            <SectionHeading title="Severity mix" description="How cases distribute by severity" />
            <MiniBarChart data={bySeverity} className="mt-5" />
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border bg-card p-5">
            <SectionHeading title="Weekly volume" description="New cases over the last 8 weeks" />
            <ColumnChart data={weekly} className="mt-5" />
          </div>
          <div className="rounded-xl border bg-card p-5">
            <SectionHeading title="Case status" description="Current pipeline" />
            <MiniBarChart data={byStatus} className="mt-5" />
          </div>
        </section>

        <p className="rounded-xl border border-dashed p-4 text-center text-xs text-muted-foreground">
          All figures are derived deterministically from a synthetic demonstration dataset. They do not represent real clinical
          activity, outcomes, or diagnostic performance.
        </p>
      </div>
    </PhoenixShell>
  );
}
