import { IconCalendarCheck, IconConfetti, IconUserHeart, IconUsers } from '@tabler/icons-react';

import { cardClasses } from '@/components/dashboard/styles';
import { LOCALE } from '@/i18n/format';
import { formatCount } from '@/i18n/plural';
import { admin } from '@/i18n/pt-AO';
import { cn } from '@/lib/cn';
import { fillTemplate } from '@/lib/template';
import type { AdminOverview } from '@/server/admin/queries';

const t = admin.overview;

/** The platform at a glance, above the event list. */
export function OverviewStats({ overview }: { overview: AdminOverview }) {
  const number = new Intl.NumberFormat(LOCALE);
  const tiles = [
    {
      Icon: IconCalendarCheck,
      label: t.active,
      value: overview.activeEvents,
      detail: fillTemplate(t.activeOf, { count: number.format(overview.events) }),
    },
    { Icon: IconConfetti, label: t.upcoming, value: overview.upcoming, detail: t.upcomingHint },
    { Icon: IconUsers, label: t.guests, value: overview.guests, detail: t.guestsHint },
    {
      Icon: IconUserHeart,
      label: t.couples,
      value: overview.couples,
      detail:
        overview.suspendedCouples > 0
          ? formatCount(overview.suspendedCouples, t.suspended)
          : t.noneSuspended,
    },
  ];

  return (
    <section aria-label={t.label}>
      <dl className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {tiles.map(({ Icon, label, value, detail }) => (
          <div key={label} className={cn(cardClasses, 'flex flex-col gap-3 p-4 sm:p-5')}>
            <dt className="flex items-center gap-2.5 text-sm font-medium text-stone-600">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-night text-gold">
                <Icon size={18} stroke={1.75} aria-hidden="true" />
              </span>
              {label}
            </dt>
            <dd className="flex flex-col gap-0.5">
              <span className="text-3xl font-semibold tracking-tight text-stone-900 tabular-nums">
                {number.format(value)}
              </span>
              <span className="text-xs text-stone-600">{detail}</span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
