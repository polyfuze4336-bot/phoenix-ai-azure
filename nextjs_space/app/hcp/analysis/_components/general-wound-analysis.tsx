'use client';

import { Gauge, HelpCircle, Info, ShieldAlert } from 'lucide-react';
import { useLanguage } from '@/components/language-provider';
import { translateCanonicalValue } from '@/lib/i18n';
import type { GeneralWoundAnalysis } from '@/lib/ai/schemas/general-wound-analysis';

function ListSection({ title, items, tone = 'default' }: { title: string; items: string[]; tone?: 'default' | 'danger' | 'muted' }) {
  if (!items.length) return null;
  const styles = tone === 'danger'
    ? 'border-red-200 bg-red-50 text-red-800'
    : tone === 'muted'
      ? 'border-gray-200 bg-gray-50 text-gray-700'
      : 'border-gray-100 bg-white text-gray-700';
  return (
    <div className={`rounded-xl border p-4 ${styles}`}>
      <h3 className="mb-2 text-sm font-semibold">{title}</h3>
      <ul className="list-inside list-disc space-y-1 text-sm">
        {items.map((item, index) => <li key={index}>{item}</li>)}
      </ul>
    </div>
  );
}

export function GeneralWoundAnalysisView({ data }: { data: GeneralWoundAnalysis }) {
  const { t, lang } = useLanguage();
  const timers = [
    ['T', t('analysis.timers.tissue'), data.timers.tissueManagement],
    ['I', t('analysis.timers.infection'), data.timers.infectionInflammation],
    ['M', t('analysis.timers.moisture'), data.timers.moistureImbalance],
    ['E', t('analysis.timers.edge'), data.timers.edgeOfWound],
    ['R', t('analysis.timers.repair'), data.timers.repairRegeneration],
    ['S', t('analysis.timers.social'), data.timers.socialPatientFactors],
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <span className="flex items-center gap-2 text-sm font-medium text-gray-600"><Gauge className="h-4 w-4 text-[#8B0000]" /> {t('analysis.quality')}</span>
        <span className="rounded-full bg-[#0F9B8E] px-3 py-1 text-xs font-semibold text-white">{translateCanonicalValue(data.analysisQuality, lang)}</span>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center gap-2 rounded-t-xl bg-[#8B0000] px-4 py-2.5 text-sm font-semibold text-white">
          <HelpCircle className="h-4 w-4" /> {t('analysis.why')}
        </div>
        <ul className="list-inside list-disc space-y-1 p-4 text-sm text-gray-700">
          {data.whyThisAssessment.map((item, index) => <li key={index}>{item}</li>)}
        </ul>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-[#0F9B8E] to-[#0e8a7e] px-4 py-2.5 text-sm font-semibold text-white">TIMERS</div>
        <div className="divide-y">
          {timers.map(([letter, label, value]) => (
            <div key={letter} className="p-4">
              <p className="text-xs font-semibold text-[#0F9B8E]">{letter} — {label}</p>
              <p className="mt-1 text-sm text-gray-700">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">{t('analysis.management')}</h3>
        <div className="space-y-3 text-sm text-gray-700">
          <p><strong>{t('analysis.wound_protocol')}:</strong> {data.managementRecommendations.woundCareProtocol}</p>
          <p><strong>{t('analysis.dressing_recommendations')}:</strong> {data.managementRecommendations.dressingRecommendations}</p>
          <p><strong>{t('analysis.referral_criteria')}:</strong> {data.managementRecommendations.referralCriteria}</p>
          <p><strong>{t('analysis.follow_up')}:</strong> {data.managementRecommendations.followUpSchedule}</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold text-gray-500">{t('analysis.extent_dimensions')}</p>
        <p className="mt-1 text-sm text-gray-700">{data.visualExtent}</p>
        <p className="mt-1 text-xs text-gray-600">{data.measuredDimensions}</p>
      </div>

      <ListSection title={t('analysis.red_flags')} items={data.redFlags} tone="danger" />
      <ListSection title={t('analysis.missing_information')} items={data.missingInformation} />
      <ListSection title={t('analysis.limitations')} items={data.limitations} tone="muted" />
      <ListSection title={t('analysis.refinement_options')} items={data.refinementOptions} />

      {data.redFlags.length > 0 && (
        <div className="sr-only"><ShieldAlert /><Info /></div>
      )}
    </div>
  );
}
