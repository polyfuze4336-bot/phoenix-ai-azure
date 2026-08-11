'use client';

/**
 * AI Assurance — clinician-facing overview of PhoenixIQ's implemented Responsible AI
 * controls, evidence and governance.
 *
 * Tone: corporate + clinical + technical + evidence-based. No shields-as-mascots,
 * trust scores, certifications, regulatory-approval claims or gamification. Every
 * control shown here is backed by a source file (see `lib/rai/controls.ts`), and
 * status is honest (Active / Partial / Planned).
 */

import { useMemo, useState } from 'react';
import {
  ShieldCheck,
  ScanLine,
  Layers,
  CheckCircle2,
  UserCheck,
  Activity,
  ArrowRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import {
  ASSURANCE_LAYER_LABELS,
  CONTROL_STATUS_LABELS,
  RAI_PRINCIPLE_LABELS,
  type AssuranceLayer,
  type AssuranceStage,
  type ControlStatus,
  type RaiControl,
  type RaiPrinciple,
} from '@/lib/rai/controls';
import type { GovernanceSnapshot } from '@/lib/rai/governance';

const STAGE_ICON: Record<AssuranceLayer, typeof ShieldCheck> = {
  input: ScanLine,
  analysis: Layers,
  output: CheckCircle2,
  oversight: UserCheck,
  operations: Activity,
};

const STATUS_STYLE: Record<ControlStatus, string> = {
  active: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300',
  partial: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300',
  planned: 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300',
};

const PRINCIPLE_ORDER: RaiPrinciple[] = [
  'reliabilitySafety',
  'transparency',
  'accountability',
  'privacySecurity',
  'fairness',
  'inclusiveness',
];

function StatusBadge({ status }: { status: ControlStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        STATUS_STYLE[status],
      )}
    >
      {CONTROL_STATUS_LABELS[status]}
    </span>
  );
}

interface Props {
  controls: RaiControl[];
  stages: AssuranceStage[];
  counts: Record<ControlStatus, number>;
  governance: GovernanceSnapshot;
}

