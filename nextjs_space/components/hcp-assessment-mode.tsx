'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  DEFAULT_ASSESSMENT_TYPE,
  isAssessmentType,
  type AssessmentType,
} from '@/lib/assessment-type';

const STORAGE_KEY = 'phoenix-ai-hcp-assessment-type';

interface HcpAssessmentModeValue {
  assessmentType: AssessmentType;
  setAssessmentType: (value: AssessmentType) => void;
}

const HcpAssessmentModeContext = createContext<HcpAssessmentModeValue | null>(null);

export function HcpAssessmentModeProvider({ children }: { children: ReactNode }) {
  const [assessmentType, setAssessmentTypeState] = useState<AssessmentType>(DEFAULT_ASSESSMENT_TYPE);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isAssessmentType(stored)) setAssessmentTypeState(stored);
  }, []);

  const value = useMemo<HcpAssessmentModeValue>(() => ({
    assessmentType,
    setAssessmentType(next) {
      setAssessmentTypeState(next);
      window.localStorage.setItem(STORAGE_KEY, next);
    },
  }), [assessmentType]);

  return <HcpAssessmentModeContext.Provider value={value}>{children}</HcpAssessmentModeContext.Provider>;
}

export function useHcpAssessmentMode(): HcpAssessmentModeValue {
  const value = useContext(HcpAssessmentModeContext);
  if (!value) throw new Error('useHcpAssessmentMode must be used within HcpAssessmentModeProvider');
  return value;
}
