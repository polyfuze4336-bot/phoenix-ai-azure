'use client';

import { useMemo, useState } from 'react';
import { Droplets, Ruler, RotateCcw, ArrowRight, Info } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { calculateResuscitation, type ResuscitationFormula } from '@/lib/clinical/parkland';

/** Adult Rule of Nines regions (each togglable; legs/arms split L/R). */
const NINES_REGIONS: Array<{ key: string; label: string; pct: number }> = [
  { key: 'head', label: 'Head & Neck', pct: 9 },
  { key: 'antTrunk', label: 'Anterior Trunk', pct: 18 },
  { key: 'postTrunk', label: 'Posterior Trunk', pct: 18 },
  { key: 'rArm', label: 'Right Arm', pct: 9 },
  { key: 'lArm', label: 'Left Arm', pct: 9 },
  { key: 'rLeg', label: 'Right Leg', pct: 18 },
  { key: 'lLeg', label: 'Left Leg', pct: 18 },
  { key: 'genitalia', label: 'Genitalia', pct: 1 },
];

function tbsaSeverity(tbsa: number): { label: string; className: string } {
  if (tbsa >= 20) return { label: 'Severe', className: 'text-red-600' };
  if (tbsa >= 10) return { label: 'Moderate', className: 'text-orange-600' };
  if (tbsa > 0) return { label: 'Minor', className: 'text-emerald-600' };
  return { label: '—', className: 'text-muted-foreground' };
}

