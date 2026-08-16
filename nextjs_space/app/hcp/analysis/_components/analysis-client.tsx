'use client';

import { useLanguage } from '@/components/language-provider';
import { Upload, FileText, X, Loader2, Flame, Droplets, Calculator, Layers, Palette, RefreshCw, Images } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { StructuredAnalysis, type StructuredAnalysisData } from './structured-analysis';
import { translateCanonicalValue, type AppLanguage } from '@/lib/i18n';
import { ClinicalAiNotice } from '@/components/clinical-ai-notice';

interface AnalysisResult {
  language?: AppLanguage;
  fitzpatrickType: string;
  fitzpatrickNote: string;
  woundCategory: string;
  woundType: string;
  burnDegree: string;
  severity: string;
  characteristics: string;
  tissueComposition: string;
  exudate: string;
  woundEdges: string;
  confidence: string;
  tbsaEstimate: string;
  tbsaRange: string;
  tbsaBodyRegions: string;
  tbsaMethod: string;
  isBurn: boolean;
  parklandFluid: string;
  firstAid: string;
  woundCare: string;
  dressing: string;
  referral: string;
  followUp: string;
  /** Rich result from the staged pipeline (absent on the legacy single-pass path). */
  structured?: StructuredAnalysisData;
}

/** Optional patient context the clinician can supply to improve accuracy. */
interface PatientContext {
  weightKg?: number;
  mechanism?: string;
}

/**
 * Best-effort persistence of a completed analysis (image + result) to the clinician
 * history page. Fire-and-forget: a save failure must NEVER disrupt the analysis view.
 */
async function saveAnalysisToHistory(result: AnalysisResult, image: string, mimeType: string) {
  try {
    let clinician: { name?: string; email?: string } | undefined;
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('hcp_auth');
      if (stored) {
        try {
          const u = JSON.parse(stored);
          clinician = { name: u?.name, email: u?.email };
        } catch { /* ignore malformed session */ }
      }
    }
    await fetch('/api/hcp/analyses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ result, image, mimeType, clinician }),
    });
  } catch {
    /* best-effort only */
  }
}

async function responseError(response: Response, fallback: string): Promise<string> {
  const body = await response.json().catch(() => undefined);
  return typeof body?.error === 'string' ? body.error : fallback;
}

const ACCEPTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_CLIENT_IMAGE_BYTES = 10 * 1024 * 1024;

function readImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('IMAGE_ENCODING_FAILED'));
    reader.onload = () => {
      if (typeof reader.result !== 'string' || !reader.result.includes(',')) {
        reject(new Error('IMAGE_ENCODING_FAILED'));
        return;
      }
      const image = new window.Image();
      image.onerror = () => reject(new Error('IMAGE_INVALID'));
      image.onload = () => {
        if (image.naturalWidth < 1 || image.naturalHeight < 1) reject(new Error('IMAGE_INVALID'));
        else resolve(reader.result as string);
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export function AnalysisClient() {
  const { t, lang } = useLanguage();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analysisFailed, setAnalysisFailed] = useState(false);
  const [analysisRetryCount, setAnalysisRetryCount] = useState(0);
  const [refining, setRefining] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [translationError, setTranslationError] = useState(false);
  const [weightKg, setWeightKg] = useState('');
  const [mechanism, setMechanism] = useState('');
  const [loadingStage, setLoadingStage] = useState(0);
  const lastBase64Ref = useRef<string>('');
  const lastMimeRef = useRef<string>('image/jpeg');
  const translationsRef = useRef<Partial<Record<AppLanguage, AnalysisResult>>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const analysisStages = lang === 'ms'
    ? ['Menyediakan imej', 'Menganalisis ciri luka', 'Menyemak penilaian', 'Menyediakan keputusan']
    : ['Preparing image', 'Analysing wound characteristics', 'Reviewing assessment', 'Preparing result'];

  useEffect(() => {
    if (!analyzing) {
      setLoadingStage(0);
      return;
    }
    const timer = window.setInterval(() => setLoadingStage((stage) => Math.min(stage + 1, 3)), 4500);
    return () => window.clearInterval(timer);
  }, [analyzing]);

  useEffect(() => {
    if (!result || result.language === lang) return;
    const cached = translationsRef.current[lang];
    if (cached) {
      setResult(cached);
      setTranslationError(false);
      return;
    }

    const controller = new AbortController();
    setTranslating(true);
    setTranslationError(false);
    void fetch('/api/analyze-wound/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ result, language: lang }),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('TRANSLATION_FAILED');
        const body = await response.json();
        if (!body?.result) throw new Error('TRANSLATION_FAILED');
        const translated = { ...body.result, language: lang } as AnalysisResult;
        translationsRef.current[lang] = translated;
        setResult(translated);
      })
      .catch((error) => {
        if (error?.name !== 'AbortError') setTranslationError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setTranslating(false);
      });
    return () => controller.abort();
  }, [lang, result]);

  const patientContext = useCallback((): PatientContext | undefined => {
    const w = parseFloat(weightKg);
    const ctx: PatientContext = {
      weightKg: Number.isFinite(w) && w > 0 ? w : undefined,
      mechanism: mechanism.trim() || undefined,
    };
    return ctx.weightKg || ctx.mechanism ? ctx : undefined;
  }, [weightKg, mechanism]);

  /** Read the SSE stream from /api/analyze-wound and resolve the completed result. */
  const readAnalysisStream = useCallback(async (response: Response): Promise<AnalysisResult | null> => {
    const reader = response?.body?.getReader();
    const decoder = new TextDecoder();
    let partialRead = '';
    while (true) {
      const { done, value } = await (reader?.read() ?? { done: true, value: undefined });
      if (done) break;
      partialRead += decoder?.decode(value, { stream: true }) ?? '';
      const lines = partialRead?.split('\n') ?? [];
      partialRead = lines?.pop() ?? '';
      for (const line of (lines ?? [])) {
        if (line?.startsWith('data: ')) {
          const data = line?.slice(6);
          if (data === '[DONE]') return null;
          try {
            const parsed = JSON.parse(data);
            if (parsed?.status === 'completed' && parsed?.result) return parsed.result as AnalysisResult;
          } catch (e: any) { /* skip */ }
        }
      }
    }
    throw new Error(t('analysis.stream_interrupted'));
  }, [t]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e?.target?.files?.[0];
    if (!file) return;
    setResult(null);
    setError(null);
    setAnalysisFailed(false);
    setAnalysisRetryCount(0);
    setImageFile(null);
    setImagePreview(null);
    if (file.size === 0 || !ACCEPTED_IMAGE_TYPES.has(file.type)) {
      setError(t('analysis.image_invalid'));
      return;
    }
    if (file.size > MAX_CLIENT_IMAGE_BYTES) {
      setError(t('analysis.image_too_large'));
      return;
    }
    try {
      const dataUrl = await readImageFile(file);
      setImageFile(file);
      setImagePreview(dataUrl);
    } catch (error) {
      setError(error instanceof Error && error.message === 'IMAGE_ENCODING_FAILED'
        ? t('analysis.image_encoding_failed')
        : t('analysis.image_invalid'));
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [t]);

  const analyzeImage = useCallback(async (retryCount: number) => {
    if (!imageFile) return;
    setAnalyzing(true);
    setError(null);
    setAnalysisFailed(false);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const encoded = (reader?.result as string)?.split(',')?.[1] ?? '';
          if (encoded) resolve(encoded);
          else reject(new Error(t('analysis.image_encoding_failed')));
        };
        reader.onerror = () => reject(new Error(t('analysis.image_encoding_failed')));
        reader.readAsDataURL(imageFile);
      });

      const mime = imageFile?.type ?? 'image/jpeg';
      lastBase64Ref.current = base64;
      lastMimeRef.current = mime;

      const response = await fetch('/api/analyze-wound', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-analysis-retry-count': String(retryCount),
        },
        body: JSON.stringify({ image: base64, mimeType: mime, patient: patientContext(), language: lang }),
      });

      if (!response?.ok) throw new Error(await responseError(response, t('analysis.failed')));

      const completed = await readAnalysisStream(response);
      if (completed) {
        const localized = { ...completed, language: lang };
        translationsRef.current = { [lang]: localized };
        setResult(localized);
        setAnalysisFailed(false);
        void saveAnalysisToHistory(completed, base64, mime);
      }
    } catch (err: any) {
      setAnalysisFailed(true);
    } finally {
      setAnalyzing(false);
    }
  }, [imageFile, lang, patientContext, readAnalysisStream, t]);

  const retryAnalysis = useCallback(() => {
    const retryCount = Math.min(10, analysisRetryCount + 1);
    setAnalysisRetryCount(retryCount);
    void analyzeImage(retryCount);
  }, [analysisRetryCount, analyzeImage]);

  /** Second pass: re-run the pipeline with clinician answers, no re-upload. */
  const refineAnalysis = useCallback(async (answers: string) => {
    if (!lastBase64Ref.current || !result?.structured) return;
    setRefining(true);
    setError(null);
    try {
      const response = await fetch('/api/analyze-wound', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: lastBase64Ref.current,
          mimeType: lastMimeRef.current,
          patient: patientContext(),
          priorAnalysis: result.structured,
          refineAnswers: answers,
          language: lang,
        }),
      });
      if (!response?.ok) throw new Error(await responseError(response, t('analysis.refine_failed')));
      const completed = await readAnalysisStream(response);
      if (completed) {
        const localized = { ...completed, language: lang };
        translationsRef.current = { [lang]: localized };
        setResult(localized);
        void saveAnalysisToHistory(completed, lastBase64Ref.current, lastMimeRef.current);
      }
    } catch (err: any) {
      setError(err?.message ?? t('analysis.refine_failed'));
    } finally {
      setRefining(false);
    }
  }, [lang, result, patientContext, readAnalysisStream, t]);

  const clearImage = useCallback(() => {
    setImagePreview(null);
    setImageFile(null);
    setResult(null);
    setError(null);
    setAnalysisFailed(false);
    setAnalysisRetryCount(0);
    setTranslationError(false);
    translationsRef.current = {};
  }, []);

  const chooseAnotherImage = useCallback(() => {
    clearImage();
    window.setTimeout(() => fileInputRef.current?.click(), 0);
  }, [clearImage]);

  const severityColor = (s: string) => {
    const lower = s?.toLowerCase?.() ?? '';
    if (lower?.includes('critical')) return 'bg-red-600 text-white';
    if (lower?.includes('severe')) return 'bg-red-500 text-white';
    if (lower?.includes('moderate')) return 'bg-orange-500 text-white';
    return 'bg-green-500 text-white';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">{t('analysis.title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('analysis.subtitle')}</p>
      </div>

      {!result && <ClinicalAiNotice />}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <div className="space-y-4">
          <ClinicalAiNotice variant="confidentiality" />
          <ClinicalAiNotice variant="personal-data" />
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleFileSelect} className="hidden" />
          {!imagePreview && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div
                onClick={() => fileInputRef?.current?.click?.()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-[#8B0000]/40 hover:bg-[#8B0000]/5 transition-all"
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="font-medium text-gray-600">{t('analysis.upload')}</p>
                <p className="text-xs text-gray-400 mt-1">{t('analysis.file_hint')}</p>
              </div>
            </motion.div>
          )}

          {imagePreview && (
            <div className="space-y-3">
              <div className="relative rounded-xl overflow-hidden bg-gray-100">
                <div className="relative aspect-video">
                  <Image src={imagePreview} alt="Wound image" fill className="object-contain" />
                </div>
                <button onClick={clearImage} className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {/* Optional patient context — improves accuracy; nothing is assumed when blank. */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
                <p className="text-xs font-semibold text-gray-500">{t('analysis.patient_details')}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">{t('analysis.weight')}</label>
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      value={weightKg}
                      onChange={(e) => setWeightKg(e.target.value)}
                      placeholder={t('analysis.weight_placeholder')}
                      className="w-full text-sm border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#8B0000]/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">{t('analysis.mechanism')}</label>
                    <input
                      type="text"
                      value={mechanism}
                      onChange={(e) => setMechanism(e.target.value)}
                      placeholder={t('analysis.mechanism_placeholder')}
                      className="w-full text-sm border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#8B0000]/30"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-gray-400">{t('analysis.weight_help')}</p>
              </div>
              <button
                onClick={() => void analyzeImage(0)}
                disabled={analyzing}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#8B0000] text-white rounded-xl font-medium hover:bg-[#7a0000] transition-colors disabled:opacity-50"
              >
                {analyzing ? <><Loader2 className="w-5 h-5 animate-spin" /> {analysisStages[loadingStage]}</> : <><FileText className="w-5 h-5" /> {t('analysis.analyze')}</>}
              </button>
            </div>
          )}

          {analysisFailed && (
            <div role="alert" className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
              <div>
                <h2 className="font-display text-base font-bold text-red-800">{t('analysis.failure_title')}</h2>
                <p className="text-sm text-red-700 mt-1 leading-relaxed">{t('analysis.failure_message')}</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={retryAnalysis}
                  disabled={analyzing}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#8B0000] text-white rounded-lg text-sm font-medium hover:bg-[#7a0000] disabled:opacity-50"
                >
                  <RefreshCw className="w-4 h-4" /> {t('analysis.retry')}
                </button>
                <button
                  type="button"
                  onClick={chooseAnotherImage}
                  disabled={analyzing}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                >
                  <Images className="w-4 h-4" /> {t('analysis.choose_another')}
                </button>
              </div>
            </div>
          )}
          {error && <div role="alert" className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">{error}</div>}
        </div>

        {/* Results Section */}
        <div>
          {result && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <h2 className="font-display text-lg font-bold text-gray-900">{t('analysis.results')}</h2>
              <ClinicalAiNotice />
              {translating && (
                <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">
                  <Loader2 className="h-4 w-4 animate-spin" /> {t('analysis.translating')}
                </div>
              )}
              {translationError && (
                <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  {t('analysis.translation_failed')}
                </div>
              )}

              {/* Native skin type (Fitzpatrick) */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200 overflow-hidden">
                <div className="p-4 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-medium text-gray-600"><Palette className="w-4 h-4 text-[#E67E22]" /> {t('analysis.native_skin_type')}</span>
                  <span className="text-sm font-bold text-[#8B0000]">{translateCanonicalValue(result?.fitzpatrickType, lang)}</span>
                </div>
                {result?.fitzpatrickNote && result?.fitzpatrickNote !== 'N/A' && (
                  <div className="px-4 pb-4 -mt-1">
                    <p className="text-xs text-gray-600 leading-relaxed">{result?.fitzpatrickNote}</p>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y">
                <div className="p-4 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">{t('analysis.wound_category')}</span>
                  <span className="text-sm font-semibold text-gray-900 text-right">{translateCanonicalValue(result?.woundCategory, lang)}</span>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">{t('analysis.wound_type')}</span>
                  <span className="text-sm font-semibold text-gray-900 text-right">{translateCanonicalValue(result?.woundType, lang)}</span>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">{t('analysis.burn_degree')}</span>
                  <span className="text-sm font-semibold text-gray-900">{translateCanonicalValue(result?.burnDegree, lang)}</span>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">{t('analysis.severity')}</span>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${severityColor(result?.severity ?? '')}`}>{translateCanonicalValue(result?.severity, lang)}</span>
                </div>
                <div className="p-4">
                  <span className="text-sm font-medium text-gray-500 block mb-2">{t('analysis.characteristics')}</span>
                  <p className="text-sm text-gray-700">{result?.characteristics ?? 'N/A'}</p>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">{t('analysis.confidence')}</span>
                  <span className="text-sm font-semibold text-[#0F9B8E]">{translateCanonicalValue(result?.confidence, lang)}</span>
                </div>
              </div>

              {/* Wound bed / tissue assessment */}
              {((result?.tissueComposition && result?.tissueComposition !== 'N/A') ||
                (result?.exudate && result?.exudate !== 'N/A') ||
                (result?.woundEdges && result?.woundEdges !== 'N/A')) && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-4 py-2.5 bg-gradient-to-r from-[#0F9B8E] to-[#0e8a7e] flex items-center gap-2">
                    <Layers className="w-4 h-4 text-white" />
                    <span className="text-white font-semibold text-sm">{t('analysis.wound_bed')}</span>
                  </div>
                  <div className="divide-y">
                    {result?.tissueComposition && result?.tissueComposition !== 'N/A' && (
                      <div className="p-4">
                        <span className="text-xs font-semibold text-[#0F9B8E] block mb-1">{t('analysis.tissue_composition')}</span>
                        <p className="text-sm text-gray-700">{result?.tissueComposition}</p>
                      </div>
                    )}
                    {result?.exudate && result?.exudate !== 'N/A' && (
                      <div className="p-4">
                        <span className="text-xs font-semibold text-[#0F9B8E] block mb-1">{t('analysis.exudate_signs')}</span>
                        <p className="text-sm text-gray-700">{result?.exudate}</p>
                      </div>
                    )}
                    {result?.woundEdges && result?.woundEdges !== 'N/A' && (
                      <div className="p-4">
                        <span className="text-xs font-semibold text-[#0F9B8E] block mb-1">{t('analysis.wound_edges')}</span>
                        <p className="text-sm text-gray-700">{result?.woundEdges}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TBSA Estimation - Only for burns */}
              {result?.isBurn && parseFloat(result?.tbsaEstimate ?? '0') > 0 && (
                <div className="space-y-3">
                  <h3 className="font-display text-base font-bold text-gray-900 pt-2 flex items-center gap-2">
                    <Flame className="w-5 h-5 text-[#F59B0C]" />
                    {t('analysis.tbsa_estimation')}
                  </h3>
                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-200 overflow-hidden">
                    <div className="p-4 bg-gradient-to-r from-[#8B0000] to-[#a01010] flex items-center justify-between">
                      <span className="text-white font-medium text-sm">{t('analysis.estimated_tbsa')}</span>
                      <span className="text-white font-bold text-2xl">{result?.tbsaEstimate ?? '0'}%</span>
                    </div>
                    <div className="divide-y divide-orange-100">
                      <div className="p-4 flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">{t('analysis.tbsa_range')}</span>
                        <span className="text-sm font-semibold text-gray-900">{result?.tbsaRange ?? 'N/A'}</span>
                      </div>
                      <div className="p-4">
                        <span className="text-sm font-medium text-gray-600 block mb-1">{t('analysis.affected_regions')}</span>
                        <p className="text-sm text-gray-800">{result?.tbsaBodyRegions ?? 'N/A'}</p>
                      </div>
                      <div className="p-4 flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">{t('analysis.estimation_method')}</span>
                        <span className="text-xs font-medium px-2 py-1 bg-orange-100 text-orange-700 rounded-full">{result?.tbsaMethod ?? 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Parkland Formula */}
                  {result?.parklandFluid && result?.parklandFluid !== 'N/A' && (
                    <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl border border-teal-200 overflow-hidden">
                      <div className="p-4 bg-gradient-to-r from-[#0F9B8E] to-[#0e8a7e] flex items-center gap-2">
                        <Droplets className="w-5 h-5 text-white" />
                        <span className="text-white font-medium text-sm">{t('analysis.parkland_title')}</span>
                      </div>
                      <div className="p-4">
                        <p className="text-sm text-gray-800 whitespace-pre-line">{result?.parklandFluid}</p>
                        {result?.structured ? (
                          result?.structured?.parkland?.requiresWeight ? (
                            <p className="text-xs text-gray-500 mt-3 italic">{t('analysis.parkland_weight_help')}</p>
                          ) : null
                        ) : (
                          <p className="text-xs text-gray-500 mt-3 italic">{t('analysis.parkland_assumed_help')}</p>
                        )}
                      </div>
                      <div className="px-4 pb-4">
                        <a
                          href="/hcp/parkland"
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#0F9B8E] hover:text-[#0e8a7e] transition-colors"
                        >
                          <Calculator className="w-4 h-4" />
                          {t('analysis.open_parkland')}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Management Recommendations */}
              <h3 className="font-display text-base font-bold text-gray-900 pt-2">{t('analysis.management')}</h3>
              <div className="space-y-3">
                {[
                  { label: t('analysis.first_aid'), value: result?.firstAid },
                  { label: t('analysis.wound_protocol'), value: result?.woundCare },
                  { label: t('analysis.dressing_recommendations'), value: result?.dressing },
                  { label: t('analysis.referral_criteria'), value: result?.referral },
                  { label: t('analysis.follow_up'), value: result?.followUp },
                ]?.map((item: any, i: number) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs font-semibold text-[#8B0000] mb-1">{item?.label}</p>
                    <p className="text-sm text-gray-700">{item?.value ?? t('common.not_available')}</p>
                  </div>
                ))}
              </div>

              {/* Enhanced staged-pipeline detail: evidence, confidence, gaps, refine. */}
              {result?.structured && (
                <StructuredAnalysis data={result.structured} onRefine={refineAnalysis} refining={refining} />
              )}
            </motion.div>
          )}

          {!result && !analyzing && (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
              <Brain className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <p className="text-sm text-gray-400">{t('analysis.empty')}</p>
            </div>
          )}

          {analyzing && (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
              <Loader2 className="w-12 h-12 text-[#8B0000] mx-auto mb-4 animate-spin" />
              <p className="text-sm text-gray-500">{t('analysis.analyzing')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Brain(props: any) {
  return (
    <svg {...(props ?? {})} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2A5.5 5.5 0 0 0 4 7.5c0 1.19.38 2.29 1.02 3.19A5.5 5.5 0 0 0 4 14.5 5.5 5.5 0 0 0 9.5 20h.5v2" />
      <path d="M14.5 2A5.5 5.5 0 0 1 20 7.5c0 1.19-.38 2.29-1.02 3.19A5.5 5.5 0 0 1 20 14.5a5.5 5.5 0 0 1-5.5 5.5H14v2" />
    </svg>
  );
}
