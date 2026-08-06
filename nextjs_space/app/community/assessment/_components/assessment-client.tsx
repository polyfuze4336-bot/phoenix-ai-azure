'use client';

import { useLanguage } from '@/components/language-provider';
import { AlertTriangle, CheckCircle, ArrowRight, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useCallback } from 'react';

interface Question {
  id: number;
  textEn: string;
  textBm: string;
  options: { labelEn: string; labelBm: string; score: number }[];
}

const questions: Question[] = [
  {
    id: 1, textEn: 'What caused the burn?', textBm: 'Apa yang menyebabkan kelecuran?',
    options: [
      { labelEn: 'Hot liquid (water, oil)', labelBm: 'Cecair panas (air, minyak)', score: 1 },
      { labelEn: 'Fire/Flame', labelBm: 'Api/Nyalaan', score: 2 },
      { labelEn: 'Chemical', labelBm: 'Bahan kimia', score: 3 },
      { labelEn: 'Electrical', labelBm: 'Elektrik', score: 4 },
      { labelEn: 'Sun/Radiation', labelBm: 'Matahari/Radiasi', score: 1 },
    ],
  },
  {
    id: 2, textEn: 'How large is the burned area?', textBm: 'Seberapa besar kawasan yang terbakar?',
    options: [
      { labelEn: 'Smaller than a coin', labelBm: 'Lebih kecil daripada syiling', score: 0 },
      { labelEn: 'About the size of your palm', labelBm: 'Sebesar tapak tangan', score: 1 },
      { labelEn: 'Larger than your palm', labelBm: 'Lebih besar daripada tapak tangan', score: 2 },
      { labelEn: 'Covers a large body area (arm, leg, chest)', labelBm: 'Meliputi kawasan badan besar (lengan, kaki, dada)', score: 4 },
    ],
  },
  {
    id: 3, textEn: 'What does the burn look like?', textBm: 'Bagaimana rupa kelecuran?',
    options: [
      { labelEn: 'Red, like a sunburn', labelBm: 'Merah, seperti selaran matahari', score: 0 },
      { labelEn: 'Red with blisters', labelBm: 'Merah dengan lepuh', score: 2 },
      { labelEn: 'White, waxy, or charred', labelBm: 'Putih, berlilin, atau hangus', score: 4 },
      { labelEn: 'Not sure', labelBm: 'Tidak pasti', score: 2 },
    ],
  },
  {
    id: 4, textEn: 'Rate the pain level (1-10)', textBm: 'Nilaikan tahap kesakitan (1-10)',
    options: [
      { labelEn: 'Mild (1-3)', labelBm: 'Ringan (1-3)', score: 0 },
      { labelEn: 'Moderate (4-6)', labelBm: 'Sederhana (4-6)', score: 1 },
      { labelEn: 'Severe (7-9)', labelBm: 'Teruk (7-9)', score: 2 },
      { labelEn: 'No pain / Numbness (10)', labelBm: 'Tiada sakit / Kebas (10)', score: 3 },
    ],
  },
];

function getResult(score: number) {
  if (score <= 3) return {
    level: 'minor',
    color: 'bg-green-500',
    bgColor: 'bg-green-50 border-green-200',
    textColor: 'text-green-800',
    titleEn: 'Minor — Home Care Recommended',
    titleBm: 'Ringan — Penjagaan di Rumah Dicadangkan',
    descEn: 'This appears to be a minor burn. Apply first aid at home: cool under running water for 20 minutes, apply aloe vera or burn cream, and cover with a clean bandage. Monitor for signs of infection.',
    descBm: 'Ini kelihatan seperti kelecuran ringan. Sapukan pertolongan cemas di rumah: sejukkan di bawah air mengalir selama 20 minit, sapukan aloe vera atau krim kelecuran, dan tutup dengan pembalut bersih. Pantau tanda jangkitan.',
  };
  if (score <= 7) return {
    level: 'moderate',
    color: 'bg-orange-500',
    bgColor: 'bg-orange-50 border-orange-200',
    textColor: 'text-orange-800',
    titleEn: 'Moderate — Visit a Clinic',
    titleBm: 'Sederhana — Pergi ke Klinik',
    descEn: 'This burn may need professional medical attention. Apply first aid, then visit your nearest clinic or hospital for proper assessment and treatment.',
    descBm: 'Kelecuran ini mungkin memerlukan perhatian perubatan profesional. Sapukan pertolongan cemas, kemudian pergi ke klinik atau hospital terdekat untuk penilaian dan rawatan yang sewajarnya.',
  };
  return {
    level: 'emergency',
    color: 'bg-red-600',
    bgColor: 'bg-red-50 border-red-200',
    textColor: 'text-red-800',
    titleEn: '⚠️ Emergency — Go to Hospital Immediately',
    titleBm: '⚠️ Kecemasan — Pergi ke Hospital Segera',
    descEn: 'This appears to be a serious burn that requires immediate emergency medical attention. Call 999 or go to the nearest Emergency Department immediately. While waiting, cool the burn under running water.',
    descBm: 'Ini kelihatan seperti kelecuran serius yang memerlukan perhatian perubatan kecemasan segera. Hubungi 999 atau pergi ke Jabatan Kecemasan terdekat segera. Semasa menunggu, sejukkan kelecuran di bawah air mengalir.',
  };
}