export function AiAssuranceClient({ controls, stages, counts, governance }: Props) {
  const [activeLayer, setActiveLayer] = useState<AssuranceLayer | null>(null);

  const controlsForLayer = useMemo(
    () => (activeLayer ? controls.filter((c) => c.layer === activeLayer) : controls),
    [controls, activeLayer],
  );

  return (
    <div className="space-y-8">
      {/* Intro */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-5 md:p-6">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              PhoenixIQ provides AI-assisted decision support. The controls below are implemented in the
              application and are traceable to source code and tests. They support — but do not replace —
              clinical judgement. Every assessment is reviewed by a clinician.
            </p>
            <div className="flex flex-wrap gap-2 pt-2 text-xs">
              <Badge variant="outline" className="border-emerald-200 text-emerald-700">{counts.active} Active</Badge>
              <Badge variant="outline" className="border-amber-200 text-amber-700">{counts.partial} Partial</Badge>
              <Badge variant="outline" className="border-slate-200 text-slate-600">{counts.planned} Planned</Badge>
            </div>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="flex w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="controls">Controls</TabsTrigger>
          <TabsTrigger value="matrix">Control Matrix</TabsTrigger>
          <TabsTrigger value="governance">Governance</TabsTrigger>
          <TabsTrigger value="limitations">Limitations</TabsTrigger>
        </TabsList>

        {/* --------------------------------------------------------- Overview */}
        <TabsContent value="overview" className="space-y-6">
          <section className="space-y-3">
            <h3 className="font-display text-lg font-bold tracking-tight">Assurance flow</h3>
            <p className="text-sm text-muted-foreground">
              Each assessment passes through five assurance layers. Select a layer to filter its controls.
            </p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
              {stages.map((stage, i) => {
                const Icon = STAGE_ICON[stage.layer];
                const active = activeLayer === stage.layer;
                return (
                  <button
                    key={stage.layer}
                    type="button"
                    onClick={() => setActiveLayer(active ? null : stage.layer)}
                    className={cn(
                      'group relative flex flex-col rounded-xl border bg-card p-4 text-left transition-colors hover:border-primary/40',
                      active && 'border-primary bg-primary/5',
                    )}
                  >
                    <span className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="text-sm font-semibold">{stage.title}</span>
                    <span className="mt-1 text-xs text-muted-foreground">{stage.summary}</span>
                    {i < stages.length - 1 ? (
                      <ArrowRight className="absolute -right-2 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-border md:block" aria-hidden />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold tracking-tight">
                {activeLayer ? `${ASSURANCE_LAYER_LABELS[activeLayer]} controls` : 'All controls'}
              </h3>
              {activeLayer ? (
                <button
                  type="button"
                  onClick={() => setActiveLayer(null)}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Show all
                </button>
              ) : null}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {controlsForLayer.map((c) => (
                <div key={c.id} className="rounded-xl border bg-card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-mono text-muted-foreground">{c.id}</span>
                      <h4 className="text-sm font-semibold">{c.title}</h4>
                    </div>
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{c.description}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge variant="secondary" className="text-[10px]">{RAI_PRINCIPLE_LABELS[c.principle]}</Badge>
                    {c.userVisible ? (
                      <Badge variant="outline" className="text-[10px]">Visible in product</Badge>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="font-display text-lg font-bold tracking-tight">How PhoenixIQ uses AI</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                A wound image is validated and quality-assessed, then interpreted by a multimodal model in a
                staged pipeline that separates what is <em>observed</em> from what is <em>interpreted</em>,
                attaches field-level confidence and evidence, and runs an automated consistency review.
              </p>
              <p>
                Clinically sensitive quantities are computed deterministically rather than guessed: fluid
                resuscitation (Parkland) is only produced when a weight is supplied, and total body surface
                area uses an age-adjusted Lund &amp; Browder chart. The model does not infer body weight,
                Fitzpatrick skin type, ethnicity, age or pain from a photograph.
              </p>
              <p>
                The result is labelled AI-generated, carries a traceable metadata record, and is presented for
                clinician review. AI output is never marked &ldquo;approved&rdquo; — only a clinician reviews,
                modifies or escalates it.
              </p>
            </div>
          </section>
        </TabsContent>

        {/* --------------------------------------------------------- Controls */}
        <TabsContent value="controls">
          <div className="overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-28">Control</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Layer</TableHead>
                  <TableHead>Principle</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Evidence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {controls.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs">{c.id}</TableCell>
                    <TableCell className="text-sm font-medium">{c.title}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{ASSURANCE_LAYER_LABELS[c.layer]}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{RAI_PRINCIPLE_LABELS[c.principle]}</TableCell>
                    <TableCell><StatusBadge status={c.status} /></TableCell>
                    <TableCell className="max-w-xs">
                      <code className="block truncate text-[11px] text-muted-foreground" title={c.evidence.join(', ')}>
                        {c.evidence[0]}
                      </code>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ----------------------------------------------------- Control Matrix */}
        <TabsContent value="matrix" className="space-y-6">
          {PRINCIPLE_ORDER.map((principle) => {
            const items = controls.filter((c) => c.principle === principle);
            if (items.length === 0) return null;
            return (
              <section key={principle} className="space-y-2">
                <h3 className="font-display text-base font-bold tracking-tight">{RAI_PRINCIPLE_LABELS[principle]}</h3>
                <div className="overflow-x-auto rounded-xl border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-28">Control</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Layer</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="font-mono text-xs">{c.id}</TableCell>
                          <TableCell className="text-sm font-medium">{c.title}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{ASSURANCE_LAYER_LABELS[c.layer]}</TableCell>
                          <TableCell><StatusBadge status={c.status} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </section>
            );
          })}
        </TabsContent>

        {/* ------------------------------------------------------- Governance */}
        <TabsContent value="governance">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <GovernanceCard title="Model" rows={[
              ['Analysis deployment', governance.analysisModelDeployment],
              ['Chat deployment', governance.chatModelDeployment],
              ['API version', governance.apiVersion],
              ['Identity', governance.identityModel],
            ]} />
            <GovernanceCard title="Pipeline & schema" rows={[
              ['Pipeline mode', governance.pipelineMode],
              ['Pipeline version', `v${governance.pipelineVersion}`],
              ['Schema version', governance.schemaVersion],
              ['App version', `v${governance.appVersion}`],
            ]} />
            <GovernanceCard title="Prompt versions" rows={[
              ['Visual observation', governance.promptVersions.visualObservation],
              ['Clinical interpretation', governance.promptVersions.clinicalInterpretation],
              ['Management', governance.promptVersions.management],
              ['Consistency review', governance.promptVersions.critic],
            ]} />
            <GovernanceCard title="Assurance posture" rows={[
              ['Architecture version', governance.architectureVersion],
              ['Evaluation', governance.evaluationPosture],
            ]} />
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            This page never exposes API keys, connection strings, system prompts or model chain-of-thought.
            The model deployment name is configuration, not a secret.
          </p>
        </TabsContent>

        {/* ------------------------------------------------------ Limitations */}
        <TabsContent value="limitations" className="space-y-3">
          <h3 className="font-display text-lg font-bold tracking-tight">Known limitations</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {KNOWN_LIMITATIONS.map((l) => (
              <li key={l} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" aria-hidden />
                <span>{l}</span>
              </li>
            ))}
          </ul>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function GovernanceCard({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <Card className="p-4">
      <h4 className="mb-3 text-sm font-semibold">{title}</h4>
      <dl className="space-y-2">
        {rows.map(([k, v]) => (
          <div key={k} className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
            <dt className="text-xs text-muted-foreground">{k}</dt>
            <dd className="break-words text-right text-xs font-medium">{v}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

const KNOWN_LIMITATIONS = [
  'Confidence values reflect model self-report and image-quality gating, not validated diagnostic accuracy.',
  'A single photograph cannot establish depth progression, infection, pain or sensation with certainty.',
  'Clinical guidance draws on curated general references that are not yet version-pinned citations.',
  'The evaluation harness measures structural behaviour (completeness, safety, referral appropriateness), not diagnostic correctness against clinician ground truth.',
  'A formal accessibility (WCAG) audit has not yet been completed.',
  'AI-assisted output is decision-support only and must be confirmed by a qualified clinician.',
];
