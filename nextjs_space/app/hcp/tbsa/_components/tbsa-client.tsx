'use client';

import { useLanguage } from '@/components/language-provider';
import { Calculator, RotateCcw, ArrowRight, Info, Eraser, Paintbrush } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';

type AgeGroup = '0' | '1' | '5' | '10' | '15' | 'adult';
type Depth = 'ptl' | 'ftl';
type Tool = 'paint' | 'erase';
type ViewKind = 'ant' | 'post';

const AGE_LABELS: Record<AgeGroup, string> = {
  '0': 'Age 0', '1': '1 yr', '5': '5 yrs', '10': '10 yrs', '15': '15 yrs', 'adult': 'Adult',
};

// Lund & Browder age-variable areas
const VARIABLE_AREAS = {
  head: { label: 'A = ½ OF HEAD', '0': 9.5, '1': 8.5, '5': 6.5, '10': 5.5, '15': 4.5, 'adult': 3.5 },
  thigh: { label: 'B = ½ OF ONE THIGH', '0': 2.75, '1': 3.25, '5': 4, '10': 4.25, '15': 4.5, 'adult': 4.75 },
  lowerLeg: { label: 'C = ½ OF ONE LOWER LEG', '0': 2.5, '1': 2.5, '5': 2.75, '10': 3, '15': 3.25, 'adult': 3.5 },
};

const REGION_KEYS = [
  'head', 'neck', 'antTrunk', 'postTrunk',
  'rightArm', 'leftArm', 'buttocks', 'genitalia',
  'rightLeg', 'leftLeg',
] as const;
type RegionKey = typeof REGION_KEYS[number];

const REGION_LABELS: Record<RegionKey, string> = {
  head: 'Head', neck: 'Neck', antTrunk: 'Ant. trunk', postTrunk: 'Post. trunk',
  rightArm: 'Right arm', leftArm: 'Left arm', buttocks: 'Buttocks', genitalia: 'Genitalia',
  rightLeg: 'Right leg', leftLeg: 'Left leg',
};

const FIXED_MAXES: Record<RegionKey, number> = {
  head: 0, neck: 2, antTrunk: 13, postTrunk: 13, rightArm: 9, leftArm: 9,
  buttocks: 5, genitalia: 1, rightLeg: 0, leftLeg: 0,
};

function getMaxForRegion(region: RegionKey, age: AgeGroup): number {
  if (region === 'head') return VARIABLE_AREAS.head[age] * 2;
  if (region === 'rightLeg' || region === 'leftLeg') {
    return (VARIABLE_AREAS.thigh[age] * 2) + (VARIABLE_AREAS.lowerLeg[age] * 2) + 3.5;
  }
  return FIXED_MAXES[region];
}

function formatFraction(n: number): string {
  if (n === Math.floor(n)) return String(n);
  const whole = Math.floor(n);
  const frac = n - whole;
  if (Math.abs(frac - 0.25) < 0.01) return whole ? `${whole}¼` : '¼';
  if (Math.abs(frac - 0.5) < 0.01) return whole ? `${whole}½` : '½';
  if (Math.abs(frac - 0.75) < 0.01) return whole ? `${whole}¾` : '¾';
  return String(n);
}

