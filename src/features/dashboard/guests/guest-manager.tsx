'use client';

import { IconDownload, IconFileImport, IconUserPlus } from '@tabler/icons-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Dialog } from '@/components/dashboard/dialog';
import { buttonClasses, cardClasses } from '@/components/dashboard/styles';
import { guests } from '@/i18n/pt-AO';
import {
  compareGuestNames,
  type GuestFilters,
  guestFilterQuery,
  guestGroups,
  matchesGuestFilters,
} from '@/lib/guests/filters';
import type { InviteContext } from '@/lib/guests/invite-message';
import { fillTemplate } from '@/lib/template';
import { EMPTY_GUEST, type GuestFormValues } from '@/lib/validation/guest';

import {
  addGuest,
  editGuest,
  markGuestSent,
  removeGuest,
  renewGuestLink,
  saveGuestAnswer,
} from './actions';
import { GuestDetails, type GuestDetailsActions } from './guest-details';
import { GuestFiltersBar } from './guest-filters';
import { GuestForm } from './guest-form';
import { GuestImport } from './guest-import';
import { GuestRow } from './guest-row';
import { listEventGuests } from './import-actions';
import { InviteMessageCard } from './invite-message-card';
import { SendMessage } from './send-message';
import type { GuestActionResult, GuestListItem } from './types';
import { toGuestFormValues } from './ui-helpers';

const t = guests;

type Open =
  | { kind: 'add' }
  | { kind: 'import' }
  | { kind: 'details'; id: string }
  | { kind: 'send'; id: string }
  | null;

/**
 * The guest list: filters (kept in the URL), adding, importing and editing guests, sending each
 * personal link by WhatsApp. Changes are saved at once by Server Actions; the list updates from
 * what the server returns.
 */
