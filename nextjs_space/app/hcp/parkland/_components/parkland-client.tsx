'use client';

import { useLanguage } from '@/components/language-provider';
import { Droplets, AlertTriangle, Calculator } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { trackClientEvent } from '@/lib/telemetry/client';
import { calculateResuscitation, type ResuscitationFormula } from '@/lib/clinical/parkland';

type Formula = ResuscitationFormula;

export function ParklandClient() {
  const { t, lang } = useLanguage();
  const searchParams = useSearchParams();
  const [weight, setWeight] = useState('');
  const [tbsa, setTbsa] = useState('');
  const [burnTime, setBurnTime] = useState('');
  const [formula, setFormula] = useState<Formula>('parkland');

  useEffect(() => {
    const tbsaParam = searchParams?.get('tbsa');
    if (tbsaParam) setTbsa(tbsaParam);
  }, [searchParams]);

  const results = useMemo(() => {
    const w = parseFloat(weight) || 0;
    const tb = parseFloat(tbsa) || 0;
    return calculateResuscitation({ weightKg: w, tbsaPercent: tb, formula });
  }, [weight, tbsa, formula]);

  const tbsaNum = parseFloat(tbsa) || 0;

  // Privacy-safe: after inputs settle, record that a Parkland/Brooke resuscitation
  // volume was computed with the numeric result + formula only (no patient data).
  useEffect(() => {
    if (!results) return;
    const timer = setTimeout(() => {
      trackClientEvent('parkland_calculated', {
        formula,
        total24hMl: Math.round(results.total24h),
        first8hMl: Math.round(results.first8h),
        isChild: results.isChild,
      });
    }, 800);
    return () => clearTimeout(timer);
  }, [results, formula]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">{t('parkland.title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('parkland.subtitle')}</p>
      </div>

      {tbsaNum > 20 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
          <p className="text-sm text-red-700 font-medium">{t('parkland.icu_alert')}</p>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('parkland.weight')}</label>
            <input
              type="number"
              value={weight}
              onChange={(e: any) => setWeight(e?.target?.value ?? '')}
              placeholder="e.g. 70"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8B0000]/20 focus:border-[#8B0000]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('parkland.tbsa')}</label>
            <input
              type="number"
              value={tbsa}
              onChange={(e: any) => setTbsa(e?.target?.value ?? '')}
              placeholder="e.g. 25"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8B0000]/20 focus:border-[#8B0000]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('parkland.burn_time')}</label>
            <input
              type="datetime-local"
              value={burnTime}
              onChange={(e: any) => setBurnTime(e?.target?.value ?? '')}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8B0000]/20 focus:border-[#8B0000]"
            />
          </div>

          {/* Formula Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('parkland.formula')}</label>
            <div className="flex bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
              <button
                onClick={() => setFormula('parkland')}
                className={`flex-1 px-3 py-2.5 text-xs font-medium transition-colors ${formula === 'parkland' ? 'bg-[#8B0000] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                {t('parkland.parkland')}
              </button>
              <button
                onClick={() => setFormula('brooke')}
                className={`flex-1 px-3 py-2.5 text-xs font-medium transition-colors ${formula === 'brooke' ? 'bg-[#8B0000] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                {t('parkland.brooke')}
              </button>
            </div>
          </div>

          <p className="text-xs text-[#0F9B8E] font-medium">{t('parkland.fluid_type')}</p>
        </div>

        {/* Results */}
        <div>
          {results ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {/* Total 24h */}
              <div className="bg-gradient-to-br from-[#8B0000] to-[#C0392B] rounded-xl p-6 text-white text-center">
                <Droplets className="w-8 h-8 mx-auto mb-2 opacity-80" />
                <p className="text-sm opacity-80">{t('parkland.total_24h')}</p>
                <p className="font-mono text-4xl font-bold mt-1">{results?.total24h?.toFixed?.(0) ?? 0} mL</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                  <p className="text-xs text-gray-500">{t('parkland.first_8h')}</p>
                  <p className="font-mono text-2xl font-bold text-[#E67E22] mt-1">{results?.first8h?.toFixed?.(0) ?? 0} mL</p>
                  <p className="text-xs text-gray-400 mt-1">{t('parkland.rate')}: {results?.rate8h?.toFixed?.(1) ?? 0} mL/hr</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                  <p className="text-xs text-gray-500">{t('parkland.next_16h')}</p>
                  <p className="font-mono text-2xl font-bold text-[#0F9B8E] mt-1">{results?.next16h?.toFixed?.(0) ?? 0} mL</p>
                  <p className="text-xs text-gray-400 mt-1">{t('parkland.rate')}: {results?.rate16h?.toFixed?.(1) ?? 0} mL/hr</p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                <p className="text-xs text-gray-500">{t('parkland.urine_target')}</p>
                <p className="font-mono text-xl font-bold text-gray-900 mt-1">{results?.urineTarget?.toFixed?.(1) ?? 0} mL/hr</p>
                <p className="text-xs text-gray-400 mt-1">{results?.isChild ? t('parkland.child_target') : t('parkland.adult_target')}</p>
              </div>

              {burnTime && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                  <p className="font-semibold">{t('parkland.timing_reference')}</p>
                  <p>{t('parkland.first_8h_ends')} {new Date(new Date(burnTime).getTime() + 8 * 3600000).toLocaleString(lang === 'ms' ? 'ms-MY' : 'en-MY', { timeZone: 'Asia/Kuala_Lumpur' })}</p>
                  <p>{t('parkland.24h_ends')} {new Date(new Date(burnTime).getTime() + 24 * 3600000).toLocaleString(lang === 'ms' ? 'ms-MY' : 'en-MY', { timeZone: 'Asia/Kuala_Lumpur' })}</p>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center shadow-sm">
              <Calculator className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <p className="text-sm text-gray-400">{t('parkland.empty')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
