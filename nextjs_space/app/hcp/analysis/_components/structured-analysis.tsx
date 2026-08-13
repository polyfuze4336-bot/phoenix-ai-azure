'use client';

import { useState } from 'react';
import { ChevronDown, ShieldAlert, HelpCircle, Info, ClipboardList, Gauge, Loader2 } from 'lucide-react';

/**
 * Enhanced, honest rendering of the staged pipeline's rich result. Additive to
 * the existing flat result cards — it surfaces observation-vs-interpretation
 * evidence ("Why this assessment?"), field-level confidence, missing
 * information, red flags, limitations, and a REFINE flow that answers the
 * pipeline's follow-up questions WITHOUT re-uploading the image.
 *
 * This component only renders when `data` (result.structured) is present, so
 * the legacy single-pass path and its UI are untouched.
 */

type Confidence = 'high' | 'moderate' | 'low' | 'insufficient';
interface Field {
  observation: string;
  interpretation: string;
  confidence: Confidence;
  basis: string[];
}
export interface StructuredAnalysisData {
  analysisQuality: 'HIGH' | 'MODERATE' | 'LOW' | 'INSUFFICIENT';
  imageQuality: { adequate: boolean; issues: string[]; note: string };
  observation: { observedSkinTone: string; anatomicalLocation: string; visibleFindings: string[]; scalePresent: boolean };
  interpretation: {
    woundCategory: Field;
    burnDepth: Field;
    burnMechanism: Field;
    tissueComposition: Field;
    exudate: Field;
    infectionSigns: Field;
    edgesAndPeriwound: Field;
    isBurn: boolean;
    reportedFitzpatrickType: string;
    skinToneInterpretationNote: string;
    measuredDimensions: string;
    visualExtent: string;
    tbsaAssumptions: string[];
    tbsaLimitations: string[];
    tbsaSeverityClass: string;
  };
  parkland: { indicated: string; requiresWeight: boolean; summary: string };
  confidenceByCategory: Record<string, Confidence>;
  missingInformation: string[];
  limitations: string[];
  redFlags: string[];
  recommendedFollowUpQuestions: string[];
  qualityChecks: { pass: boolean; issues: string[]; recommendedCorrections: string[] };
  overallConfidence: string;
}

const CONF_STYLE: Record<Confidence, string> = {
  high: 'bg-green-100 text-green-700',
  moderate: 'bg-yellow-100 text-yellow-700',
  low: 'bg-orange-100 text-orange-700',
  insufficient: 'bg-gray-200 text-gray-600',
};
const QUALITY_STYLE: Record<string, string> = {
  HIGH: 'bg-green-500 text-white',
  MODERATE: 'bg-yellow-500 text-white',
  LOW: 'bg-orange-500 text-white',
  INSUFFICIENT: 'bg-gray-500 text-white',
};