function getSeverity(tbsa: number): { label: string; color: string } {
  if (tbsa < 10) return { label: 'Minor (<10%)', color: 'bg-green-500' };
  if (tbsa <= 20) return { label: 'Moderate (10-20%)', color: 'bg-yellow-500' };
  if (tbsa <= 40) return { label: 'Major (20-40%)', color: 'bg-orange-500' };
  return { label: 'Critical (>40%)', color: 'bg-red-600' };
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/* ===================== BODY SHAPE DATA ===================== */

type Shape =
  | { region: RegionKey; kind: 'path'; d: string }
  | { region: RegionKey; kind: 'ellipse'; cx: number; cy: number; rx: number; ry: number }
  | { region: RegionKey; kind: 'rect'; x: number; y: number; w: number; h: number };

/* ---- Region shapes (invisible mask for TBSA computation) ----
   Coordinates mapped to the 200×462 cropped image halves.
   These are NOT drawn visually — only used for pixel-counting regions. */

const HEAD_D = 'M100,12 C115,12 128,24 128,44 C128,56 122,66 117,70 L117,76 C117,80 112,82 100,82 C88,82 83,80 83,76 L83,70 C78,66 72,56 72,44 C72,24 85,12 100,12Z';
const TRUNK_D = 'M56,92 C62,88 75,86 90,86 L110,86 C125,86 138,88 144,92 L144,98 L138,102 L136,104 L136,220 C136,226 126,232 120,234 L110,238 L100,240 L90,238 L80,234 C74,232 64,226 64,220 L64,104 L62,102 L56,98 Z';
const RARM_D = 'M56,92 L44,96 C36,100 28,110 24,118 L14,146 C10,156 6,166 4,174 L2,190 C0,198 0,204 2,206 L6,204 L12,190 L20,172 L28,156 L34,144 C36,138 40,132 46,126 L52,118 L56,98 Z';
const RHAND_D = 'M2,206 L0,218 C-2,226 -4,232 -4,236 C-4,242 0,244 4,240 L6,236 L8,238 C10,244 8,248 6,252 C4,256 8,258 12,254 L14,248 L16,252 C18,258 16,260 14,264 C12,268 16,270 20,266 L22,260 L22,264 C22,268 24,270 26,266 L28,258 L28,246 L24,232 L14,214 L6,204 Z';
const LARM_D = 'M144,92 L156,96 C164,100 172,110 176,118 L186,146 C190,156 194,166 196,174 L198,190 C200,198 200,204 198,206 L194,204 L188,190 L180,172 L172,156 L166,144 C164,138 160,132 154,126 L148,118 L144,98 Z';
const LHAND_D = 'M198,206 L200,218 C202,226 204,232 204,236 C204,242 200,244 196,240 L194,236 L192,238 C190,244 192,248 194,252 C196,256 192,258 188,254 L186,248 L184,252 C182,258 184,260 186,264 C188,268 184,270 180,266 L178,260 L178,264 C178,268 176,270 174,266 L172,258 L172,246 L176,232 L186,214 L194,204 Z';

const ANT_SHAPES: Shape[] = [
  { region: 'head', kind: 'path', d: HEAD_D },
  { region: 'neck', kind: 'rect', x: 88, y: 82, w: 24, h: 10 },
  { region: 'antTrunk', kind: 'path', d: TRUNK_D },
  { region: 'genitalia', kind: 'ellipse', cx: 100, cy: 244, rx: 10, ry: 6 },
  { region: 'rightArm', kind: 'path', d: RARM_D },
  { region: 'rightArm', kind: 'path', d: RHAND_D },
  { region: 'leftArm', kind: 'path', d: LARM_D },
  { region: 'leftArm', kind: 'path', d: LHAND_D },
  { region: 'rightLeg', kind: 'path', d: 'M76,240 L72,258 L68,280 L66,306 L64,330 C62,346 62,360 62,370 L60,392 L58,410 C58,416 58,422 62,424 L72,426 C78,426 82,424 82,420 L84,400 L84,370 L86,340 C86,320 86,306 84,290 L82,268 L84,252 L92,240 Z' },
  { region: 'rightLeg', kind: 'path', d: 'M58,424 L54,436 C52,442 50,448 50,452 C50,458 56,462 66,462 C76,462 82,458 82,452 L82,420 L72,426 L62,424 Z' },
  { region: 'leftLeg', kind: 'path', d: 'M124,240 L128,258 L132,280 L134,306 L136,330 C138,346 138,360 138,370 L140,392 L142,410 C142,416 142,422 138,424 L128,426 C122,426 118,424 118,420 L116,400 L116,370 L114,340 C114,320 114,306 116,290 L118,268 L116,252 L108,240 Z' },
  { region: 'leftLeg', kind: 'path', d: 'M142,424 L146,436 C148,442 150,448 150,452 C150,458 144,462 134,462 C124,462 118,458 118,452 L118,420 L128,426 L138,424 Z' },
];

const POST_SHAPES: Shape[] = [
  { region: 'head', kind: 'path', d: HEAD_D },
  { region: 'neck', kind: 'rect', x: 88, y: 82, w: 24, h: 10 },
  { region: 'postTrunk', kind: 'path', d: TRUNK_D },
  { region: 'buttocks', kind: 'path', d: 'M76,226 C76,236 84,246 100,246 C116,246 124,236 124,226 L124,240 C124,250 116,258 100,258 C84,258 76,250 76,240 Z' },
  { region: 'rightArm', kind: 'path', d: RARM_D },
  { region: 'rightArm', kind: 'path', d: RHAND_D },
  { region: 'leftArm', kind: 'path', d: LARM_D },
  { region: 'leftArm', kind: 'path', d: LHAND_D },
  { region: 'rightLeg', kind: 'path', d: 'M76,250 L72,268 L68,290 L66,316 L64,340 C62,356 62,370 62,380 L60,402 L58,420 C58,426 58,432 62,434 L72,436 C78,436 82,434 82,430 L84,410 L84,380 L86,350 C86,330 86,316 84,300 L82,278 L84,262 L92,250 Z' },
  { region: 'rightLeg', kind: 'path', d: 'M58,434 L54,446 C52,452 50,456 50,460 C50,462 56,462 66,462 C76,462 82,460 82,456 L82,430 L72,436 L62,434 Z' },
  { region: 'leftLeg', kind: 'path', d: 'M124,250 L128,268 L132,290 L134,316 L136,340 C138,356 138,370 138,380 L140,402 L142,420 C142,426 142,432 138,434 L128,436 C122,436 118,434 118,430 L116,410 L116,380 L114,350 C114,330 114,316 116,300 L118,278 L116,262 L108,250 Z' },
  { region: 'leftLeg', kind: 'path', d: 'M142,434 L146,446 C148,452 150,456 150,460 C150,462 144,462 134,462 C124,462 118,460 118,456 L118,430 L128,436 L138,434 Z' },
];

const REGION_ID_COLOR: Record<RegionKey, [number, number, number]> = {
  head: [255, 0, 0], neck: [0, 220, 0], antTrunk: [0, 0, 255], postTrunk: [255, 220, 0],
  rightArm: [255, 0, 220], leftArm: [0, 220, 255], buttocks: [150, 40, 40], genitalia: [40, 150, 40],
  rightLeg: [40, 40, 160], leftLeg: [150, 150, 0],
};
const COLOR2REGION: Record<string, RegionKey> = {};
(Object.keys(REGION_ID_COLOR) as RegionKey[]).forEach(r => {
  const c = REGION_ID_COLOR[r];
  COLOR2REGION[`${c[0]},${c[1]},${c[2]}`] = r;
});

/* Virtual canvas matches the cropped figure halves (318×615 px) */
const RES = 1;
const VW = 318;
const VH = 615;

function buildPath(s: Shape): Path2D {
  const p = new Path2D();
  if (s.kind === 'path') return new Path2D(s.d);
  if (s.kind === 'ellipse') { p.ellipse(s.cx, s.cy, s.rx, s.ry, 0, 0, Math.PI * 2); return p; }
  p.rect(s.x, s.y, s.w, s.h);
  return p;
}

type Counts = { total: Record<string, number>; ptl: Record<string, number>; ftl: Record<string, number> };

/* ===================== BODY PAINTER ===================== */

function BodyPainter({
  view, tool, depth, brushSize, resetSignal, onCounts,
}: {
  view: ViewKind;
  tool: Tool;
  depth: Depth;
  brushSize: number;
  resetSignal: number;
  onCounts: (view: ViewKind, counts: Counts) => void;
}) {
  const overlayRef = useRef<HTMLCanvasElement | null>(null);
  const ptlBufRef = useRef<HTMLCanvasElement | null>(null);
  const ftlBufRef = useRef<HTMLCanvasElement | null>(null);
  const maskRef = useRef<HTMLCanvasElement | null>(null);

  const toolRef = useRef(tool);
  const depthRef = useRef(depth);
  const brushRef = useRef(brushSize);
  useEffect(() => { toolRef.current = tool; }, [tool]);
  useEffect(() => { depthRef.current = depth; }, [depth]);
  useEffect(() => { brushRef.current = brushSize; }, [brushSize]);

  const drawingRef = useRef(false);
  const lastRef = useRef<{ x: number; y: number } | null>(null);
  const silImgRef = useRef<HTMLImageElement | null>(null);

  const imgSrc = view === 'ant' ? '/tbsa-anterior.png' : '/tbsa-posterior.png';
  const maskSrc = view === 'ant' ? '/tbsa-anterior-mask.png' : '/tbsa-posterior-mask.png';

  const setup = (c: HTMLCanvasElement | null) => {
    if (!c) return null;
    c.width = VW * RES; c.height = VH * RES;
    const ctx = c.getContext('2d', { willReadFrequently: true })!;
    ctx.setTransform(RES, 0, 0, RES, 0, 0);
    return ctx;
  };

  // Init: load the region-mask image (hidden) used for TBSA pixel counting,
  // and the figure image used to constrain paint to the body silhouette.
  useEffect(() => {
    const mctx = setup(maskRef.current);
    setup(ptlBufRef.current);
    setup(ftlBufRef.current);
    setup(overlayRef.current);
    if (!mctx) return;

    const maskImg = new Image();
    maskImg.onload = () => {
      mctx.imageSmoothingEnabled = false;
      mctx.clearRect(0, 0, VW, VH);
      mctx.drawImage(maskImg, 0, 0, VW, VH);
    };
    maskImg.src = maskSrc;

    const silImg = new Image();
    silImg.onload = () => { silImgRef.current = silImg; };
    silImg.src = imgSrc;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep painted overlay confined to the body silhouette of the figure image.
  const trimOverlay = () => {
    const c = overlayRef.current; const sil = silImgRef.current;
    if (!c || !sil) return;
    const ctx = c.getContext('2d')!;
    ctx.save();
    ctx.globalCompositeOperation = 'destination-in';
    ctx.drawImage(sil, 0, 0, VW, VH);
    ctx.restore();
  };

  const clearPaint = useCallback(() => {
    [ptlBufRef.current, ftlBufRef.current, overlayRef.current].forEach(c => {
      if (!c) return;
      const ctx = c.getContext('2d')!;
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, c.width, c.height); ctx.restore();
    });
  }, []);

  useEffect(() => {
    if (resetSignal === 0) return;
    clearPaint();
    onCounts(view, { total: {}, ptl: {}, ftl: {} });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetSignal]);

  const dab = (x: number, y: number) => {
    const r = brushRef.current;
    const octx = overlayRef.current!.getContext('2d')!;
    const pctx = ptlBufRef.current!.getContext('2d')!;
    const fctx = ftlBufRef.current!.getContext('2d')!;
    if (toolRef.current === 'erase') {
      [octx, pctx, fctx].forEach(ctx => {
        ctx.save(); ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      });
      return;
    }
    const isF = depthRef.current === 'ftl';
    octx.save(); octx.globalCompositeOperation = 'source-over';
    octx.fillStyle = isF ? 'rgba(139,0,0,0.45)' : 'rgba(230,126,34,0.45)';
    octx.beginPath(); octx.arc(x, y, r, 0, Math.PI * 2); octx.fill(); octx.restore();
    const act = isF ? fctx : pctx;
    act.save(); act.globalCompositeOperation = 'source-over';
    act.fillStyle = isF ? '#8B0000' : '#E67E22';
    act.beginPath(); act.arc(x, y, r, 0, Math.PI * 2); act.fill(); act.restore();
    const other = isF ? pctx : fctx;
    other.save(); other.globalCompositeOperation = 'destination-out';
    other.beginPath(); other.arc(x, y, r, 0, Math.PI * 2); other.fill(); other.restore();
  };

  const toCoord = (e: React.PointerEvent) => {
    const c = overlayRef.current!;
    const rect = c.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / rect.width * VW,
      y: (e.clientY - rect.top) / rect.height * VH,
    };
  };

  const compute = () => {
    const w = VW * RES, h = VH * RES;
    const m = maskRef.current!.getContext('2d')!.getImageData(0, 0, w, h).data;
    const p = ptlBufRef.current!.getContext('2d')!.getImageData(0, 0, w, h).data;
    const f = ftlBufRef.current!.getContext('2d')!.getImageData(0, 0, w, h).data;
    const total: Record<string, number> = {}; const ptl: Record<string, number> = {}; const ftl: Record<string, number> = {};
    for (let i = 0; i < m.length; i += 4) {
      if (m[i + 3] < 60) continue;
      const region = COLOR2REGION[`${m[i]},${m[i + 1]},${m[i + 2]}`];
      if (!region) continue;
      total[region] = (total[region] || 0) + 1;
      if (f[i + 3] > 60) ftl[region] = (ftl[region] || 0) + 1;
      else if (p[i + 3] > 60) ptl[region] = (ptl[region] || 0) + 1;
    }
    onCounts(view, { total, ptl, ftl });
  };

  const onDown = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drawingRef.current = true;
    const pt = toCoord(e);
    lastRef.current = pt;
    dab(pt.x, pt.y);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drawingRef.current) return;
    e.preventDefault();
    const pt = toCoord(e);
    const last = lastRef.current || pt;
    const dist = Math.hypot(pt.x - last.x, pt.y - last.y);
    const steps = Math.max(1, Math.floor(dist / (brushRef.current / 2)));
    for (let s = 1; s <= steps; s++) {
      dab(last.x + (pt.x - last.x) * (s / steps), last.y + (pt.y - last.y) * (s / steps));
    }
    lastRef.current = pt;
    trimOverlay();
  };
  const onUp = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    lastRef.current = null;
    trimOverlay();
    compute();
  };

  return (
    <div className="relative w-full" style={{ aspectRatio: `${VW} / ${VH}` }}>
      {/* 3D anatomical figure image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imgSrc} alt={view === 'ant' ? 'Anterior' : 'Posterior'} className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none" draggable={false} />
      {/* Hidden computation canvases */}
      <canvas ref={maskRef} className="hidden" />
      <canvas ref={ptlBufRef} className="hidden" />
      <canvas ref={ftlBufRef} className="hidden" />
      {/* Paint overlay */}
      <canvas
        ref={overlayRef}
        className="absolute inset-0 w-full h-full cursor-crosshair"
        style={{ touchAction: 'none' }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={onUp}
      />
    </div>
  );
}

