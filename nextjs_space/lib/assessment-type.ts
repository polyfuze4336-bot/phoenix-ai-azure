export const ASSESSMENT_TYPES = ['acute_burn', 'general_wound'] as const;

export type AssessmentType = (typeof ASSESSMENT_TYPES)[number];

export const DEFAULT_ASSESSMENT_TYPE: AssessmentType = 'acute_burn';

export function isAssessmentType(value: unknown): value is AssessmentType {
  return typeof value === 'string' && ASSESSMENT_TYPES.includes(value as AssessmentType);
}

export function parseAssessmentType(value: unknown): AssessmentType | null {
  return isAssessmentType(value) ? value : null;
}
