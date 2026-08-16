'use client';

import { AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/components/language-provider';
import { cn } from '@/lib/utils';

export function ClinicalAiNotice({ className }: { className?: string }) {
  const { t } = useLanguage();

  return (
    <div
      className={cn('rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950', className)}
      role="note"
      aria-label={t('clinical_notice.label')}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
        <div className="space-y-2 text-xs leading-relaxed">
          <p>
            <strong>{t('clinical_notice.patient_data_title')}</strong>{' '}
            {t('clinical_notice.patient_data_body')}
          </p>
          <p>
            <strong>{t('clinical_notice.clinical_use_title')}</strong>{' '}
            {t('clinical_notice.clinical_use_body')}
          </p>
        </div>
      </div>
    </div>
  );
}