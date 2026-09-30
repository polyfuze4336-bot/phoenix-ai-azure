'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle, Phone } from 'lucide-react';
import { useLanguage } from '@/components/language-provider';
import { localizedContent } from '@/lib/i18n/index';
import { ingestImage, type NormalizedImage } from '@/lib/images/ingest-image';
import { classifyCommunityBurn, type Answer, type BurnAnswers, type BurnCause } from '@/lib/clinical/community-burn';

const causes: BurnCause[] = ['flame', 'scald', 'contact', 'chemical', 'electrical', 'other', 'unsure', 'sun'];
const symptoms = ['shortnessOfBreath', 'chestPain', 'dizziness', 'blurredVision', 'tinnitus', 'blast', 'lossOfConsciousness', 'faceOrEyes'] as const;
const initialAnswers: BurnAnswers = {
  cause: 'unsure', sizeScore: -1, appearanceScore: -1, painScore: -1,
  shortnessOfBreath: 'unsure', chestPain: 'unsure', dizziness: 'unsure',
  blurredVision: 'unsure', tinnitus: 'unsure', blast: 'unsure',
  lossOfConsciousness: 'unsure', faceOrEyes: 'unsure',
};

export function AssessmentClient() {
  const { t, lang } = useLanguage();
  const content = localizedContent(lang).community;
  const copy = content.burnAssessment;
  const [stage, setStage] = useState<'questions' | 'photo' | 'result'>('questions');
  const [answers, setAnswers] = useState<BurnAnswers>(initialAnswers);
  const [causeSelected, setCauseSelected] = useState(false);
  const [documented, setDocumented] = useState<Partial<Record<typeof symptoms[number], boolean>>>({});
  const [photo, setPhoto] = useState<NormalizedImage | null>(null);
  const [imageError, setImageError] = useState(false);
  const [ingesting, setIngesting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [observation, setObservation] = useState<{ language: string; text: string } | null>(null);
  const result = classifyCommunityBurn(answers);

  const selectQuestion = (label: string, key: 'sizeScore' | 'appearanceScore' | 'painScore', index: number) => (
    <label className="block space-y-1 text-sm font-medium text-gray-800" key={key}>
      <span>{label}</span>
      <select required value={answers[key] < 0 ? '' : content.assessment.questions[index].options.findIndex((option) => option.score === answers[key])} onChange={(event) => {
        const chosen = content.assessment.questions[index].options[Number(event.target.value)];
        setAnswers({ ...answers, [key]: chosen.score });
      }} className="w-full min-w-0 rounded-xl border border-gray-200 bg-white p-3 text-gray-800">
        <option value="" disabled>{copy.select}</option>
        {content.assessment.questions[index].options.map((option, i) =>
          <option key={i} value={i}>{option.label}</option>)}
      </select>
    </label>
  );

  const onPhoto = async (file?: File) => {
    if (!file) return;
    setImageError(false);
    setPhoto(null);
    setIngesting(true);
    try {
      const ingested = await ingestImage(file);
      if (ingested.ok) setPhoto(ingested.image);
      else setImageError(true);
    } catch {
      setImageError(true);
    } finally {
      setIngesting(false);
    }
  };

  const onAssess = async () => {
    setBusy(true);
    setObservation(null);
    if (photo) {
      try {
        const response = await fetch('/api/community-burn', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            language: lang, answers, image: photo.base64, mimeType: photo.mimeType,
          }),
        });
        if (!response.ok) throw new Error('image unavailable');
        const data = await response.json();
        if (typeof data.observation === 'string') setObservation({ language: lang, text: data.observation });
        else setImageError(true);
      } catch {
        setImageError(true);
      }
    }
    setBusy(false);
    setStage('result');
  };

  return (
    <div className="mx-auto max-w-2xl min-w-0 space-y-6 pb-10">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900 md:text-3xl">{copy.intro}</h1>
        <p className="mt-1 text-sm text-gray-500">{t('community.assessment_desc')}</p>
      </div>
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
        <p>{copy.disclaimer}</p>
      </div>

      {stage === 'questions' && (
        <form onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setStage('photo'); }}
          className="space-y-5 rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="font-display text-lg font-bold text-gray-900">{copy.questionnaire}</h2>
          <label className="block space-y-1 text-sm font-medium text-gray-800">
            <span>{copy.mechanism}</span>
            <select required value={causeSelected ? answers.cause : ''}
              onChange={(event) => { setAnswers({ ...answers, cause: event.target.value as BurnCause }); setCauseSelected(true); }}
              className="w-full min-w-0 rounded-xl border border-gray-200 bg-white p-3">
              <option value="" disabled>{copy.select}</option>
              {causes.map((cause) => <option key={cause} value={cause}>{copy.causes[cause]}</option>)}
            </select>
          </label>
          <label className="block space-y-1 text-sm font-medium text-gray-800">
            <span>{copy.age}</span>
            <input type="number" min="0" required inputMode="numeric"
              className="w-full rounded-xl border border-gray-200 p-3" />
          </label>
          <label className="block space-y-1 text-sm font-medium text-gray-800">
            <span>{copy.time}</span>
            <input type="number" min="0" step="any" required inputMode="decimal" placeholder={copy.hours}
              className="w-full rounded-xl border border-gray-200 p-3" />
          </label>
          {selectQuestion(content.assessment.questions[1].text, 'sizeScore', 1)}
          {selectQuestion(content.assessment.questions[2].text, 'appearanceScore', 2)}
          {selectQuestion(content.assessment.questions[3].text, 'painScore', 3)}
          {symptoms.map((symptom) => (
            <fieldset key={symptom} className="min-w-0 rounded-xl border border-gray-200 p-3">
              <legend className="px-1 text-sm font-semibold text-gray-800">{copy.symptoms[symptom]}</legend>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {(['yes', 'no', 'unsure'] as Answer[]).map((value) => (
                  <label key={value} className="flex min-h-9 items-center gap-2 text-sm text-gray-700">
                    <input type="radio" name={symptom} value={value} required
                      checked={answers[symptom] === value && (documented[symptom] ?? false)}
                      onChange={() => {
                        setAnswers({ ...answers, [symptom]: value });
                        setDocumented({ ...documented, [symptom]: true });
                      }} />
                    {copy[value]}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
          <button type="submit" className="w-full rounded-xl bg-[#8B0000] px-5 py-3 font-semibold text-white">
            {copy.continue}
          </button>
        </form>
      )}

      {stage === 'photo' && (
        <div className="space-y-5 rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="font-display text-lg font-bold text-gray-900">{copy.uploadPrompt}</h2>
          {result.disposition === 'emergency' && (
            <a href="tel:999" className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-red-700 px-4 py-3 text-lg font-bold text-white">
              <Phone className="h-5 w-5" />{copy.emergency}
            </a>
          )}
          <label className="block space-y-2 text-sm font-semibold text-gray-800">
            <span>{copy.uploadLabel}</span>
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif"
              onChange={(event) => void onPhoto(event.target.files?.[0])}
              className="block w-full min-w-0 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-[#8B0000]/10 file:px-3 file:py-2 file:text-[#8B0000]" />
          </label>
          {photo && <button type="button" onClick={() => setPhoto(null)} className="text-sm font-semibold text-[#8B0000]">{copy.removePhoto}</button>}
          {imageError && <p role="alert" className="text-sm text-red-700">{copy.imageError}</p>}
          <button type="button" disabled={busy || ingesting} onClick={() => void onAssess()}
            className="w-full rounded-xl bg-[#8B0000] px-5 py-3 font-semibold text-white disabled:opacity-50">
            {busy ? copy.analysing : copy.analyse}
          </button>
        </div>
      )}

      {stage === 'result' && (
        <div className="space-y-4">
          <div className={`rounded-xl border p-5 ${result.classification === 'minor' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            <div className="flex items-center gap-2">
              {result.classification === 'minor' ? <CheckCircle className="h-6 w-6 text-green-700" /> : <AlertTriangle className="h-6 w-6 text-red-700" />}
              <h2 className="font-display text-xl font-bold text-gray-900">
                {result.classification === 'indeterminate' ? copy.indeterminate : copy[result.classification]}
              </h2>
            </div>
            {result.disposition === 'emergency' && (
              <a href="tel:999" className="mt-4 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-red-700 px-4 py-3 text-lg font-bold text-white">
                <Phone className="h-5 w-5" />{copy.emergency}
              </a>
            )}
            <h3 className="mt-4 text-sm font-bold text-gray-900">{content.assessment.nextStepLabel}</h3>
            <p className="mt-1 text-sm text-gray-800">{result.disposition === 'clinic'
              ? answers.blurredVision === 'unsure' || answers.faceOrEyes === 'unsure' ? copy.urgentClinic : copy.clinic
              : copy.hospital}</p>
            <p className="mt-4 text-sm text-gray-700">
              {result.classification === 'indeterminate' ? copy.indeterminateExplanation : copy.explanation}
            </p>
          </div>
          {observation?.language === lang && <p className="rounded-xl border bg-white p-4 text-sm text-gray-700">
            <strong>{copy.imageNote}: </strong>{observation.text}
          </p>}
          {imageError && <p role="status" className="text-sm text-amber-800">{copy.imageUnavailable}</p>}
          <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{copy.limitations}</p>
          <Link href="/community/first-aid" className="flex min-h-12 items-center justify-center rounded-xl bg-[#8B0000] px-5 py-3 font-bold text-white">
            {copy.firstAidTips}
          </Link>
          <p className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-700">{copy.professionalNotice}</p>
        </div>
      )}
    </div>
  );
}
