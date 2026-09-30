import { z } from 'zod';
import { analysisQuality, confidenceLevel, visualObservationSchema } from './burn-wound-analysis';

const text = z.string().catch('');
const textArray = z.array(z.string()).catch([]);

export const timersSchema = z.object({
  tissueManagement: text,
  infectionInflammation: text,
  moistureImbalance: text,
  edgeOfWound: text,
  repairRegeneration: text,
  socialPatientFactors: text,
});

export const generalWoundAnalysisSchema = z.object({
  schemaVersion: z.literal('1.0').catch('1.0'),
  analysisQuality,
  imageQuality: z.object({
    adequate: z.boolean().catch(false),
    issues: textArray,
    note: text,
  }),
  observation: visualObservationSchema,
  fitzpatrickPhototype: text,
  woundCategory: text,
  woundCharacteristics: text,
  confidenceLevel,
  timers: timersSchema,
  managementRecommendations: z.object({
    woundCareProtocol: text,
    dressingRecommendations: text,
    referralCriteria: text,
    followUpSchedule: text,
  }),
  whyThisAssessment: textArray,
  visualExtent: text,
  measuredDimensions: text,
  redFlags: textArray,
  missingInformation: textArray,
  limitations: textArray,
  refinementOptions: textArray,
});

export type GeneralWoundAnalysis = z.infer<typeof generalWoundAnalysisSchema>;
