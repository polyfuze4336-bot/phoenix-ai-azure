'use client';

import { useLanguage } from '@/components/language-provider';
import { Upload, Camera, AlertTriangle, FileText, X, Loader2, Flame, Droplets, Calculator, Layers, Palette } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';

interface AnalysisResult {
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
}

export function AnalysisClient() {
  const { t } = useLanguage();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e?.target?.files?.[0];
    if (!file) return;
    setImageFile(file);
    setResult(null);
    setError(null);
    const reader = new FileReader();
    reader.onload = (ev: any) => setImagePreview(ev?.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator?.mediaDevices?.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef?.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
      setResult(null);
      setError(null);
    } catch (err: any) {
      setError('Camera access denied. Please allow camera access.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef?.current?.getTracks()?.forEach((track: any) => track?.stop?.());
    setCameraActive(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef?.current || !canvasRef?.current) return;
    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth ?? 640;
    canvas.height = videoRef.current.videoHeight ?? 480;
    const ctx = canvas?.getContext('2d');
    ctx?.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas?.toDataURL('image/jpeg', 0.8);
    setImagePreview(dataUrl);
    canvas?.toBlob((blob: any) => {
      if (blob) setImageFile(new File([blob], 'capture.jpg', { type: 'image/jpeg' }));
    }, 'image/jpeg', 0.8);
    stopCamera();
  }, [stopCamera]);

  const analyzeImage = useCallback(async () => {
    if (!imageFile) return;
    setAnalyzing(true);
    setError(null);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve((reader?.result as string)?.split(',')?.[1] ?? '');
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
      });

      const response = await fetch('/api/analyze-wound', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, mimeType: imageFile?.type ?? 'image/jpeg' }),
      });

      if (!response?.ok) throw new Error('Analysis failed');

      const reader2 = response?.body?.getReader();
      const decoder = new TextDecoder();
      let partialRead = '';

      while (true) {
        const { done, value } = await (reader2?.read() ?? { done: true, value: undefined });
        if (done) break;
        partialRead += decoder?.decode(value, { stream: true }) ?? '';
        let lines = partialRead?.split('\n') ?? [];
        partialRead = lines?.pop() ?? '';
        for (const line of (lines ?? [])) {
          if (line?.startsWith('data: ')) {
            const data = line?.slice(6);
            if (data === '[DONE]') return;
            try {
              const parsed = JSON.parse(data);
              if (parsed?.status === 'completed' && parsed?.result) {
                setResult(parsed.result);
                setAnalyzing(false);
                return;
              }
            } catch (e: any) { /* skip */ }
          }
        }
      }
    } catch (err: any) {
      setError(err?.message ?? 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  }, [imageFile]);

  const clearImage = useCallback(() => {
    setImagePreview(null);
    setImageFile(null);
    setResult(null);
    setError(null);
  }, []);

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
        <p className="text-sm text-gray-500 mt-1">Upload or capture a wound/burn image for AI-powered clinical assessment</p>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-sm text-amber-800">{t('analysis.disclaimer')}</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <div className="space-y-4">
          {!imagePreview && !cameraActive && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div
                onClick={() => fileInputRef?.current?.click?.()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-[#8B0000]/40 hover:bg-[#8B0000]/5 transition-all"
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="font-medium text-gray-600">{t('analysis.upload')}</p>
                <p className="text-xs text-gray-400 mt-1">JPEG, PNG — max 10MB</p>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
              <button
                onClick={startCamera}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#0F9B8E] text-white rounded-xl font-medium hover:bg-[#0e8a7e] transition-colors"
              >
                <Camera className="w-5 h-5" /> {t('analysis.camera')}
              </button>
            </motion.div>
          )}

          {cameraActive && (
            <div className="space-y-3">
              <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              </div>
              <div className="flex gap-3">
                <button onClick={capturePhoto} className="flex-1 px-4 py-3 bg-[#8B0000] text-white rounded-xl font-medium hover:bg-[#7a0000] transition-colors">Capture</button>
                <button onClick={stopCamera} className="px-4 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors">Cancel</button>
              </div>
              <canvas ref={canvasRef} className="hidden" />
            </div>
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
              <button
                onClick={analyzeImage}
                disabled={analyzing}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#8B0000] text-white rounded-xl font-medium hover:bg-[#7a0000] transition-colors disabled:opacity-50"
              >
                {analyzing ? <><Loader2 className="w-5 h-5 animate-spin" /> {t('analysis.analyzing')}</> : <><FileText className="w-5 h-5" /> {t('analysis.analyze')}</>}
              </button>
            </div>
          )}

          {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">{error}</div>}
        </div>

        {/* Results Section */}
        <div>
          {result && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <h2 className="font-display text-lg font-bold text-gray-900">{t('analysis.results')}</h2>

              {/* Native skin type (Fitzpatrick) */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200 overflow-hidden">
                <div className="p-4 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-medium text-gray-600"><Palette className="w-4 h-4 text-[#E67E22]" /> Native Skin Type (Fitzpatrick)</span>
                  <span className="text-sm font-bold text-[#8B0000]">{result?.fitzpatrickType ?? 'N/A'}</span>
                </div>
                {result?.fitzpatrickNote && result?.fitzpatrickNote !== 'N/A' && (
                  <div className="px-4 pb-4 -mt-1">
                    <p className="text-xs text-gray-600 leading-relaxed">{result?.fitzpatrickNote}</p>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y">
                <div className="p-4 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Wound Category</span>
                  <span className="text-sm font-semibold text-gray-900 text-right">{result?.woundCategory ?? 'N/A'}</span>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">{t('analysis.wound_type')}</span>
                  <span className="text-sm font-semibold text-gray-900 text-right">{result?.woundType ?? 'N/A'}</span>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">{t('analysis.burn_degree')}</span>
                  <span className="text-sm font-semibold text-gray-900">{result?.burnDegree ?? 'N/A'}</span>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">{t('analysis.severity')}</span>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${severityColor(result?.severity ?? '')}`}>{result?.severity ?? 'N/A'}</span>
                </div>
                <div className="p-4">
                  <span className="text-sm font-medium text-gray-500 block mb-2">{t('analysis.characteristics')}</span>
                  <p className="text-sm text-gray-700">{result?.characteristics ?? 'N/A'}</p>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">{t('analysis.confidence')}</span>
                  <span className="text-sm font-semibold text-[#0F9B8E]">{result?.confidence ?? 'N/A'}</span>
                </div>
              </div>

              {/* Wound bed / tissue assessment */}
              {((result?.tissueComposition && result?.tissueComposition !== 'N/A') ||
                (result?.exudate && result?.exudate !== 'N/A') ||
                (result?.woundEdges && result?.woundEdges !== 'N/A')) && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-4 py-2.5 bg-gradient-to-r from-[#0F9B8E] to-[#0e8a7e] flex items-center gap-2">
                    <Layers className="w-4 h-4 text-white" />
                    <span className="text-white font-semibold text-sm">Wound Bed &amp; Tissue Assessment</span>
                  </div>
                  <div className="divide-y">
                    {result?.tissueComposition && result?.tissueComposition !== 'N/A' && (
                      <div className="p-4">
                        <span className="text-xs font-semibold text-[#0F9B8E] block mb-1">Tissue Composition</span>
                        <p className="text-sm text-gray-700">{result?.tissueComposition}</p>
                      </div>
                    )}
                    {result?.exudate && result?.exudate !== 'N/A' && (
                      <div className="p-4">
                        <span className="text-xs font-semibold text-[#0F9B8E] block mb-1">Exudate &amp; Infection Signs</span>
                        <p className="text-sm text-gray-700">{result?.exudate}</p>
                      </div>
                    )}
                    {result?.woundEdges && result?.woundEdges !== 'N/A' && (
                      <div className="p-4">
                        <span className="text-xs font-semibold text-[#0F9B8E] block mb-1">Wound Edges &amp; Periwound Skin</span>
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
                    TBSA Estimation
                  </h3>
                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-200 overflow-hidden">
                    <div className="p-4 bg-gradient-to-r from-[#8B0000] to-[#a01010] flex items-center justify-between">
                      <span className="text-white font-medium text-sm">Estimated TBSA</span>
                      <span className="text-white font-bold text-2xl">{result?.tbsaEstimate ?? '0'}%</span>
                    </div>
                    <div className="divide-y divide-orange-100">
                      <div className="p-4 flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">TBSA Range</span>
                        <span className="text-sm font-semibold text-gray-900">{result?.tbsaRange ?? 'N/A'}</span>
                      </div>
                      <div className="p-4">
                        <span className="text-sm font-medium text-gray-600 block mb-1">Affected Body Regions</span>
                        <p className="text-sm text-gray-800">{result?.tbsaBodyRegions ?? 'N/A'}</p>
                      </div>
                      <div className="p-4 flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">Estimation Method</span>
                        <span className="text-xs font-medium px-2 py-1 bg-orange-100 text-orange-700 rounded-full">{result?.tbsaMethod ?? 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Parkland Formula */}
                  {result?.parklandFluid && result?.parklandFluid !== 'N/A' && (
                    <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl border border-teal-200 overflow-hidden">
                      <div className="p-4 bg-gradient-to-r from-[#0F9B8E] to-[#0e8a7e] flex items-center gap-2">
                        <Droplets className="w-5 h-5 text-white" />
                        <span className="text-white font-medium text-sm">Parkland Formula (Fluid Resuscitation)</span>
                      </div>
                      <div className="p-4">
                        <p className="text-sm text-gray-800 whitespace-pre-line">{result?.parklandFluid}</p>
                        <p className="text-xs text-gray-500 mt-3 italic">* Based on assumed 70kg adult. Adjust weight in the Parkland Calculator for precise calculations.</p>
                      </div>
                      <div className="px-4 pb-4">
                        <a
                          href="/hcp/parkland"
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#0F9B8E] hover:text-[#0e8a7e] transition-colors"
                        >
                          <Calculator className="w-4 h-4" />
                          Open Parkland Calculator for precise calculation →
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
                  { label: 'First Aid', value: result?.firstAid },
                  { label: 'Wound Care Protocol', value: result?.woundCare },
                  { label: 'Dressing Recommendations', value: result?.dressing },
                  { label: 'Referral Criteria', value: result?.referral },
                  { label: 'Follow-up Schedule', value: result?.followUp },
                ]?.map((item: any, i: number) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs font-semibold text-[#8B0000] mb-1">{item?.label}</p>
                    <p className="text-sm text-gray-700">{item?.value ?? 'N/A'}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {!result && !analyzing && (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
              <Brain className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <p className="text-sm text-gray-400">Upload an image to begin AI analysis</p>
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