function ConfidenceBadge({ level }: { level: Confidence }) {
  return <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full uppercase ${CONF_STYLE[level] ?? CONF_STYLE.low}`}>{level}</span>;
}

function WhyField({ label, field }: { label: string; field: Field }) {
  const [open, setOpen] = useState(false);
  if (!field || (!field.interpretation && !field.observation)) return null;
  return (
    <div className="border-b last:border-b-0">
      <button onClick={() => setOpen((v) => !v)} className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors">
        <span className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-500">{label}</span>
          <ConfidenceBadge level={field.confidence} />
        </span>
        <span className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900 text-right max-w-[45%] truncate">{field.interpretation || field.observation}</span>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>
      {open && (
        <div className="px-4 pb-4 -mt-1 space-y-2 bg-gray-50/60">
          {field.observation && (
            <p className="text-xs text-gray-600"><span className="font-semibold text-gray-700">Observed:</span> {field.observation}</p>
          )}
          {field.interpretation && (
            <p className="text-xs text-gray-600"><span className="font-semibold text-gray-700">Interpretation:</span> {field.interpretation}</p>
          )}
          {field.basis?.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-gray-700">Basis:</span>
              <ul className="list-disc list-inside text-xs text-gray-600 mt-0.5">
                {field.basis.map((b, i) => <li key={i}>{b}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function StructuredAnalysis({
  data,
  onRefine,
  refining,
}: {
  data: StructuredAnalysisData;
  onRefine?: (answers: string) => void;
  refining?: boolean;
}) {
  const [answers, setAnswers] = useState('');
  const i = data.interpretation;

  return (
    <div className="space-y-4">
      {/* Analysis quality banner — honest gating */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-medium text-gray-600"><Gauge className="w-4 h-4 text-[#8B0000]" /> Analysis Quality</span>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${QUALITY_STYLE[data.analysisQuality] ?? QUALITY_STYLE.LOW}`}>{data.analysisQuality}</span>
      </div>

      {!data.imageQuality.adequate && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          <span className="font-semibold">Image quality limits reliability.</span> {data.imageQuality.note}
          {data.imageQuality.issues?.length > 0 && <span> ({data.imageQuality.issues.join(', ')})</span>}
        </div>
      )}

      {/* Why this assessment? — observation vs interpretation with confidence */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-2.5 bg-gradient-to-r from-[#8B0000] to-[#a01010] flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-white" />
          <span className="text-white font-semibold text-sm">Why this assessment? (tap a row)</span>
        </div>
        <div>
          <WhyField label="Wound Category" field={i.woundCategory} />
          {i.isBurn && <WhyField label="Burn Mechanism" field={i.burnMechanism} />}
          {i.isBurn && <WhyField label="Burn Depth" field={i.burnDepth} />}
          <WhyField label="Tissue Composition" field={i.tissueComposition} />
          <WhyField label="Exudate" field={i.exudate} />
          <WhyField label="Infection Signs" field={i.infectionSigns} />
          <WhyField label="Edges & Periwound" field={i.edgesAndPeriwound} />
        </div>
      </div>

      {/* Skin tone (Fitzpatrick handled honestly) */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-1">
        <span className="text-xs font-semibold text-[#E67E22]">Skin Tone &amp; Fitzpatrick</span>
        <p className="text-sm text-gray-700">Observed skin tone: <span className="font-medium">{data.observation.observedSkinTone || 'unclear'}</span></p>
        <p className="text-xs text-gray-600">Reported Fitzpatrick type: <span className="font-medium">{i.reportedFitzpatrickType}</span>{i.reportedFitzpatrickType?.toLowerCase() === 'unknown' && ' — not reliably determinable from a photograph.'}</p>
        {i.skinToneInterpretationNote && <p className="text-xs text-gray-600">{i.skinToneInterpretationNote}</p>}
      </div>

      {/* Size / dimensions honesty */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-1">
        <span className="text-xs font-semibold text-gray-500">Extent &amp; Dimensions</span>
        <p className="text-sm text-gray-700">Visual extent: {i.visualExtent || 'N/A'}</p>
        <p className="text-sm text-gray-700">TBSA category: {i.tbsaSeverityClass || 'N/A'}</p>
        <p className="text-xs text-gray-600">Measured dimensions: <span className="font-medium">{i.measuredDimensions}</span>{i.measuredDimensions === 'unavailable' && ' (no size reference visible)'}</p>
      </div>

      {/* Red flags */}
      {data.redFlags?.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 bg-red-600 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-white" /><span className="text-white font-semibold text-sm">Red Flags — escalate if present</span>
          </div>
          <ul className="p-4 space-y-1 list-disc list-inside text-sm text-red-800">
            {data.redFlags.map((r, idx) => <li key={idx}>{r}</li>)}
          </ul>
        </div>
      )}

      {/* Missing information */}
      {data.missingInformation?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-2.5 bg-gradient-to-r from-[#0F9B8E] to-[#0e8a7e] flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-white" /><span className="text-white font-semibold text-sm">Missing Information</span>
          </div>
          <ul className="p-4 space-y-1 list-disc list-inside text-sm text-gray-700">
            {data.missingInformation.map((m, idx) => <li key={idx}>{m}</li>)}
          </ul>
        </div>
      )}

      {/* Limitations */}
      {data.limitations?.length > 0 && (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
          <span className="flex items-center gap-2 text-xs font-semibold text-gray-600 mb-2"><Info className="w-3.5 h-3.5" /> Limitations</span>
          <ul className="space-y-1 list-disc list-inside text-xs text-gray-600">
            {data.limitations.map((l, idx) => <li key={idx}>{l}</li>)}
          </ul>
        </div>
      )}

      {/* Refine analysis */}
      {onRefine && data.recommendedFollowUpQuestions?.length > 0 && (
        <div className="bg-white rounded-xl border border-[#8B0000]/20 shadow-sm p-4 space-y-3">
          <span className="text-sm font-semibold text-[#8B0000]">Refine this analysis</span>
          <p className="text-xs text-gray-600">Answer any of these to improve accuracy — no need to re-upload the image:</p>
          <ul className="space-y-1 list-disc list-inside text-xs text-gray-700">
            {data.recommendedFollowUpQuestions.map((q, idx) => <li key={idx}>{q}</li>)}
          </ul>
          <textarea
            value={answers}
            onChange={(e) => setAnswers(e.target.value)}
            placeholder="e.g. Weight 68 kg; scald from hot water ~30 min ago; sensation intact."
            className="w-full text-sm border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#8B0000]/30"
            rows={3}
          />
          <button
            onClick={() => answers.trim() && onRefine(answers.trim())}
            disabled={refining || !answers.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#8B0000] text-white rounded-xl font-medium hover:bg-[#7a0000] transition-colors disabled:opacity-50"
          >
            {refining ? <><Loader2 className="w-4 h-4 animate-spin" /> Refining…</> : 'Refine Analysis'}
          </button>
        </div>
      )}
    </div>
  );
}
