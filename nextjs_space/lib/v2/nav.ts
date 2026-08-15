/**
 * Phoenix AI v2.0 — navigation configuration for PhoenixV2Shell.
 *
 * Nav entries are filtered by feature flags at render time so a disabled feature
 * hides its entry entirely (no dead links). Icons are Lucide component names,
 * resolved in the shell.
 */

import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  FolderOpen,
  ScanLine,
  MessagesSquare,
  BookOpenText,
  Calculator,
  FileText,
  BarChart3,
  HeartHandshake,
  ShieldCheck,
} from 'lucide-react';
import type { FeatureFlagKey } from './feature-flags';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** When set, the item only renders if this feature flag is enabled. */
  requiresFlag?: FeatureFlagKey;
  /** Match sub-routes for active state. */
  matchPrefix?: boolean;
}

export const V2_HCP_NAV: NavItem[] = [
  { label: 'Overview', href: '/v2/hcp', icon: LayoutDashboard },
  { label: 'Cases', href: '/v2/hcp/cases', icon: FolderOpen, requiresFlag: 'cases', matchPrefix: true },
  { label: 'New Assessment', href: '/v2/hcp/analysis', icon: ScanLine },
  { label: 'AI Assistant', href: '/v2/hcp/chat', icon: MessagesSquare },
  { label: 'Guidelines', href: '/v2/hcp/guidelines', icon: BookOpenText },
  { label: 'Calculators', href: '/v2/hcp/calculators', icon: Calculator },
  { label: 'AI Assurance', href: '/v2/hcp/ai-assurance', icon: ShieldCheck, matchPrefix: true },
  { label: 'Reports', href: '/v2/hcp/reports', icon: FileText, requiresFlag: 'reports' },
  { label: 'Insights', href: '/v2/hcp/insights', icon: BarChart3, requiresFlag: 'insights' },
];

export const V2_COMMUNITY_NAV: NavItem[] = [
  { label: 'Home', href: '/v2/community', icon: HeartHandshake },
  { label: 'Self Assessment', href: '/v2/community/assessment', icon: ScanLine },
  { label: 'Image Check', href: '/v2/community/image-check', icon: ScanLine },
  { label: 'Ask Phoenix', href: '/v2/community/chat', icon: MessagesSquare },
  { label: 'First Aid', href: '/v2/community/first-aid', icon: BookOpenText },
  { label: 'Education', href: '/v2/community/education', icon: BookOpenText },
];
