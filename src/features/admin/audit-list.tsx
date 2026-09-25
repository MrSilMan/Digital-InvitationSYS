import Link from 'next/link';

import { cardClasses } from '@/components/dashboard/styles';
import { formatShortDateTime, toLuandaIso } from '@/i18n/format';
import { admin } from '@/i18n/pt-AO';
import { isAuditAction } from '@/lib/audit/actions';
import type { AuditScalar } from '@/lib/validation/audit';
import type { AuditEntryView } from '@/server/audit/queries';

const t = admin.audit;
const FIELDS: Record<string, string> = t.fields;
const VALUES: Record<string, string> = t.valueLabels;

function fieldLabel(key: string): string {
  return FIELDS[key] ?? key;
}

function formatValue(value: AuditScalar): string {
  if (value === null || value === '') return t.values.empty;
  if (typeof value === 'boolean') return value ? t.values.yes : t.values.no;
  if (typeof value === 'string') return VALUES[value] ?? value;
  return String(value);
}

function actionLabel(action: string): string {
  return isAuditAction(action) ? t.actions[action] : action;
}

function targetHref(target: AuditEntryView['target']): string | null {
  if (!target.exists || !target.id) return null;
  return target.type === 'event' ? `/admin/eventos/${target.id}` : `/admin/contas/${target.id}`;
}

/** Who did it: an admin, the command line, or an account deleted since. */
function Actor({ entry }: { entry: AuditEntryView }) {
  if (entry.actor) {
    return (
      <Link href={`/admin/contas/${entry.actor.id}`} className="underline-offset-2 hover:underline">
        {entry.actor.name}
      </Link>
    );
  }
  return <>{entry.metadata.details?.via === 'cli' ? t.commandLine : t.deletedAccount}</>;
}

/** Audit entries, newest first: what, on which event or account, who, when, and the details. */
export function AuditList({ entries }: { entries: AuditEntryView[] }) {
  if (entries.length === 0) {
    return <p className={`${cardClasses} p-5 text-sm text-stone-600`}>{t.empty}</p>;
  }
  return (
    <ol className={`${cardClasses} divide-y divide-stone-200`}>
      {entries.map((entry) => {
        const href = targetHref(entry.target);
        const changes = Object.entries(entry.metadata.changes ?? {});
        const details = Object.entries(entry.metadata.details ?? {}).filter(
          ([key]) => key !== 'via',
        );
        return (
          <li key={entry.id} className="flex flex-col gap-1 px-5 py-4">
            <p className="text-sm text-stone-900">
              <span className="font-medium">{actionLabel(entry.action)}</span>
              {entry.target.name ? (
                <>
                  {' · '}
                  <span className="text-stone-600">{t.targets[entry.target.type]}</span>{' '}
                  {href ? (
                    <Link href={href} className="font-medium underline-offset-2 hover:underline">
                      {entry.target.name}
                    </Link>
                  ) : (
                    <span>{entry.target.name}</span>
                  )}
                </>
              ) : null}
            </p>
            <p className="text-xs text-stone-600">
              <Actor entry={entry} /> ·{' '}
              <time dateTime={toLuandaIso(entry.createdAt)}>
                {formatShortDateTime(entry.createdAt)}
              </time>
            </p>
            {changes.length > 0 || details.length > 0 ? (
              <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-600">
                {changes.map(([key, change]) => (
                  <li key={`c-${key}`}>
                    {fieldLabel(key)}: {formatValue(change.from)} → {formatValue(change.to)}
                  </li>
                ))}
                {details.map(([key, value]) => (
                  <li key={`d-${key}`} className="break-all">
                    {fieldLabel(key)}: {formatValue(value)}
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
