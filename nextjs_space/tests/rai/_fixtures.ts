/**
 * Shared fixtures for the Responsible AI test suite. Not a test file itself
 * (excluded by the `*.test.ts` glob).
 */
import type {
  Interpretation,
  VisualObservation,
  Management,
} from '../../lib/ai/schemas/burn-wound-analysis';

export function field(interpretation: string, confidence: any = 'high') {
  return { observation: 'obs', interpretation, confidence, basis: ['b'] };
}

export function baseObservation(over: Partial<VisualObservation> = {}): VisualObservation {
  return {
    imageQualityAdequate: true,
    imageQualityIssues: [],
    imageQualityNote: 'clear',
    anatomicalLocation: 'left forearm',
    observedSkinTone: 'light brown',
    visibleFindings: ['erythema', 'blistering'],
    scalePresent: false,
    notes: '',
    ...over,
  };
}

export function baseInterpretation(over: Partial<Interpretation> = {}): Interpretation {
  return {
    woundCategory: field('Burn'),
    woundType: 'Scald',
    isBurn: true,
    burnMechanism: field('Scald'),
    burnDepth: field('Superficial partial thickness'),
    tissueComposition: field('N/A'),
    exudate: field('Scant'),
    infectionSigns: field('None', 'low'),
    edgesAndPeriwound: field('Defined'),
    severity: 'Moderate',
    visualExtent: 'small area',
    measuredDimensions: '5 x 4 cm',
    tbsaEstimate: 5,
    tbsaSeverityClass: 'N/A',
    tbsaRange: '4-6%',
    tbsaMethod: 'Palm method',
    tbsaBodyRegions: 'Left forearm',
    tbsaAssumptions: [],
    tbsaLimitations: [],
    reportedFitzpatrickType: 'Type V',
    skinToneInterpretationNote: 'note',
    ...over,
  };
}

export function baseManagement(over: Partial<Management> = {}): Management {
  return {
    firstAid: 'Cool with running water',
    woundCare: 'Non-adherent dressing',
    dressing: 'Silver',
    referralLevel: 'routine',
    referralCriteria: 'GP follow-up',
    locationConsiderations: '',
    followUp: '48h',
    redFlags: ['spreading redness'],
    ...over,
  };
}

export const passingCritic = { pass: true, issues: [], recommendedCorrections: [] };