export function V2CalculatorsClient() {
  // --- TBSA (Rule of Nines) ---
  const [selected, setSelected] = useState<Record<string, number>>({});
  const tbsa = useMemo(
    () => Object.values(selected).reduce((s, v) => s + v, 0),
    [selected],
  );
  const sev = tbsaSeverity(tbsa);

  const toggleRegion = (key: string, full: number) =>
    setSelected((prev) => {
      const next = { ...prev };
      if (next[key] === full) delete next[key];
      else next[key] = full;
      return next;
    });
  const setHalf = (key: string, full: number) =>
    setSelected((prev) => ({ ...prev, [key]: full / 2 }));

  // --- Parkland ---
  const [weight, setWeight] = useState('');
  const [tbsaInput, setTbsaInput] = useState('');
  const [formula, setFormula] = useState<ResuscitationFormula>('parkland');
  const parkland = useMemo(() => {
    const w = parseFloat(weight);
    const t = parseFloat(tbsaInput);
    if (!Number.isFinite(w) || !Number.isFinite(t)) return null;
    return calculateResuscitation({ weightKg: w, tbsaPercent: t, formula });
  }, [weight, tbsaInput, formula]);

  const useTbsaInParkland = () => setTbsaInput(tbsa ? String(Number(tbsa.toFixed(1))) : '');

  return (
    <div className="mx-auto max-w-3xl">
      <Tabs defaultValue="tbsa">
        <TabsList>
          <TabsTrigger value="tbsa"><Ruler className="mr-1.5 h-4 w-4" /> TBSA</TabsTrigger>
          <TabsTrigger value="parkland"><Droplets className="mr-1.5 h-4 w-4" /> Parkland</TabsTrigger>
        </TabsList>

        {/* TBSA */}
        <TabsContent value="tbsa" className="mt-4 space-y-4">
          <div className="rounded-xl border bg-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-lg font-bold tracking-tight">Rule of Nines (adult)</h3>
                <p className="text-sm text-muted-foreground">Select burned regions. Tap a region to toggle a full area, or use ½ for partial involvement.</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelected({})}>
                <RotateCcw className="mr-1 h-3.5 w-3.5" /> Reset
              </Button>
            </div>

            <ul className="mt-4 space-y-2">
              {NINES_REGIONS.map((r) => {
                const val = selected[r.key];
                const active = val !== undefined;
                return (
                  <li key={r.key} className={cn('flex items-center justify-between rounded-lg border p-3 transition-colors', active && 'border-primary/40 bg-primary/5')}>
                    <button className="flex-1 text-left" onClick={() => toggleRegion(r.key, r.pct)}>
                      <span className="text-sm font-medium">{r.label}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{r.pct}%</span>
                    </button>
                    <div className="flex items-center gap-1.5">
                      {active ? <span className="font-mono text-sm font-semibold text-primary">{val}%</span> : null}
                      <Button size="sm" variant={val === r.pct / 2 ? 'secondary' : 'outline'} className="h-7 px-2 text-xs" onClick={() => setHalf(r.key, r.pct)}>½</Button>
                      <Button size="sm" variant={val === r.pct ? 'default' : 'outline'} className="h-7 px-2 text-xs" onClick={() => toggleRegion(r.key, r.pct)}>Full</Button>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="mt-5 flex items-center justify-between rounded-xl bg-muted p-4">
              <div>
                <p className="text-xs text-muted-foreground">Estimated TBSA</p>
                <p className="font-mono text-3xl font-bold tracking-tight">{tbsa.toFixed(1)}%</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Severity band</p>
                <p className={cn('font-display text-lg font-bold', sev.className)}>{sev.label}</p>
              </div>
            </div>

            <Button variant="outline" className="mt-3 w-full" onClick={useTbsaInParkland} disabled={!tbsa}>
              Use in Parkland calculator <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
            <p className="mt-3 flex items-start gap-1.5 text-xs text-muted-foreground">
              <Info className="mt-0.5 h-3 w-3 shrink-0" /> Rule of Nines is an adult approximation. For children and precise charting, use the Lund &amp; Browder tool in the original experience.
            </p>
          </div>
        </TabsContent>

        {/* Parkland */}
        <TabsContent value="parkland" className="mt-4 space-y-4">
          <div className="rounded-xl border bg-card p-5">
            <h3 className="font-display text-lg font-bold tracking-tight">Fluid resuscitation</h3>
            <p className="text-sm text-muted-foreground">Crystalloid over the first 24 hours (½ in first 8h, ½ in next 16h).</p>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="space-y-1.5">
                <span className="text-sm font-medium">Weight (kg)</span>
                <Input type="number" inputMode="decimal" min={0} value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="e.g. 70" />
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium">TBSA burned (%)</span>
                <Input type="number" inputMode="decimal" min={0} max={100} value={tbsaInput} onChange={(e) => setTbsaInput(e.target.value)} placeholder="e.g. 20" />
              </label>
            </div>

            <div className="mt-4 flex gap-2">
              <Button variant={formula === 'parkland' ? 'default' : 'outline'} size="sm" onClick={() => setFormula('parkland')}>Parkland (4 mL)</Button>
              <Button variant={formula === 'brooke' ? 'default' : 'outline'} size="sm" onClick={() => setFormula('brooke')}>Modified Brooke (2 mL)</Button>
            </div>

            {parkland ? (
              <div className="mt-5 space-y-3">
                <div className="rounded-xl bg-primary/5 p-4 text-center">
                  <p className="text-xs text-muted-foreground">Total in first 24 hours</p>
                  <p className="font-mono text-3xl font-bold tracking-tight text-primary">{Math.round(parkland.total24h).toLocaleString()} mL</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">First 8 hours</p>
                    <p className="font-mono text-lg font-bold">{Math.round(parkland.first8h).toLocaleString()} mL</p>
                    <p className="text-xs text-muted-foreground">≈ {Math.round(parkland.rate8h).toLocaleString()} mL/hr</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Next 16 hours</p>
                    <p className="font-mono text-lg font-bold">{Math.round(parkland.next16h).toLocaleString()} mL</p>
                    <p className="text-xs text-muted-foreground">≈ {Math.round(parkland.rate16h).toLocaleString()} mL/hr</p>
                  </div>
                </div>
                <div className="rounded-lg border p-3 text-sm">
                  <span className="text-muted-foreground">Target urine output: </span>
                  <span className="font-semibold">{parkland.urineTarget} mL/hr</span>
                  <span className="text-muted-foreground"> ({parkland.isChild ? 'child <30 kg: 1 mL/kg/hr' : '0.5 mL/kg/hr'})</span>
                </div>
              </div>
            ) : (
              <p className="mt-5 rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">Enter weight and TBSA to calculate.</p>
            )}
            <p className="mt-3 flex items-start gap-1.5 text-xs text-muted-foreground">
              <Info className="mt-0.5 h-3 w-3 shrink-0" /> Estimates guide initial resuscitation and must be titrated to clinical response (e.g. urine output). Decision-support only.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
