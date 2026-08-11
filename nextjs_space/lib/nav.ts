/**
 * Phoenix AI — navigation configuration for PhoenixShell.
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

export const HCP_NAV: NavItem[] = [
  { label: 'Overview', href: '/hcp', icon: LayoutDashboard },
  { label: 'Cases', href: '/hcp/cases', icon: FolderOpen, requiresFlag: 'cases', matchPrefix: true },
  { label: 'New Assessment', href: '/hcp/analysis', icon: ScanLine },
  { label: 'AI Assistant', href: '/hcp/chat', icon: MessagesSquare },
  { label: 'Guidelines', href: '/hcp/guidelines', icon: BookOpenText },
  { label: 'Calculators', href: '/hcp/calculators', icon: Calculator },
  { label: 'AI Assurance', href: '/hcp/ai-assurance', icon: ShieldCheck, matchPrefix: true },
  { label: 'Reports', href: '/hcp/reports', icon: FileText, requiresFlag: 'reports' },
  { label: 'Insights', href: '/hcp/insights', icon: BarChart3, requiresFlag: 'insights' },
];

export const COMMUNITY_NAV: NavItem[] = [
  { label: 'Home', href: '/community', icon: HeartHandshake },
  { label: 'Self Assessment', href: '/community/assessment', icon: ScanLine },
  { label: 'Ask Phoenix', href: '/community/chat', icon: MessagesSquare },
  { label: 'First Aid', href: '/community/first-aid', icon: BookOpenText },
  { label: 'Education', href: '/community/education', icon: BookOpenText },
];
