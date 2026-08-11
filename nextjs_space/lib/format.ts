/**
 * Phoenix AI v2.0 — small presentation helpers shared across the v2 UI.
 * Pure functions, safe on server and client.
 */

import type { CaseStatus, Priority, Severity, CaseType } from './demo-data';

export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

export function formatRelative(iso: string, now: number = Date.now()): string {
  const t = new Date(iso).getTime();
  const diff = now - t;
  const day = 24 * 60 * 60 * 1000;
  if (diff < day) return 'Today';
  const days = Math.floor(diff / day);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return '1 week ago';
  if (weeks < 5) return `${weeks} weeks ago`;
  const months = Math.floor(days / 30);
  return months <= 1 ? '1 month ago' : `${months} months ago`;
}

export function caseTypeLabel(t: CaseType): string {
  return t
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** Tailwind class tuple for status pills. */
export function statusStyles(status: CaseStatus): { bg: string; text: string; dot: string; label: string } {
  switch (status) {
    case 'ACTIVE':
      return { bg: 'bg-primary/10', text: 'text-primary', dot: 'bg-primary', label: 'Active' };
    case 'MONITORING':
      return { bg: 'bg-secondary/15', text: 'text-secondary', dot: 'bg-secondary', label: 'Monitoring' };
    case 'REFERRED':
      return { bg: 'bg-blue-500/10', text: 'text-blue-600', dot: 'bg-blue-500', label: 'Referred' };
    case 'HEALED':
      return { bg: 'bg-accent/10', text: 'text-accent', dot: 'bg-accent', label: 'Healed' };
  }
}

export function priorityStyles(priority: Priority): { bg: string; text: string; label: string } {
  switch (priority) {
    case 'CRITICAL':
      return { bg: 'bg-red-500/10', text: 'text-red-600', label: 'Critical' };
    case 'URGENT':
      return { bg: 'bg-amber-500/10', text: 'text-amber-600', label: 'Urgent' };
    case 'ROUTINE':
      return { bg: 'bg-muted', text: 'text-muted-foreground', label: 'Routine' };
  }
}

export function severityStyles(severity: Severity): { bg: string; text: string; label: string } {
  switch (severity) {
    case 'CRITICAL':
      return { bg: 'bg-red-500/10', text: 'text-red-600', label: 'Critical' };
    case 'SEVERE':
      return { bg: 'bg-orange-500/10', text: 'text-orange-600', label: 'Severe' };
    case 'MODERATE':
      return { bg: 'bg-amber-500/10', text: 'text-amber-600', label: 'Moderate' };
    case 'MILD':
      return { bg: 'bg-emerald-500/10', text: 'text-emerald-600', label: 'Mild' };
  }
}

export function confidenceLabel(confidence: number): 'High' | 'Moderate' | 'Low' {
  if (confidence >= 0.85) return 'High';
  if (confidence >= 0.75) return 'Moderate';
  return 'Low';
}
