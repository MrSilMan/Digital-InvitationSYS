import {
  IconCalendarPlus,
  IconChecklist,
  IconDownload,
  IconEye,
  IconEyeOff,
  IconKey,
  IconLink,
  IconMessage,
  IconPencil,
  IconPhoto,
  IconSend,
  IconShieldCheck,
  IconTrash,
  IconUpload,
  IconUserCheck,
  IconUserEdit,
  IconUserMinus,
  IconUserOff,
  IconUserPlus,
  IconUsers,
  IconUsersPlus,
  IconUserX,
  type TablerIcon,
} from '@tabler/icons-react';
import Link from 'next/link';

import { EmptyState } from '@/components/dashboard/page-parts';
import { formatLongDate, formatShortDateTime, formatTime, toLuandaIso } from '@/i18n/format';
import { admin } from '@/i18n/pt-AO';
import { type AuditAction, isAuditAction } from '@/lib/audit/actions';
import { cn } from '@/lib/cn';
import { luandaDaysBetween, toLuandaDateInput } from '@/lib/luanda-time';
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

type Tone = 'good' | 'bad' | 'warn' | 'neutral';

const TONES: Record<Tone, string> = {
  good: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  bad: 'bg-red-50 text-red-700 ring-red-200',
  warn: 'bg-amber-50 text-amber-700 ring-amber-200',
  neutral: 'bg-stone-100 text-stone-600 ring-stone-200',
};

/** What each action looks like in the list: an icon, and a colour for what it does. */
const LOOKS: Record<AuditAction, [TablerIcon, Tone]> = {
  'event.create': [IconCalendarPlus, 'good'],
  'event.activate': [IconEye, 'good'],
  'event.deactivate': [IconEyeOff, 'bad'],
  'event.guest-limit': [IconUsersPlus, 'neutral'],
  'event.delete': [IconTrash, 'bad'],
  'user.create': [IconUserPlus, 'good'],
  'user.update': [IconUserEdit, 'neutral'],
  'user.password-reset': [IconKey, 'warn'],
  'user.suspend': [IconUserOff, 'bad'],
  'user.unsuspend': [IconUserCheck, 'good'],
  'user.promote': [IconShieldCheck, 'warn'],
  'user.delete': [IconUserX, 'bad'],
  'event.edit': [IconPencil, 'neutral'],
  'event.invite-message': [IconMessage, 'neutral'],
  'media.upload': [IconPhoto, 'neutral'],
  'media.delete': [IconPhoto, 'bad'],
  'media.reorder': [IconPhoto, 'neutral'],
  'media.describe': [IconPhoto, 'neutral'],
  'media.retry': [IconPhoto, 'neutral'],
  'guest.create': [IconUserPlus, 'neutral'],
  'guest.update': [IconUserEdit, 'neutral'],
  'guest.delete': [IconUserMinus, 'bad'],
  'guest.renew-link': [IconLink, 'neutral'],
  'guest.mark-sent': [IconSend, 'neutral'],
  'guest.answer': [IconChecklist, 'neutral'],
  'guest.import': [IconUpload, 'neutral'],
  'guest.export': [IconDownload, 'warn'],
};

function lookOf(action: string): [TablerIcon, Tone] {
  return isAuditAction(action) ? LOOKS[action] : [IconUsers, 'neutral'];
}

function targetHref(target: AuditEntryView['target']): string | null {
  if (!target.exists || !target.id) return null;
  return target.type === 'event' ? `/admin/eventos/${target.id}` : `/admin/contas/${target.id}`;
}

/** "Hoje", "Ontem", else the date in words (Luanda days). */
function dayLabel(date: Date, now: Date): string {
  const days = luandaDaysBetween(date, now);
  if (days === 0) return t.days.today;
  if (days === 1) return t.days.yesterday;
  const text = formatLongDate(date);
  return text.charAt(0).toLocaleUpperCase('pt-AO') + text.slice(1);
}

/** Consecutive entries of the same Luanda day (the entries come newest first). */
function byDay(entries: AuditEntryView[]): { day: string; entries: AuditEntryView[] }[] {
  const groups: { day: string; entries: AuditEntryView[] }[] = [];
  for (const entry of entries) {
    const day = toLuandaDateInput(entry.createdAt);
    const last = groups.at(-1);
    if (last?.day === day) last.entries.push(entry);
    else groups.push({ day, entries: [entry] });
  }
  return groups;
}

