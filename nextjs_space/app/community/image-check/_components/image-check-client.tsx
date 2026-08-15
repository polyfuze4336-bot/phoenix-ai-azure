'use client';

import { useLanguage } from '@/components/language-provider';
import { Upload, Camera, AlertTriangle, Loader2, X, Home, Hospital, Ambulance } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';

async function responseError(response: Response, fallback: string): Promise<string> {
  try {
    const body = await response.json();
    if (typeof body?.error === 'string' && body.error.trim()) return body.error;
  } catch {
    // Keep the existing fallback when the response is not JSON.
  }
  return fallback;
}

export function ImageCheckClient() {
  const { t, lang } = useLanguage();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e?.target?.files?.[0];
    if (!file) return;
    setImageFile(file);
    setResult(null);
    setError(null);
    const reader = new FileReader();
    reader.onload = (ev: any) => setImagePreview(ev?.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const analyze = useCallback(async () => {
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

      const response = await fetch('/api/community-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, mimeType: imageFile?.type ?? 'image/jpeg', lang }),
      });

      if (!response?.ok) throw new Error(await responseError(response, 'Analysis failed'));

      const reader2 = response?.body?.getReader();
      const decoder = new TextDecoder();
      let partialRead = '';

      while (true) {
        const { done, value } = await (reader2?.read() ?? { done: true, value: undefined });
        if (done) break;
        partialRead += decoder?.decode(value, { stream: true }) ?? '';
        const lines = partialRead?.split('\n') ?? [];
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
  }, [imageFile, lang]);

  const recColor = (rec: string) => {
    const lower = rec?.toLowerCase?.() ?? '';
    if (lower?.includes('emergency') || lower?.includes('kecemasan')) return { bg: 'bg-red-50 border-red-200', text: 'text-red-700', icon: Ambulance };
    if (lower?.includes('doctor') || lower?.includes('doktor') || lower?.includes('clinic') || lower?.includes('klinik')) return { bg: 'bg-orange-50 border-orange-200', text: 'text-orange-700', icon: Hospital };
    return { bg: 'bg-green-50 border-green-200', text: 'text-green-700', icon: Home };
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">{t('community.imagecheck_title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('community.imagecheck_desc')}</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-800">
          {lang === 'en'
            ? 'This basic AI check provides general guidance only. It is not a medical diagnosis. Always consult a healthcare professional for serious injuries.'
            : 'Pemeriksaan AI asas ini memberikan panduan umum sahaja. Ia bukan diagnosis perubatan. Sentiasa berunding dengan profesional penjagaan kesihatan untuk kecederaan serius.'}
        </p>
      </div>

      {!imagePreview && (
        <div>
          <div
            onClick={() => fileRef?.current?.click?.()}
            className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-[#0F9B8E]/40 hover:bg-[#0F9B8E]/5 transition-all"
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="font-medium text-gray-600">{lang === 'en' ? 'Upload a photo of your wound' : 'Muat naik gambar luka anda'}</p>
            <p className="text-xs text-gray-400 mt-1">JPEG, PNG</p>
          </div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleFile} className="hidden" />
        </div>
      )}

      {imagePreview && (
        <div className="space-y-3">
          <div className="relative rounded-xl overflow-hidden bg-gray-100">
            <div className="relative aspect-video">
              <Image src={imagePreview} alt="Wound" fill className="object-contain" />
            </div>
            <button onClick={() => { setImagePreview(null); setImageFile(null); setResult(null); }} className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white"><X className="w-4 h-4" /></button>
          </div>
          {!result && (
            <button onClick={analyze} disabled={analyzing} className="w-full px-4 py-3 bg-[#0F9B8E] text-white rounded-xl font-medium hover:bg-[#0e8a7e] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {analyzing ? <><Loader2 className="w-5 h-5 animate-spin" /> {lang === 'en' ? 'Checking...' : 'Memeriksa...'}</> : (lang === 'en' ? 'Check My Wound' : 'Periksa Luka Saya')}
            </button>
          )}
        </div>
      )}

      {result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-display text-base font-bold text-gray-900 mb-3">{lang === 'en' ? 'What We Found' : 'Apa Yang Kami Temui'}</h3>
            <p className="text-sm text-gray-700 mb-4">{result?.description ?? ''}</p>

            {result?.recommendation && (() => {
              const rc = recColor(result?.recommendation);
              return (
                <div className={`rounded-lg border p-4 ${rc?.bg}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <rc.icon className={`w-5 h-5 ${rc?.text}`} />
                    <h4 className={`text-sm font-bold ${rc?.text}`}>{lang === 'en' ? 'Recommendation' : 'Cadangan'}</h4>
                  </div>
                  <p className={`text-sm ${rc?.text}`}>{result?.recommendation}</p>
                </div>
              );
            })()}
          </div>

          {result?.firstAidTips && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-display text-sm font-bold text-gray-900 mb-3">{lang === 'en' ? 'First Aid Tips' : 'Tips Pertolongan Cemas'}</h3>
              <p className="text-sm text-gray-700">{result?.firstAidTips}</p>
            </div>
          )}
        </motion.div>
      )}

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">{error}</div>}
    </div>
  );
}
