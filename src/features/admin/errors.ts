import { admin } from '@/i18n/pt-AO';
import { fillTemplate } from '@/lib/template';

import type { AdminActionError } from './types';

/** The message for a failed admin action. */
export function adminErrorText(result: Pick<AdminActionError, 'error' | 'suggestion' | 'count'>) {
  const t = admin.errors;
  switch (result.error) {
    case 'slug-taken':
      return fillTemplate(t['slug-taken'], { suggestion: result.suggestion ?? '' });
    case 'limit-below-guests':
      return fillTemplate(t['limit-below-guests'], { count: String(result.count ?? 0) });
    default:
      return t[result.error];
  }
}

/** Server-side field problems as React Hook Form errors ("owner.email" → that field). */
export function applyFieldIssues<Path extends string>(
  result: AdminActionError,
  setError: (path: Path, error: { type: string; message: string }) => void,
  paths: readonly Path[],
): void {
  for (const issue of result.issues ?? []) {
    if ((paths as readonly string[]).includes(issue.path)) {
      setError(issue.path as Path, { type: 'server', message: issue.message });
    }
  }
}
