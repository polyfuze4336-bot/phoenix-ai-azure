/**
 * Phoenix AI — application version + experience metadata.
 *
 * The Original experience is v1; the enhanced experience is v2.0. `APP_VERSION`
 * is surfaced in the v2 shell footer and the experience selector. It can be
 * overridden at build/deploy time via NEXT_PUBLIC_APP_VERSION.
 */

export const APP_VERSION = (process.env.NEXT_PUBLIC_APP_VERSION ?? '2.0').trim();

export type ExperienceId = 'original' | 'v2';

export interface ExperienceMeta {
  id: ExperienceId;
  /** Human label shown on the selector. */
  label: string;
  /** Version tag shown as a badge. */
  version: string;
  /** Entry route. */
  href: string;
}

export const EXPERIENCES: Record<ExperienceId, ExperienceMeta> = {
  original: {
    id: 'original',
    label: 'Original Experience',
    version: 'v1 · Classic',
    href: '/hcp-login',
  },
  v2: {
    id: 'v2',
    label: 'Phoenix AI v2.0',
    version: `v${APP_VERSION} · Enhanced`,
    href: '/v2',
  },
};

/** Discreet marker shown across the v2 experience so synthetic data is never mistaken for real records. */
export const DEMO_ENVIRONMENT_LABEL = 'Demo Environment';
export const SYNTHETIC_DATA_LABEL = 'Synthetic demonstration data';
