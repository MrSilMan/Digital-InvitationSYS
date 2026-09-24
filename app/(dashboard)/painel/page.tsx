import type { Metadata } from 'next';
import Link from 'next/link';

import { buttonClasses, cardClasses } from '@/components/dashboard/styles';
import { formatLongDate } from '@/i18n/format';
import { dashboard } from '@/i18n/pt-AO';
import { fillTemplate } from '@/lib/template';
import { requireUser } from '@/server/auth/session';
import { listEditableEvents } from '@/server/events/queries';
import { getTheme } from '@/themes';

const t = dashboard.events;

export const metadata: Metadata = { title: t.title };

/** The events the signed-in couple can edit (every event for an admin). */
export default async function DashboardHomePage() {
  const user = await requireUser();
  const events = await listEditableEvents(user);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-semibold">{user.role === 'admin' ? t.titleAdmin : t.title}</h1>
      {events.length === 0 ? (
        <p className={`${cardClasses} mt-6 p-6 text-stone-600`}>{t.empty}</p>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {events.map((event) => (
            <li key={event.id} className={`${cardClasses} flex flex-col gap-4 p-6`}>
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
                <span className="rounded-full bg-stone-100 px-2.5 py-1 text-stone-700">
                  {t.phase[event.phase]}
                </span>
                {event.isActive ? null : (
                  <span className="rounded-full bg-red-50 px-2.5 py-1 text-red-700">
                    {t.inactive}
                  </span>
                )}
              </div>
              <div>
                <h2 className="font-serif text-2xl text-stone-900">
                  {event.groomName} &amp; {event.brideName}
                </h2>
                <p className="mt-1 text-sm text-stone-600">{formatLongDate(event.startsAt)}</p>
                <p className="text-sm text-stone-500">
                  {fillTemplate(t.theme, { theme: getTheme(event.themeId).name })}
                </p>
              </div>
              <Link
                href={`/painel/eventos/${event.id}`}
                className={buttonClasses('primary', 'md', 'self-start')}
              >
                {t.edit}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
