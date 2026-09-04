'use client';

import { useLanguage } from '@/components/language-provider';
import { AlertTriangle, CheckCircle, ArrowRight, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useCallback } from 'react';
import { localizedContent } from '@/lib/i18n/index';

function getResultStyle(score: number) {
  if (score <= 3) return {
    level: 'minor',
    color: 'bg-green-500',
    bgColor: 'bg-green-50 border-green-200',
    textColor: 'text-green-800',
  } as const;
  if (score <= 7) return {
    level: 'moderate',
    color: 'bg-orange-500',
    bgColor: 'bg-orange-50 border-orange-200',
    textColor: 'text-orange-800',
  } as const;
  return {
    level: 'emergency',
    color: 'bg-red-600',
    bgColor: 'bg-red-50 border-red-200',
    textColor: 'text-red-800',
  } as const;
}

export function AssessmentClient() {
  const { t, lang } = useLanguage();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);
  const content = localizedContent(lang).community.assessment;
  const questions = content.questions;

  const handleAnswer = useCallback((score: number) => {
    const newAnswers = [...(answers ?? []), score];
    setAnswers(newAnswers);
    if (step < (questions?.length ?? 0) - 1) {
      setStep(s => s + 1);
    } else {
      setShowResult(true);
    }
  }, [answers, step, questions.length]);

  const reset = useCallback(() => {
    setStep(0);
    setAnswers([]);
    setShowResult(false);
  }, []);

  const totalScore = (answers ?? [])?.reduce((a: number, b: number) => a + b, 0);
  const result = getResultStyle(totalScore);
  const resultCopy = content.results[result.level];
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
        <p className="text-xs text-amber-800">{content.disclaimer}</p>
      </div>

      {!showResult && currentQ && (
        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          {/* Progress */}
          <div className="flex items-center gap-2">
            {questions?.map((_: any, i: number) => (
              <div key={i} className={`h-2 flex-1 rounded-full transition-colors ${i <= step ? 'bg-[#0F9B8E]' : 'bg-gray-200'}`} />
            ))}
          </div>
          <p className="text-xs text-gray-400">{content.questionLabel} {step + 1} / {questions.length}</p>

          <h2 className="font-display text-lg font-bold text-gray-900">
            {currentQ.text}
          </h2>

          <div className="space-y-3">
            {currentQ?.options?.map((opt: any, i: number) => (
              <button
                key={i}
                onClick={() => handleAnswer(opt?.score ?? 0)}
                className="w-full text-left px-5 py-4 bg-white rounded-xl border border-gray-200 hover:border-[#0F9B8E] hover:bg-[#0F9B8E]/5 transition-all text-sm font-medium text-gray-700 flex items-center justify-between group"
              >
                {opt.label}
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
                {resultCopy.title}
              </h2>
            </div>
            <p className={`text-sm ${result?.textColor}`}>
              {resultCopy.description}
            </p>
            <div className="mt-4 pt-4 border-t border-current/20">
              <h3 className={`text-sm font-bold ${result?.textColor}`}>
                {content.nextStepLabel}
              </h3>
              <p className={`text-sm mt-1 ${result?.textColor}`}>
                {resultCopy.nextStep}
              </p>
            </div>
          </div>

          {result?.level === 'emergency' && (
            <a href="tel:999" className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-red-600 text-white rounded-xl font-bold text-lg hover:bg-red-700 transition-colors">
              {content.callEmergency}
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
