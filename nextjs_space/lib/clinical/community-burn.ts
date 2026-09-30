export type Answer = 'yes' | 'no' | 'unsure';
export type BurnCause = 'flame' | 'scald' | 'contact' | 'chemical' | 'electrical' | 'other' | 'unsure' | 'sun';
export type BurnAnswers = {
  cause: BurnCause;
  sizeScore: number;
  appearanceScore: number;
  painScore: number;
  shortnessOfBreath: Answer;
  chestPain: Answer;
  dizziness: Answer;
  blurredVision: Answer;
  tinnitus: Answer;
  blast: Answer;
  lossOfConsciousness: Answer;
  faceOrEyes: Answer;
};
export type BurnDisposition = 'clinic' | 'hospital' | 'emergency';
export type BurnResult = { classification: 'minor' | 'major' | 'indeterminate'; disposition: BurnDisposition };

// These are the existing Community Self-Assessment question scores and result thresholds.
const causeScores: Partial<Record<BurnCause, number>> = {
  scald: 1, flame: 2, chemical: 3, electrical: 4, sun: 1,
};

export function classifyCommunityBurn(a: BurnAnswers): BurnResult {
  const causeScore = causeScores[a.cause];
  const validScore = causeScore !== undefined &&
    [0, 1, 2, 4].includes(a.sizeScore) &&
    [0, 2, 4].includes(a.appearanceScore) &&
    [0, 1, 2, 3].includes(a.painScore);
  const score = validScore ? causeScore! + a.sizeScore + a.appearanceScore + a.painScore : null;
  const emergency =
    a.shortnessOfBreath === 'yes' ||
    a.chestPain === 'yes' ||
    a.lossOfConsciousness === 'yes' ||
    (a.chestPain === 'unsure' && a.cause === 'electrical') ||
    (a.dizziness === 'yes' && a.cause === 'electrical') ||
    (score !== null && score >= 8);
  if (emergency) return { classification: 'major', disposition: 'emergency' };

  const hospital =
    a.cause === 'electrical' || a.cause === 'chemical' ||
    a.shortnessOfBreath === 'unsure' || a.chestPain === 'unsure' ||
    a.dizziness === 'yes' || a.blurredVision === 'yes' ||
    a.lossOfConsciousness === 'unsure' ||
    a.blast !== 'no' || a.faceOrEyes === 'yes' ||
    (a.faceOrEyes === 'unsure' && (a.cause === 'chemical' || a.cause === 'electrical')) ||
    (a.blurredVision === 'unsure' && (a.cause === 'chemical' || a.cause === 'electrical')) ||
    (a.tinnitus === 'yes' && (a.dizziness === 'yes' || a.blast === 'yes'));
  if (hospital) return { classification: 'major', disposition: 'hospital' };

  if (score === null) {
    return { classification: 'indeterminate', disposition: 'clinic' };
  }
  if (score > 3) return { classification: 'major', disposition: 'hospital' };
  return { classification: 'minor', disposition: 'clinic' };
}
