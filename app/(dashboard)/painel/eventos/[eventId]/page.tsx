import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { buttonClasses, cardClasses } from '@/components/dashboard/styles';
import { GroupFilter } from '@/features/dashboard/overview/group-filter';
import { formatShortDateTime } from '@/i18n/format';
import { guests, overview } from '@/i18n/pt-AO';
import { cn } from '@/lib/cn';
import { type GuestFilters, guestFilterQuery, parseGuestFilters } from '@/lib/guests/filters';
import { fillTemplate } from '@/lib/template';
import { requireEditableEvent } from '@/server/events/access';
import { loadOverview } from '@/server/guests/overview';

const t = overview;

export const metadata: Metadata = { title: t.title };

interface Card {
  label: string;
  value: number;
  detail?: string;
  /** Which guests the card counts (a link to the filtered list). */
  filter: Partial<GuestFilters>;
  tone?: 'good' | 'bad' | 'warn';
}

const TONES = {
  good: 'text-emerald-700',
  bad: 'text-red-700',
  warn: 'text-amber-700',
} as const;

/** The event's overview: who was invited, who opened, who answered, and their messages. */
export default async function OverviewPage({
  params,
  searchParams,
}: PageProps<'/painel/eventos/[eventId]'>) {
  const { eventId } = await params;
  const { event } = await requireEditableEvent(eventId);
  const { group } = parseGuestFilters(await searchParams);
  const data = await loadOverview(event.id, group);
  if (!data) notFound();
  const { stats } = data;
  const guestsHref = `/painel/eventos/${event.id}/convidados`;

  const cards: Card[] = [
    {
      label: t.cards.invited,
      value: stats.invited,
      detail: fillTemplate(t.cards.invitedOf, { limit: String(data.guestLimit) }),
      filter: {},
    },
    { label: t.cards.sent, value: stats.sent, filter: { invite: 'sent' } },
    { label: t.cards.opened, value: stats.opened, filter: { invite: 'opened' } },
    {
      label: t.cards.confirmed,
      value: stats.confirmed,
      filter: { answer: 'confirmed' },
      tone: 'good',
    },
    { label: t.cards.declined, value: stats.declined, filter: { answer: 'declined' }, tone: 'bad' },
    {
      label: t.cards.whatsapp,
      value: stats.whatsapp,
      detail: stats.whatsapp > 0 ? t.cards.whatsappHint : undefined,
      filter: { answer: 'whatsapp' },
      tone: 'warn',
    },
    { label: t.cards.pending, value: stats.pending, filter: { answer: 'pending' } },
    {
      label: t.cards.people,
      value: stats.people,
      detail: fillTemplate(t.cards.peopleOf, { seats: String(stats.seats) }),
      filter: { answer: 'confirmed' },
      tone: 'good',
    },
  ];

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        {data.groups.length > 0 ? <GroupFilter groups={data.groups} value={group} /> : null}
      </div>

      {stats.invited === 0 && !group ? (
        <div className={`${cardClasses} flex flex-col items-start gap-4 p-6`}>
          <p className="text-stone-600">{t.empty}</p>
          <Link href={guestsHref} className={buttonClasses('primary')}>
            {t.addGuests}
          </Link>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {cards.map((card) => (
            <li key={card.label}>
              <Link
                href={`${guestsHref}${guestFilterQuery({ ...card.filter, group })}`}
                className={cn(
                  cardClasses,
                  'flex h-full flex-col gap-1 p-4 transition-colors hover:border-stone-400 focus-visible:outline-2 focus-visible:outline-stone-900',
                )}
              >
                <span className="text-sm text-stone-600">{card.label}</span>
                <span
                  className={cn(
                    'text-3xl font-semibold tabular-nums',
                    card.tone ? TONES[card.tone] : 'text-stone-900',
                  )}
                >
                  {card.value}
                </span>
                {card.detail ? <span className="text-xs text-stone-500">{card.detail}</span> : null}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <section aria-labelledby="mensagens" className="flex flex-col gap-3">
        <h2 id="mensagens" className="text-lg font-semibold">
          {t.messages.title}
        </h2>
        {data.messages.length === 0 ? (
          <p className={`${cardClasses} p-5 text-sm text-stone-600`}>{t.messages.empty}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {data.messages.map((message) => (
              <li key={message.guestId} className={`${cardClasses} p-5`}>
                <figure className="flex flex-col gap-2">
                  <blockquote className="font-serif text-lg whitespace-pre-line text-stone-800">
                    {message.message}
                  </blockquote>
                  <figcaption className="text-sm text-stone-600">
                    <span className="font-medium text-stone-900">{message.displayName}</span>
                    {' · '}
                    {message.answer === 'pending'
                      ? guests.filters.answers.pending
                      : guests.status[message.answer]}
                    {' · '}
                    {fillTemplate(t.messages.at, { date: formatShortDateTime(message.at) })}
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