/** Who did it: an admin, the command line, or an account deleted since. */
function Actor({ entry }: { entry: AuditEntryView }) {
  if (entry.actor) {
    return (
      <Link
        href={`/admin/contas/${entry.actor.id}`}
        className="font-medium text-stone-700 underline-offset-2 hover:underline"
      >
        {entry.actor.name}
      </Link>
    );
  }
  return <>{entry.metadata.details?.via === 'cli' ? t.commandLine : t.deletedAccount}</>;
}

interface AuditListProps {
  entries: AuditEntryView[];
  /** Today, for the "Hoje" / "Ontem" headings. */
  now: Date;
  /** The days' heading level: under the page's `<h1>`, or under a panel's `<h2>`. */
  headingLevel?: 2 | 3;
}

/**
 * Audit entries by day, newest first: what, on which event or account, who, when, and the
 * details. Unframed: the page puts it in a card or a panel.
 */
export function AuditList({ entries, now, headingLevel = 2 }: AuditListProps) {
  if (entries.length === 0) {
    return (
      <EmptyState icon={<IconChecklist size={24} stroke={1.5} aria-hidden="true" />}>
        {t.empty}
      </EmptyState>
    );
  }
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  return (
    <div className="flex flex-col">
      {byDay(entries).map((group) => (
        <section
          key={group.day}
          aria-labelledby={`dia-${group.day}`}
          className="border-t border-stone-200 first:border-t-0"
        >
          <Heading
            id={`dia-${group.day}`}
            className="border-b border-stone-200 bg-stone-50 px-5 py-2 text-xs font-semibold text-stone-600"
          >
            {dayLabel(group.entries[0]?.createdAt ?? now, now)}
          </Heading>
          <ol className="divide-y divide-stone-100">
            {group.entries.map((entry) => {
              const href = targetHref(entry.target);
              const [Icon, tone] = lookOf(entry.action);
              const changes = Object.entries(entry.metadata.changes ?? {});
              const details = Object.entries(entry.metadata.details ?? {}).filter(
                ([key]) => key !== 'via',
              );
              return (
                <li key={entry.id} className="flex gap-3 px-5 py-4">
                  <span
                    aria-hidden="true"
                    className={cn(
                      'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full ring-1 ring-inset',
                      TONES[tone],
                    )}
                  >
                    <Icon size={16} stroke={1.75} />
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                      <p className="min-w-0 text-sm text-stone-900">
                        <span className="font-medium">{actionLabel(entry.action)}</span>
                        {entry.target.name ? (
                          <>
                            {' · '}
                            <span className="text-stone-600">
                              {t.targets[entry.target.type]}
                            </span>{' '}
                            {href ? (
                              <Link
                                href={href}
                                className="font-medium wrap-break-word underline decoration-stone-300 underline-offset-2 hover:decoration-stone-900"
                              >
                                {entry.target.name}
                              </Link>
                            ) : (
                              <span className="wrap-break-word">{entry.target.name}</span>
                            )}
                          </>
                        ) : null}
                      </p>
                      <time
                        dateTime={toLuandaIso(entry.createdAt)}
                        title={formatShortDateTime(entry.createdAt)}
                        className="shrink-0 text-xs text-stone-600 tabular-nums"
                      >
                        {formatTime(entry.createdAt)}
                      </time>
                    </div>
                    <p className="text-xs text-stone-600">
                      <Actor entry={entry} />
                    </p>
                    {changes.length > 0 || details.length > 0 ? (
                      <ul className="mt-1 flex flex-wrap gap-1.5">
                        {changes.map(([key, change]) => (
                          <li
                            key={`c-${key}`}
                            className="rounded-md bg-stone-100 px-2 py-0.5 text-xs text-stone-700"
                          >
                            {fieldLabel(key)}: {formatValue(change.from)} → {formatValue(change.to)}
                          </li>
                        ))}
                        {details.map(([key, value]) => (
                          <li
                            key={`d-${key}`}
                            className="rounded-md bg-stone-100 px-2 py-0.5 text-xs break-all text-stone-700"
                          >
                            {fieldLabel(key)}: {formatValue(value)}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
