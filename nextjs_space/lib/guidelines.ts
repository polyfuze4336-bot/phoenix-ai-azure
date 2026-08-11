/**
 * Phoenix AI v2.0 — curated clinical guideline summaries for quick reference.
 *
 * General, widely-accepted burn & wound care guidance for demonstration and
 * education. Not a substitute for local protocols or clinical judgement.
 */

export interface GuidelineTopic {
  id: string;
  category: 'Assessment' | 'Resuscitation' | 'Wound Care' | 'Referral' | 'Infection';
  title: string;
  summary: string;
  points: string[];
}

export const GUIDELINE_TOPICS: GuidelineTopic[] = [
  {
    id: 'tbsa-estimation',
    category: 'Assessment',
    title: 'Estimating burn size (TBSA)',
    summary: 'Approaches to estimating total body surface area affected by burns.',
    points: [
      'Rule of Nines gives a rapid adult estimate; Lund & Browder is more accurate, especially in children.',
      'The patient’s palm (including fingers) approximates ~1% TBSA for small or patchy burns.',
      'Only include partial- and full-thickness burns in the TBSA estimate; exclude simple erythema.',
    ],
  },
  {
    id: 'burn-depth',
    category: 'Assessment',
    title: 'Assessing burn depth',
    summary: 'Distinguishing superficial, partial-thickness and full-thickness burns.',
    points: [
      'Superficial: red, painful, blanches, no blisters (e.g. sunburn).',
      'Superficial partial-thickness: blisters, moist, very painful, blanches.',
      'Deep partial-thickness: drier, less blanching, variable sensation.',
      'Full-thickness: leathery, white/charred, painless, non-blanching.',
    ],
  },
  {
    id: 'fluid-resuscitation',
    category: 'Resuscitation',
    title: 'Fluid resuscitation',
    summary: 'Initial crystalloid resuscitation for significant burns.',
    points: [
      'Consider formal resuscitation for adults with >15% TBSA (>10% in children).',
      'Parkland: 4 mL × weight(kg) × %TBSA over 24h; half in the first 8h from time of injury.',
      'Titrate to urine output (~0.5 mL/kg/hr adults, ~1 mL/kg/hr children).',
    ],
  },
  {
    id: 'first-aid',
    category: 'Wound Care',
    title: 'Immediate burn first aid',
    summary: 'The first minutes matter for outcome.',
    points: [
      'Cool the burn with running lukewarm water for 20 minutes; effective up to 3 hours after injury.',
      'Remove jewellery and non-adherent clothing; do not remove adherent material.',
      'Cover loosely with cling film or a clean, non-adherent dressing. Avoid ice and topical remedies.',
      'Keep the patient warm to avoid hypothermia while cooling the burn.',
    ],
  },
  {
    id: 'dressings',
    category: 'Wound Care',
    title: 'Dressing selection',
    summary: 'Matching dressings to wound characteristics.',
    points: [
      'Maintain a moist wound environment to support epithelialisation.',
      'Use antimicrobial dressings where infection risk is high; review regularly.',
      'Highly exudative wounds need absorbent dressings; dry wounds need hydration.',
    ],
  },
  {
    id: 'infection',
    category: 'Infection',
    title: 'Recognising wound infection',
    summary: 'Signs that warrant escalation.',
    points: [
      'Spreading erythema, warmth, swelling, increasing pain, purulent discharge, or odour.',
      'Systemic signs (fever, tachycardia) suggest sepsis — escalate urgently.',
      'Take swabs where clinically indicated and follow local antimicrobial guidance.',
    ],
  },
  {
    id: 'referral',
    category: 'Referral',
    title: 'Referral to a burns service',
    summary: 'Common criteria for specialist referral.',
    points: [
      'Burns to the face, hands, feet, perineum, genitalia, or major joints.',
      'Full-thickness burns, circumferential burns, or chemical/electrical burns.',
      'Large burns (>10% TBSA adult, >5% child), inhalation injury, or non-accidental injury concerns.',
    ],
  },
];

export const GUIDELINE_CATEGORIES = ['Assessment', 'Resuscitation', 'Wound Care', 'Infection', 'Referral'] as const;