/* ===================== MAIN COMPONENT ===================== */

export function TbsaClient() {
  const { t } = useLanguage();
  const [age, setAge] = useState<AgeGroup>('adult');
  const [depth, setDepth] = useState<Depth>('ptl');
  const [tool, setTool] = useState<Tool>('paint');
  const [brushSize, setBrushSize] = useState(11);
  const [resetSignal, setResetSignal] = useState(0);

  const [antCounts, setAntCounts] = useState<Counts>({ total: {}, ptl: {}, ftl: {} });
  const [postCounts, setPostCounts] = useState<Counts>({ total: {}, ptl: {}, ftl: {} });

  const onCounts = useCallback((view: ViewKind, counts: Counts) => {
    if (view === 'ant') setAntCounts(counts); else setPostCounts(counts);
  }, []);

  const breakdown = useMemo(() => {
    const rows = REGION_KEYS.map(region => {
      const tot = (antCounts.total[region] || 0) + (postCounts.total[region] || 0);
      const p = (antCounts.ptl[region] || 0) + (postCounts.ptl[region] || 0);
      const f = (antCounts.ftl[region] || 0) + (postCounts.ftl[region] || 0);
      const max = getMaxForRegion(region, age);
      const ptlPct = tot > 0 ? round1((p / tot) * max) : 0;
      const ftlPct = tot > 0 ? round1((f / tot) * max) : 0;
      return { region, ptlPct, ftlPct };
    });
    const ptlTotal = round1(rows.reduce((a, r) => a + r.ptlPct, 0));
    const ftlTotal = round1(rows.reduce((a, r) => a + r.ftlPct, 0));
    return { rows, ptlTotal, ftlTotal, total: round1(ptlTotal + ftlTotal) };
  }, [antCounts, postCounts, age]);

  const severity = getSeverity(breakdown.total);

  const reset = useCallback(() => setResetSignal(s => s + 1), []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">{t('tbsa.title')}</h1>
        <p className="text-sm text-gray-500 mt-1">Lund &amp; Browder Chart — Shade the burned areas directly on the figure. Be clear and accurate, do not include erythema.</p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-600">Age:</label>
          <select
            value={age}
            onChange={(e: any) => setAge(e.target.value as AgeGroup)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#8B0000]/20 focus:border-[#8B0000] outline-none"
          >
            <option value="0">Age 0 (Neonate)</option>
            <option value="1">1 year</option>
            <option value="5">5 years</option>
            <option value="10">10 years</option>
            <option value="15">15 years</option>
            <option value="adult">Adult</option>
          </select>
        </div>

        {/* Depth toggle */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600">Depth:</span>
          <div className="flex rounded-lg overflow-hidden border border-gray-200">
            <button
              onClick={() => { setDepth('ptl'); setTool('paint'); }}
              className={`px-3 py-2 text-xs font-semibold transition-colors ${depth === 'ptl' && tool === 'paint' ? 'bg-[#E67E22] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              Partial (PTL)
            </button>
            <button
              onClick={() => { setDepth('ftl'); setTool('paint'); }}
              className={`px-3 py-2 text-xs font-semibold transition-colors border-l border-gray-200 ${depth === 'ftl' && tool === 'paint' ? 'bg-[#8B0000] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              Full (FTL)
            </button>
          </div>
        </div>

        {/* Tool toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTool('paint')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${tool === 'paint' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
          >
            <Paintbrush className="w-3.5 h-3.5" /> Shade
          </button>
          <button
            onClick={() => setTool('erase')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${tool === 'erase' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
          >
            <Eraser className="w-3.5 h-3.5" /> Erase
          </button>
        </div>

        {/* Brush size */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600">Brush:</span>
          <input type="range" min={4} max={28} value={brushSize} onChange={(e: any) => setBrushSize(Number(e.target.value))} className="accent-[#8B0000]" />
        </div>

        <button onClick={reset} className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-[#8B0000] transition-colors ml-auto">
          <RotateCcw className="w-4 h-4" /> Reset
        </button>
      </div>

      {/* Main Layout */}
      <div className="grid lg:grid-cols-[1fr_auto] gap-4 items-start">
        {/* Body Diagrams */}
        <div className="bg-gradient-to-b from-gray-50 to-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <BodyPainter view="ant" tool={tool} depth={depth} brushSize={brushSize} resetSignal={resetSignal} onCounts={onCounts} />
            </div>
            <div>
              <BodyPainter view="post" tool={tool} depth={depth} brushSize={brushSize} resetSignal={resetSignal} onCounts={onCounts} />
            </div>
          </div>
          <div className="flex items-center justify-center gap-4 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ background: '#E67E22' }} /> Partial thickness</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ background: '#8B0000' }} /> Full thickness</span>
          </div>
          <p className="text-xs text-center text-gray-400 mt-1">Drag your finger or pointer over the burned areas to shade them.</p>
        </div>

        {/* Results + breakdown */}
        <div className="space-y-4 min-w-[300px]">
          <motion.div key={breakdown.total} initial={{ scale: 0.97 }} animate={{ scale: 1 }} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm text-center">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Total TBSA</h3>
            <p className="font-mono text-5xl font-bold text-[#8B0000]">{breakdown.total}%</p>
            <div className="mt-2 flex items-center justify-center gap-2">
              <span className="text-xs text-gray-500">PTL: {breakdown.ptlTotal}%</span>
              <span className="text-gray-300">|</span>
              <span className="text-xs text-gray-500">FTL: {breakdown.ftlTotal}%</span>
            </div>
            <div className={`inline-block mt-3 px-4 py-1.5 rounded-full text-white text-xs font-semibold ${severity.color}`}>
              {severity.label}
            </div>
          </motion.div>

          {/* Per-region breakdown */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-[#8B0000] to-[#a01010] px-4 py-2.5 text-center">
              <h3 className="text-white font-semibold text-xs">Region Breakdown (%)</h3>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-3 py-2 font-semibold text-gray-700">Region</th>
                  <th className="px-2 py-2 font-semibold text-gray-700 text-center w-16">PTL</th>
                  <th className="px-2 py-2 font-semibold text-gray-700 text-center w-16">FTL</th>
                </tr>
              </thead>
              <tbody>
                {breakdown.rows.map((r, i) => {
                  const active = r.ptlPct > 0 || r.ftlPct > 0;
                  return (
                    <tr key={r.region} className={`border-b border-gray-100 ${active ? 'bg-orange-50' : i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                      <td className="px-3 py-1.5 text-gray-700 font-medium">{REGION_LABELS[r.region]}</td>
                      <td className="px-2 py-1.5 text-center font-mono text-gray-600">{r.ptlPct || '-'}</td>
                      <td className="px-2 py-1.5 text-center font-mono text-gray-600">{r.ftlPct || '-'}</td>
                    </tr>
                  );
                })}
                <tr className="bg-[#8B0000]/5 border-t-2 border-[#8B0000]/20">
                  <td className="px-3 py-2 font-bold text-[#8B0000]">Total burn</td>
                  <td className="px-2 py-2 text-center font-bold text-[#8B0000]">{breakdown.ptlTotal || '-'}</td>
                  <td className="px-2 py-2 text-center font-bold text-[#8B0000]">{breakdown.ftlTotal || '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Severity legend */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <h4 className="text-xs font-semibold text-gray-500 mb-3">Severity Classification</h4>
            <div className="space-y-1.5">
              {[
                { range: '<10%', label: 'Minor', color: 'bg-green-500' },
                { range: '10-20%', label: 'Moderate', color: 'bg-yellow-500' },
                { range: '20-40%', label: 'Major', color: 'bg-orange-500' },
                { range: '>40%', label: 'Critical', color: 'bg-red-600' },
              ].map(item => (
                <div key={item.range} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                    <span className="text-gray-600">{item.label}</span>
                  </div>
                  <span className="font-mono text-gray-400">{item.range}</span>
                </div>
              ))}
            </div>
          </div>

          {breakdown.total > 0 && (
            <Link
              href={`/hcp/parkland?tbsa=${breakdown.total}`}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-[#8B0000] text-white rounded-xl font-medium hover:bg-[#7a0000] transition-colors text-sm"
            >
              <Calculator className="w-4 h-4" /> Calculate Parkland Formula <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>

      {/* Lund & Browder Age Reference Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-[#0F9B8E] to-[#0e8a7e] px-4 py-3 flex items-center gap-2">
          <Info className="w-4 h-4 text-white" />
          <h3 className="text-white font-semibold text-sm">Lund &amp; Browder — Relative Percentage of Body Surface Area Affected by Growth</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-2.5 font-bold text-gray-800 min-w-[180px]">AREA</th>
                {(['0', '1', '5', '10', '15', 'adult'] as AgeGroup[]).map(a => (
                  <th key={a} className={`px-3 py-2.5 font-bold text-center min-w-[60px] ${a === age ? 'bg-[#8B0000]/10 text-[#8B0000]' : 'text-gray-700'}`}>
                    {AGE_LABELS[a]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(VARIABLE_AREAS).map(([key, data], i) => (
                <tr key={key} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                  <td className="px-4 py-2 font-medium text-gray-800 text-xs">{data.label}</td>
                  {(['0', '1', '5', '10', '15', 'adult'] as AgeGroup[]).map(a => (
                    <td key={a} className={`px-3 py-2 text-center font-mono text-xs ${a === age ? 'bg-[#8B0000]/10 font-bold text-[#8B0000]' : 'text-gray-600'}`}>
                      {formatFraction((data as any)[a])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            <strong>A</strong> = ½ of head &nbsp;|&nbsp; <strong>B</strong> = ½ of one thigh &nbsp;|&nbsp; <strong>C</strong> = ½ of one lower leg &nbsp;|&nbsp;
            <strong>PTL</strong> = Partial Thickness Loss &nbsp;|&nbsp; <strong>FTL</strong> = Full Thickness Loss
          </p>
        </div>
      </div>
    </div>
  );
}
