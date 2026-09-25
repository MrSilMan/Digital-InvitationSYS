'use client';

import { IconCheck, IconCopy, IconExternalLink, IconRefresh, IconTrash } from '@tabler/icons-react';
import { type ReactNode, useId, useState } from 'react';

import { buttonClasses, inputClasses } from '@/components/dashboard/styles';
import { formatShortDateTime } from '@/i18n/format';
import { guests } from '@/i18n/pt-AO';
import { fillTemplate } from '@/lib/template';
import type { CoupleAnswerValues, GuestFormValues } from '@/lib/validation/guest';

import { AnswerForm } from './answer-form';
import { GuestForm } from './guest-form';
import type { GuestActionResult, GuestListItem } from './types';
import { guestErrorText, toGuestFormValues, useCopy } from './ui-helpers';

const t = guests.details;
const a = guests.answer;

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3 border-t border-stone-200 pt-5">
      <div>
        <h3 id={id} className="text-base font-semibold text-stone-900">
          {title}
        </h3>
        {hint ? <p className="mt-1 text-sm text-stone-600">{hint}</p> : null}
      </div>
      {children}
    </section>
  );
}

const when = (iso: string) => formatShortDateTime(new Date(iso));

/** What the guest answered, how and when (above the form that records a new answer). */
function AnswerSummary({ guest }: { guest: GuestListItem }) {
  const { rsvp } = guest;
  if (!rsvp) return null;
  const intent =
    rsvp.attending === null && rsvp.whatsappIntentAt && rsvp.whatsappIntentTarget
      ? fillTemplate(a.whatsappIntent, {
          target: a.targets[rsvp.whatsappIntentTarget],
          date: when(rsvp.whatsappIntentAt),
        })
      : null;
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-stone-50 p-4 text-sm text-stone-700">
      {rsvp.attending !== null ? (
        <p>
          {fillTemplate(a.updated, { source: a.source[rsvp.source], date: when(rsvp.updatedAt) })}
        </p>
      ) : null}
      {intent ? <p>{intent}</p> : null}
      {rsvp.attending && rsvp.companionNames.length > 0 ? (
        <p>
          <span className="font-medium text-stone-900">{a.companions}: </span>
          {rsvp.companionNames.join(', ')}
        </p>
      ) : null}
      {rsvp.message ? (
        <figure>
          <figcaption className="font-medium text-stone-900">{a.message}</figcaption>
          <blockquote className="mt-1 whitespace-pre-line italic">{rsvp.message}</blockquote>
        </figure>
      ) : null}
    </div>
  );
}

