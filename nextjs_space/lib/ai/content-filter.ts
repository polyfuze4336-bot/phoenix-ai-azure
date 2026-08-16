export interface ContentFilterCategory {
  category: 'hate' | 'sexual' | 'self_harm' | 'violence';
  filtered?: boolean;
  severity?: 'safe' | 'low' | 'medium' | 'high';
}

export interface ContentFilterDetails {
  source: 'input' | 'output' | 'unknown';
  categories: ContentFilterCategory[];
}

const FILTER_CATEGORIES = ['hate', 'sexual', 'self_harm', 'violence'] as const;
const FILTER_SEVERITIES = new Set(['safe', 'low', 'medium', 'high']);

function findFilterResult(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const object = value as Record<string, unknown>;
  for (const key of ['content_filter_result', 'content_filter_results']) {
    if (object[key] && typeof object[key] === 'object') {
      return object[key] as Record<string, unknown>;
    }
  }
  for (const child of Object.values(object)) {
    const found = findFilterResult(child);
    if (found) return found;
  }
  return undefined;
}

function hasContentFilterCode(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (key === 'code' && typeof child === 'string' &&
      ['content_filter', 'ResponsibleAIPolicyViolation'].includes(child)) return true;
    if (hasContentFilterCode(child)) return true;
  }
  return false;
}

export function extractContentFilterDetails(
  value: unknown,
  source: ContentFilterDetails['source'],
): ContentFilterDetails | undefined {
  const filterResult = findFilterResult(value);
  const categories: ContentFilterCategory[] = [];
  if (filterResult) {
    for (const category of FILTER_CATEGORIES) {
      const raw = filterResult[category];
      if (!raw || typeof raw !== 'object') continue;
      const item = raw as Record<string, unknown>;
      const severity = typeof item.severity === 'string' && FILTER_SEVERITIES.has(item.severity)
        ? item.severity as ContentFilterCategory['severity']
        : undefined;
      categories.push({
        category,
        filtered: typeof item.filtered === 'boolean' ? item.filtered : undefined,
        severity,
      });
    }
  }
  if (!hasContentFilterCode(value) && !categories.some((category) => category.filtered)) return undefined;
  return { source, categories };
}