export function AssessmentClient() {
  const { t, lang } = useLanguage();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);

  const handleAnswer = useCallback((score: number) => {
    const newAnswers = [...(answers ?? []), score];
    setAnswers(newAnswers);
    if (step < (questions?.length ?? 0) - 1) {
      setStep(s => s + 1);
    } else {
      setShowResult(true);
    }
  }, [answers, step]);

  const reset = useCallback(() => {
    setStep(0);
    setAnswers([]);
    setShowResult(false);
  }, []);

  const totalScore = (answers ?? [])?.reduce((a: number, b: number) => a + b, 0);
  const result = getResult(totalScore);
  const currentQ = questions?.[step];

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">{t('community.assessment_title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('community.assessment_desc')}</p>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-800">
          {lang === 'en'
            ? 'This is a basic self-assessment tool and does not replace professional medical advice. When in doubt, seek medical help.'
            : 'Ini adalah alat penilaian kendiri asas dan tidak menggantikan nasihat perubatan profesional. Apabila ragu, dapatkan bantuan perubatan.'}
        </p>
      </div>

      {!showResult && currentQ && (
        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          {/* Progress */}
          <div className="flex items-center gap-2">
            {questions?.map((_: any, i: number) => (
              <div key={i} className={`h-2 flex-1 rounded-full transition-colors ${i <= step ? 'bg-[#0F9B8E]' : 'bg-gray-200'}`} />
            ))}
          </div>
          <p className="text-xs text-gray-400">{lang === 'en' ? 'Question' : 'Soalan'} {step + 1} / {questions?.length ?? 0}</p>

          <h2 className="font-display text-lg font-bold text-gray-900">
            {lang === 'en' ? currentQ?.textEn : currentQ?.textBm}
          </h2>

          <div className="space-y-3">
            {currentQ?.options?.map((opt: any, i: number) => (
              <button
                key={i}
                onClick={() => handleAnswer(opt?.score ?? 0)}
                className="w-full text-left px-5 py-4 bg-white rounded-xl border border-gray-200 hover:border-[#0F9B8E] hover:bg-[#0F9B8E]/5 transition-all text-sm font-medium text-gray-700 flex items-center justify-between group"
              >
                {lang === 'en' ? opt?.labelEn : opt?.labelBm}
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#0F9B8E] transition-colors" />
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {showResult && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className={`rounded-xl border p-6 ${result?.bgColor}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-full ${result?.color} flex items-center justify-center`}>
                {result?.level === 'minor' ? <CheckCircle className="w-5 h-5 text-white" /> : <AlertTriangle className="w-5 h-5 text-white" />}
              </div>
              <h2 className={`font-display text-lg font-bold ${result?.textColor}`}>
                {lang === 'en' ? result?.titleEn : result?.titleBm}
              </h2>
            </div>
            <p className={`text-sm ${result?.textColor}`}>
              {lang === 'en' ? result?.descEn : result?.descBm}
            </p>
          </div>

          {result?.level === 'emergency' && (
            <a href="tel:999" className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-red-600 text-white rounded-xl font-bold text-lg hover:bg-red-700 transition-colors">
              {lang === 'en' ? 'Call 999 Now' : 'Hubungi 999 Sekarang'}
            </a>
          )}

          <button onClick={reset} className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
            <RotateCcw className="w-4 h-4" /> {t('common.reset')}
          </button>
        </motion.div>
      )}
    </div>
  );
}
