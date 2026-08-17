'use client';

import { useLanguage } from '@/components/language-provider';
import { motion } from 'framer-motion';
import { Clock, ImageOff, Loader2, RefreshCw, Flame, Stethoscope, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { translateCanonicalValue, type AppLanguage } from '@/lib/i18n';

interface RecordSummary {
  id: string;
  createdAt: string;
  clinicianName: string | null;
  woundCategory: string | null;
  woundType: string | null;
  burnDegree: string | null;
  severity: string | null;
  confidence: string | null;
  tbsaEstimate: string | null;
  isBurn: boolean;
  hasImage: boolean;
}

interface RecordDetail extends RecordSummary {
  clinicianEmail: string | null;
  result: Record<string, any>;
  imageUrl: string | null;
  imageMimeType: string | null;
}

function severityColor(severity: string) {
  const s = severity.toLowerCase();
  if (s.includes('severe') || s.includes('critical') || s.includes('high')) return 'bg-red-500 text-white';
  if (s.includes('moderate') || s.includes('medium')) return 'bg-amber-500 text-white';
  if (s.includes('mild') || s.includes('low') || s.includes('minor')) return 'bg-green-500 text-white';
  return 'bg-gray-400 text-white';
}

function formatDate(iso: string, lang: AppLanguage) {
  try {
    return new Date(iso).toLocaleString(lang === 'ms' ? 'ms-MY' : 'en-MY');
  } catch {
    return iso;
  }
}

export function HistoryClient() {
  const { t, lang } = useLanguage();
  const [records, setRecords] = useState<RecordSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<RecordDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailTranslating, setDetailTranslating] = useState(false);
  const [translationError, setTranslationError] = useState(false);
  const translatedResultsRef = useRef<Record<string, Partial<Record<AppLanguage, Record<string, any>>>>>({});

  const loadList = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/hcp/analyses');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(t('history.load_error'));
      setRecords(Array.isArray(data?.records) ? data.records : []);
    } catch (e: any) {
      setError(e?.message ?? t('history.load_error'));
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  useEffect(() => {
    if (!detail?.result || detail.result.language === lang) return;
    const cached = translatedResultsRef.current[detail.id]?.[lang];
    if (cached) {
      setDetail((current) => current ? { ...current, result: cached } : current);
      setTranslationError(false);
      return;
    }

    const controller = new AbortController();
    setDetailTranslating(true);
    setTranslationError(false);
    void fetch('/api/analyze-wound/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ result: detail.result, language: lang }),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('TRANSLATION_FAILED');
        const body = await response.json();
        if (!body?.result) throw new Error('TRANSLATION_FAILED');
        translatedResultsRef.current[detail.id] = {
          ...translatedResultsRef.current[detail.id],
          [lang]: body.result,
        };
        setDetail((current) => current?.id === detail.id ? { ...current, result: body.result } : current);
      })
      .catch((error) => {
        if (error?.name !== 'AbortError') setTranslationError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setDetailTranslating(false);
      });
    return () => controller.abort();
  }, [detail, lang]);

  const selectRecord = useCallback(async (id: string) => {
    setSelectedId(id);
    setDetail(null);
    setDetailLoading(true);
    setTranslationError(false);
    try {
      const res = await fetch(`/api/hcp/analyses/${id}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(t('history.detail_error'));
      const record = data?.record ?? null;
      if (record?.result?.language === 'en' || record?.result?.language === 'ms') {
        translatedResultsRef.current[record.id] = {
          ...translatedResultsRef.current[record.id],
          [record.result.language]: record.result,
        };
      }
      setDetail(record);
    } catch {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }, [t]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
            {t('hcp.history')}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {t('history.subtitle')}
          </p>
        </div>
        <button
          onClick={loadList}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#8B0000] border border-[#8B0000]/20 rounded-lg hover:bg-[#8B0000]/5 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> {t('history.refresh')}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">{error}</div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* List */}
        <div className="space-y-3">
          {loading && (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
              <Loader2 className="w-10 h-10 text-[#8B0000] mx-auto mb-4 animate-spin" />
              <p className="text-sm text-gray-500">{t('history.loading')}</p>
            </div>
          )}

          {!loading && records.length === 0 && !error && (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
              <Clock className="w-14 h-14 text-gray-200 mx-auto mb-4" />
              <p className="text-sm text-gray-400">
                {t('history.empty')}
              </p>
            </div>
          )}

          {records.map((r) => {
            const active = r.id === selectedId;
            return (
              <button
                key={r.id}
                onClick={() => selectRecord(r.id)}
                className={`w-full text-left bg-white rounded-xl border shadow-sm p-4 transition-all hover:border-[#8B0000]/40 ${
                  active ? 'border-[#8B0000] ring-1 ring-[#8B0000]/20' : 'border-gray-100'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    {r.isBurn ? (
                      <Flame className="w-5 h-5 text-[#F59B0C] shrink-0" />
                    ) : (
                      <Stethoscope className="w-5 h-5 text-[#0F9B8E] shrink-0" />
                    )}
                    <span className="font-semibold text-gray-900 truncate">
                      {r.woundType || r.woundCategory
                        ? translateCanonicalValue(r.woundType || r.woundCategory, lang)
                        : t('history.wound_analysis')}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {formatDate(r.createdAt, lang)}
                  </span>
                  {r.severity && (
                    <span className={`px-2 py-0.5 rounded-full font-semibold ${severityColor(r.severity)}`}>
                      {translateCanonicalValue(r.severity, lang)}
                    </span>
                  )}
                  {r.isBurn && r.tbsaEstimate && (
                    <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">
                      TBSA {r.tbsaEstimate}%
                    </span>
                  )}
                </div>
                {r.clinicianName && (
                  <p className="mt-2 text-xs text-gray-400">{t('history.clinician')} {r.clinicianName}</p>
                )}
              </button>
            );
          })}
        </div>

        {/* Detail */}
        <div>
          {!selectedId && (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
              <ImageOff className="w-14 h-14 text-gray-200 mx-auto mb-4" />
              <p className="text-sm text-gray-400">{t('history.select')}</p>
            </div>
          )}

          {selectedId && detailLoading && (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
              <Loader2 className="w-10 h-10 text-[#8B0000] mx-auto mb-4 animate-spin" />
              <p className="text-sm text-gray-500">{t('history.loading_detail')}</p>
            </div>
          )}

          {selectedId && !detailLoading && !detail && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-sm text-red-600">
              {t('history.unavailable')}
            </div>
          )}

          {selectedId && !detailLoading && detail && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {detailTranslating && (
                <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">
                  <Loader2 className="h-4 w-4 animate-spin" /> {t('analysis.translating')}
                </div>
              )}
              {translationError && (
                <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  {t('analysis.translation_failed')}
                </div>
              )}
              {detail.imageUrl ? (
                <div className="relative rounded-xl overflow-hidden bg-gray-100 aspect-video">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={detail.imageUrl} alt={t('history.image_alt')} className="w-full h-full object-contain" />
                </div>
              ) : detail.hasImage ? (
                <div className="rounded-xl bg-gray-50 border border-gray-100 p-8 text-center text-sm text-gray-400">
                  <ImageOff className="w-10 h-10 text-gray-200 mx-auto mb-2" /> {t('history.image_unavailable')}
                </div>
              ) : null}

              <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y">
                <DetailRow label={t('history.date')} value={formatDate(detail.createdAt, lang)} />
                <DetailRow label={t('analysis.wound_category')} value={translateCanonicalValue(detail.result?.woundCategory ?? detail.woundCategory, lang)} />
                <DetailRow label={t('analysis.wound_type')} value={translateCanonicalValue(detail.result?.woundType ?? detail.woundType, lang)} />
                {detail.result?.burnDegree && detail.result.burnDegree !== 'N/A' && (
                  <DetailRow label={t('history.burn_degree')} value={translateCanonicalValue(detail.result.burnDegree, lang)} />
                )}
                {detail.severity && (
                  <div className="p-4 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">{t('analysis.severity')}</span>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${severityColor(detail.severity)}`}>
                      {translateCanonicalValue(detail.severity, lang)}
                    </span>
                  </div>
                )}
                <DetailRow label={t('analysis.confidence')} value={translateCanonicalValue(detail.result?.confidence ?? detail.confidence, lang)} valueClass="text-[#0F9B8E]" />
                {detail.isBurn && detail.tbsaEstimate && (
                  <DetailRow label={t('history.estimated_tbsa')} value={`${detail.tbsaEstimate}%`} />
                )}
              </div>

              {detail.result?.characteristics && detail.result.characteristics !== 'N/A' && (
                <Section title={t('history.characteristics')} text={detail.result.characteristics} />
              )}

              {(['tissueComposition', 'exudate', 'woundEdges'] as const).some(
                (k) => detail.result?.[k] && detail.result[k] !== 'N/A',
              ) && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden divide-y">
                  {detail.result?.tissueComposition && detail.result.tissueComposition !== 'N/A' && (
                    <Field label={t('analysis.tissue_composition')} value={detail.result.tissueComposition} />
                  )}
                  {detail.result?.exudate && detail.result.exudate !== 'N/A' && (
                    <Field label={t('analysis.exudate_signs')} value={detail.result.exudate} />
                  )}
                  {detail.result?.woundEdges && detail.result.woundEdges !== 'N/A' && (
                    <Field label={t('analysis.wound_edges')} value={detail.result.woundEdges} />
                  )}
                </div>
              )}

              <h3 className="font-display text-base font-bold text-gray-900 pt-2">{t('history.management')}</h3>
              <div className="space-y-3">
                {[
                  { label: t('analysis.first_aid'), value: detail.result?.firstAid },
                  { label: t('analysis.wound_protocol'), value: detail.result?.woundCare },
                  { label: t('analysis.dressing_recommendations'), value: detail.result?.dressing },
                  { label: t('analysis.referral_criteria'), value: detail.result?.referral },
                  { label: t('analysis.follow_up'), value: detail.result?.followUp },
                ]
                  .filter((i) => i.value && i.value !== 'N/A')
                  .map((item, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs font-semibold text-[#8B0000] mb-1">{item.label}</p>
                      <p className="text-sm text-gray-700 whitespace-pre-line">{item.value}</p>
                    </div>
                  ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, valueClass }: { label: string; value?: string | null; valueClass?: string }) {
  const { t } = useLanguage();
  return (
    <div className="p-4 flex items-center justify-between gap-4">
      <span className="text-sm font-medium text-gray-500">{label}</span>
      <span className={`text-sm font-semibold text-right ${valueClass ?? 'text-gray-900'}`}>{value || t('common.not_available')}</span>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4">
      <span className="text-xs font-semibold text-[#0F9B8E] block mb-1">{label}</span>
      <p className="text-sm text-gray-700 whitespace-pre-line">{value}</p>
    </div>
  );
}

function Section({ title, text }: { title: string; text: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <span className="text-sm font-medium text-gray-500 block mb-2">{title}</span>
      <p className="text-sm text-gray-700 whitespace-pre-line">{text}</p>
    </div>
  );
}
