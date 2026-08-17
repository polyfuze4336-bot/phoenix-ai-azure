/**
 * Parkland / Modified Brooke fluid-resuscitation calculation (pure).
 *
 * Extracted verbatim from the Parkland calculator UI so the exact clinical
 * formula is unit-testable without a browser. The numbers, splits and rounding
 * behaviour are unchanged from the original component — this is a faithful
 * migration, not a re-derivation.
 *
 * Formulae:
 *  - Parkland:        total 24h fluid = 4 mL x weight(kg) x TBSA(%)
 *  - Modified Brooke: total 24h fluid = 2 mL x weight(kg) x TBSA(%)
 *  - Split: 50% over the first 8 hours, 50% over the next 16 hours.
 *  - Urine output target: 1 mL/kg/hr for a child (<30 kg), else 0.5 mL/kg/hr.
 */

export type ResuscitationFormula = 'parkland' | 'brooke';
export type PatientCategory = 'adult' | 'child';
export type ParklandIndication = 'yes' | 'no' | 'uncertain';

export interface ParklandIndicationInput {
  isBurn: boolean;
  tbsaPercent: number | null;
  patientCategory?: PatientCategory;
}

export interface ParklandIndicationResult {
  indicated: ParklandIndication;
  thresholdPercent: number | null;
  reason: 'non_burn_or_zero' | 'category_required' | 'below_threshold' | 'at_or_above_threshold';
}

export interface ResuscitationInput {
  /** Patient weight in kilograms. */
  weightKg: number;
  /** Total body surface area burned, as a percentage (0-100). */
  tbsaPercent: number;
  /** Which resuscitation formula to apply. */
  formula: ResuscitationFormula;
}

export interface ResuscitationResult {
  /** Total fluid volume for the first 24 hours (mL). */
  total24h: number;
  /** Volume for the first 8 hours (mL). */
  first8h: number;
  /** Volume for the next 16 hours (mL). */
  next16h: number;
  /** Infusion rate for the first 8 hours (mL/hr). */
  rate8h: number;
  /** Infusion rate for the next 16 hours (mL/hr). */
  rate16h: number;
  /** Target hourly urine output (mL/hr). */
  urineTarget: number;
  /** True when the patient is treated as a child (<30 kg). */
  isChild: boolean;
}

export function determineParklandIndication(input: ParklandIndicationInput): ParklandIndicationResult {
  const { isBurn, tbsaPercent, patientCategory } = input;
  if (!isBurn || tbsaPercent == null || tbsaPercent <= 0) {
    return { indicated: 'no', thresholdPercent: null, reason: 'non_burn_or_zero' };
  }
  if (!patientCategory) {
    return { indicated: 'uncertain', thresholdPercent: null, reason: 'category_required' };
  }
  const thresholdPercent = patientCategory === 'child' ? 10 : 15;
  return tbsaPercent >= thresholdPercent
    ? { indicated: 'yes', thresholdPercent, reason: 'at_or_above_threshold' }
    : { indicated: 'no', thresholdPercent, reason: 'below_threshold' };
}

/**
 * Compute the resuscitation volumes. Returns `null` when either input is not a
 * positive number, matching the UI which shows no result until both are valid.
 */
export function calculateResuscitation(input: ResuscitationInput): ResuscitationResult | null {
  const { weightKg, tbsaPercent, formula } = input;
  if (!(weightKg > 0) || !(tbsaPercent > 0)) return null;

  const multiplier = formula === 'parkland' ? 4 : 2;
  const total24h = multiplier * weightKg * tbsaPercent;
  const first8h = total24h / 2;
  const next16h = total24h / 2;
  const rate8h = first8h / 8;
  const rate16h = next16h / 16;
  const urineTarget = weightKg < 30 ? 1 * weightKg : 0.5 * weightKg;
  const isChild = weightKg < 30;

  return { total24h, first8h, next16h, rate8h, rate16h, urineTarget, isChild };
}
