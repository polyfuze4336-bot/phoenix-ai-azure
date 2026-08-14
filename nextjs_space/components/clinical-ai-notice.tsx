'use client';

import { AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/components/language-provider';
import { cn } from '@/lib/utils';

export function ClinicalAiNotice({ className }: { className?: string }) {
  const { lang } = useLanguage();
  const bm = lang === 'bm';

  return (
    <div
      className={cn(
        'rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100',
        className,
      )}
      role="note"
      aria-label={bm ? 'Notis data pesakit dan sokongan keputusan klinikal' : 'Patient data and clinical decision-support notice'}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <div className="space-y-2 text-xs leading-relaxed">
          <p>
            <strong>{bm ? 'Data dan imej pesakit:' : 'Patient data and images:'}</strong>{' '}
            {bm
              ? 'Kendalikan hanya maklumat yang dibenarkan dan, jika boleh, dinyahpengenalan, selaras dengan Akta Perlindungan Data Peribadi 2010 (Akta 709), undang-undang Malaysia lain yang terpakai, serta kewajipan kerahsiaan profesional. Jangan muat naik pengecam yang tidak diperlukan.'
              : 'Handle only authorized and, where possible, de-identified information in accordance with Malaysia’s Personal Data Protection Act 2010 (Act 709), other applicable Malaysian laws, and professional confidentiality duties. Do not upload unnecessary identifiers.'}
          </p>
          <p>
            <strong>{bm ? 'Kegunaan klinikal:' : 'Clinical use:'}</strong>{' '}
            {bm
              ? 'Output AI adalah untuk sokongan keputusan klinikal sahaja. Ia bukan diagnosis dan tidak menggantikan pemeriksaan, pertimbangan profesional, atau eskalasi oleh profesional penjagaan kesihatan yang berkelayakan.'
              : 'AI output is for clinical decision support only. It is not a diagnosis and does not replace examination, professional judgement, or escalation by a qualified healthcare professional.'}
          </p>
        </div>
      </div>
    </div>
  );
}