export function GuestManager({
  eventId,
  guestLimit,
  initialGuests,
  initialFilters,
  invite: initialInvite,
}: {
  eventId: string;
  guestLimit: number;
  initialGuests: GuestListItem[];
  initialFilters: GuestFilters;
  invite: InviteContext;
}) {
  const [list, setList] = useState(initialGuests);
  const [filters, setFilters] = useState(initialFilters);
  const [invite, setInvite] = useState(initialInvite);
  const [open, setOpen] = useState<Open>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');

  const groups = useMemo(() => guestGroups(list), [list]);
  const shown = useMemo(
    () => list.filter((guest) => matchesGuestFilters(guest, filters)).sort(compareGuestNames),
    [list, filters],
  );
  const current =
    open?.kind === 'details' || open?.kind === 'send'
      ? list.find((guest) => guest.id === open.id)
      : null;
  const full = list.length >= guestLimit;
  const filterQuery = guestFilterQuery(filters);

  // The filters live in the URL: a filtered list can be reloaded, bookmarked or linked to.
  useEffect(() => {
    const url = `${window.location.pathname}${filterQuery}`;
    if (url !== `${window.location.pathname}${window.location.search}`) {
      window.history.replaceState(window.history.state, '', url);
    }
  }, [filterQuery]);

  useEffect(() => {
    if (!copiedId) return;
    const timer = setTimeout(() => setCopiedId(null), 2500);
    return () => clearTimeout(timer);
  }, [copiedId]);

  const replace = useCallback((guest: GuestListItem) => {
    setList((items) => items.map((item) => (item.id === guest.id ? guest : item)));
  }, []);

  /** Keeps the list in step with an action that returns the updated guest. */
  const applying = useCallback(
    async (step: Promise<GuestActionResult<{ guest: GuestListItem }>>) => {
      const result = await step;
      if (result.ok) replace(result.guest);
      return result;
    },
    [replace],
  );

  const add = async (values: GuestFormValues) => {
    const result = await addGuest(eventId, values);
    if (!result.ok) return result;
    setList((items) => [...items, result.guest]);
    setOpen(null);
    setAnnouncement(fillTemplate(t.form.added, { name: result.guest.displayName }));
    return { ok: true as const, values: toGuestFormValues(result.guest) };
  };

  const detailsActions = (guest: GuestListItem): GuestDetailsActions => ({
    save: async (values) => {
      const result = await applying(editGuest(eventId, guest.id, values));
      return result.ok ? { ok: true, values: toGuestFormValues(result.guest) } : result;
    },
    saveAnswer: (values) => applying(saveGuestAnswer(eventId, guest.id, values)),
    markSent: (sent) => applying(markGuestSent(eventId, guest.id, sent)),
    renewLink: () => applying(renewGuestLink(eventId, guest.id)),
    remove: async () => {
      const result = await removeGuest(eventId, guest.id);
      if (result.ok || result.error === 'not-found') {
        setOpen(null);
        setList((items) => items.filter((item) => item.id !== guest.id));
      }
      return result;
    },
  });

  const copyLink = async (guest: GuestListItem) => {
    try {
      await navigator.clipboard.writeText(guest.link);
      setCopiedId(guest.id);
      setAnnouncement(t.row.copied);
    } catch {
      setAnnouncement(t.row.copyFailed);
    }
  };

  const markOpened = (guest: GuestListItem) => {
    setOpen(null);
    void applying(markGuestSent(eventId, guest.id, true)).catch(() => undefined);
  };

  /** After an import added guests: the whole list again (the dialog stays open on its report). */
  const reloadList = useCallback(() => {
    listEventGuests(eventId)
      .then((result) => {
        if (result.ok) setList(result.guests);
      })
      .catch(() => undefined);
  }, [eventId]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{t.title}</h1>
          <p className="mt-1 text-sm text-stone-600">
            {fillTemplate(t.count, { count: String(list.length), limit: String(guestLimit) })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setOpen({ kind: 'add' })}
            disabled={full}
            className={buttonClasses('primary')}
          >
            <IconUserPlus size={18} stroke={1.75} aria-hidden="true" />
            {t.add}
          </button>
          <button
            type="button"
            onClick={() => setOpen({ kind: 'import' })}
            disabled={full}
            className={buttonClasses('secondary')}
          >
            <IconFileImport size={18} stroke={1.75} aria-hidden="true" />
            {t.import.open}
          </button>
          <a
            href={`/painel/eventos/${eventId}/convidados/exportar${filterQuery}`}
            download
            className={buttonClasses('secondary')}
          >
            <IconDownload size={18} stroke={1.75} aria-hidden="true" />
            {t.exportCsv}
          </a>
        </div>
      </div>
      {full ? (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {fillTemplate(t.limitReached, { limit: String(guestLimit) })}
        </p>
      ) : null}

      <InviteMessageCard
        eventId={eventId}
        invite={invite}
        onSaved={(template) => setInvite((context) => ({ ...context, template }))}
      />

      <section aria-labelledby="lista-convidados" className={`${cardClasses} overflow-hidden`}>
        <h2 id="lista-convidados" className="sr-only">
          {t.title}
        </h2>
        <div className="border-b border-stone-200 px-4 py-4 sm:px-5">
          <GuestFiltersBar
            filters={filters}
            groups={groups}
            shown={shown.length}
            total={list.length}
            onChange={setFilters}
          />
        </div>
        {shown.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-stone-600">
            {list.length === 0 ? t.empty : t.filters.noMatches}
          </p>
        ) : (
          <ul className="divide-y divide-stone-200">
            {shown.map((guest) => (
              <GuestRow
                key={guest.id}
                guest={guest}
                copied={copiedId === guest.id}
                onSend={() => setOpen({ kind: 'send', id: guest.id })}
                onCopyLink={() => void copyLink(guest)}
                onDetails={() => setOpen({ kind: 'details', id: guest.id })}
              />
            ))}
          </ul>
        )}
      </section>
      <p role="status" className="sr-only">
        {announcement}
      </p>

      <Dialog
        open={open?.kind === 'add'}
        onClose={() => setOpen(null)}
        title={t.form.addTitle}
        closeLabel={t.details.close}
      >
        <GuestForm
          initialValues={EMPTY_GUEST}
          groups={groups}
          submitLabel={t.form.add}
          onSubmit={add}
          onCancel={() => setOpen(null)}
        />
      </Dialog>
      <Dialog
        open={open?.kind === 'import'}
        onClose={() => setOpen(null)}
        title={t.import.title}
        closeLabel={t.details.close}
      >
        <GuestImport eventId={eventId} onImported={reloadList} />
      </Dialog>
      <Dialog
        open={open?.kind === 'details' && Boolean(current)}
        onClose={() => setOpen(null)}
        title={current?.displayName ?? ''}
        closeLabel={t.details.close}
      >
        {current ? (
          <GuestDetails guest={current} groups={groups} actions={detailsActions(current)} />
        ) : null}
      </Dialog>
      <Dialog
        open={open?.kind === 'send' && Boolean(current)}
        onClose={() => setOpen(null)}
        title={current ? fillTemplate(t.send.title, { name: current.displayName }) : ''}
        closeLabel={t.send.close}
      >
        {current ? (
          <SendMessage guest={current} invite={invite} onOpened={() => markOpened(current)} />
        ) : null}
      </Dialog>
    </div>
  );
}