function LinkSection({
  guest,
  onMarkSent,
  onRenew,
}: {
  guest: GuestListItem;
  onMarkSent: (sent: boolean) => Promise<GuestActionResult>;
  onRenew: () => Promise<GuestActionResult>;
}) {
  const id = useId();
  const { status: copyStatus, copy } = useCopy();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: 'error' | 'info'; text: string } | null>(null);

  const run = async (step: () => Promise<GuestActionResult>, success?: string) => {
    setBusy(true);
    setMessage(null);
    try {
      const result = await step();
      if (!result.ok) setMessage({ kind: 'error', text: guestErrorText(result) });
      else if (success) setMessage({ kind: 'info', text: success });
    } catch {
      setMessage({ kind: 'error', text: guests.errors.unavailable });
    } finally {
      setBusy(false);
    }
  };

  const renew = () => {
    if (!window.confirm(fillTemplate(t.link.renewConfirm, { name: guest.displayName }))) return;
    void run(onRenew, t.link.renewed);
  };

  return (
    <Section title={t.link.legend} hint={t.link.hint}>
      <label htmlFor={`${id}-link`} className="sr-only">
        {t.link.legend}
      </label>
      <input
        id={`${id}-link`}
        type="text"
        readOnly
        value={guest.link}
        onFocus={(event) => event.currentTarget.select()}
        className={`${inputClasses} font-mono text-xs sm:text-xs`}
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void copy(guest.link)}
          className={buttonClasses('secondary', 'sm')}
        >
          {copyStatus === 'copied' ? (
            <IconCheck size={16} stroke={1.75} aria-hidden="true" />
          ) : (
            <IconCopy size={16} stroke={1.75} aria-hidden="true" />
          )}
          {copyStatus === 'copied' ? t.link.copied : t.link.copy}
        </button>
        <a
          href={guest.link}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClasses('secondary', 'sm')}
        >
          <IconExternalLink size={16} stroke={1.75} aria-hidden="true" />
          {t.link.open}
        </a>
      </div>
      <p role="status" className="sr-only">
        {copyStatus === 'copied'
          ? t.link.copied
          : copyStatus === 'failed'
            ? guests.row.copyFailed
            : ''}
      </p>
      <p className="text-sm text-stone-700">
        {guest.lastOpenedAt
          ? fillTemplate(t.link.opened, {
              count: String(guest.viewCount),
              date: when(guest.lastOpenedAt),
            })
          : t.link.notOpened}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm text-stone-700">
          {guest.sentAt ? fillTemplate(t.link.sent, { date: when(guest.sentAt) }) : t.link.notSent}
        </p>
        <button
          type="button"
          disabled={busy}
          onClick={() => void run(() => onMarkSent(!guest.sentAt))}
          className={buttonClasses('ghost', 'sm')}
        >
          {guest.sentAt ? t.link.markNotSent : t.link.markSent}
        </button>
      </div>
      <div className="flex flex-col items-start gap-1">
        <button
          type="button"
          disabled={busy}
          onClick={renew}
          className={buttonClasses('secondary', 'sm')}
        >
          <IconRefresh size={16} stroke={1.75} aria-hidden="true" />
          {t.link.renew}
        </button>
        <p className="text-xs text-stone-500">{t.link.renewHint}</p>
      </div>
      <p
        role="status"
        className={message?.kind === 'error' ? 'text-sm text-red-700' : 'text-sm text-stone-600'}
      >
        {message?.text}
      </p>
    </Section>
  );
}

export interface GuestDetailsActions {
  save: (values: GuestFormValues) => Promise<GuestActionResult<{ values: GuestFormValues }>>;
  saveAnswer: (values: CoupleAnswerValues) => Promise<GuestActionResult>;
  markSent: (sent: boolean) => Promise<GuestActionResult>;
  renewLink: () => Promise<GuestActionResult>;
  remove: () => Promise<GuestActionResult>;
}

/** Everything about one guest: data, answer, personal link, deletion. */
export function GuestDetails({
  guest,
  groups,
  actions,
}: {
  guest: GuestListItem;
  groups: string[];
  actions: GuestDetailsActions;
}) {
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);

  const remove = async () => {
    if (!window.confirm(fillTemplate(t.remove.confirm, { name: guest.displayName }))) return;
    setRemoving(true);
    setRemoveError(null);
    try {
      const result = await actions.remove();
      if (!result.ok) setRemoveError(guestErrorText(result));
    } catch {
      setRemoveError(guests.errors.unavailable);
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <GuestForm
        initialValues={toGuestFormValues(guest)}
        groups={groups}
        submitLabel={guests.form.save}
        onSubmit={actions.save}
      />
      <Section title={a.legend} hint={a.hint}>
        <AnswerSummary guest={guest} />
        <AnswerForm guest={guest} onSave={actions.saveAnswer} />
      </Section>
      <LinkSection guest={guest} onMarkSent={actions.markSent} onRenew={actions.renewLink} />
      <Section title={t.remove.legend} hint={t.remove.hint}>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={removing}
            onClick={() => void remove()}
            className={buttonClasses('danger', 'sm')}
          >
            <IconTrash size={16} stroke={1.75} aria-hidden="true" />
            {t.remove.button}
          </button>
          {removeError ? (
            <p role="alert" className="text-sm text-red-700">
              {removeError}
            </p>
          ) : null}
        </div>
      </Section>
    </div>
  );
}
