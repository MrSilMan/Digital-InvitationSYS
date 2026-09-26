'use client';

import { IconTrash } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { type FormEvent, useState, useTransition } from 'react';

import { Field } from '@/components/dashboard/field';
import { buttonClasses, inputClasses } from '@/components/dashboard/styles';
import { formatCount } from '@/i18n/plural';
import { admin, dashboard } from '@/i18n/pt-AO';
import { confirmsEvent } from '@/lib/admin/confirmation';
import { cn } from '@/lib/cn';
import { fillTemplate } from '@/lib/template';
import { ADMIN_LIMITS, guestLimitSchema } from '@/lib/validation/admin';

import { changeEventStatus, changeGuestLimit, removeEvent } from './actions';
import { ConfirmDialog } from './confirm-dialog';
import { DeleteDialog } from './delete-dialog';
import { adminErrorText } from './errors';
import { Notice, type NoticeState } from './notice';
import { UsageMeter } from './usage-meter';

const t = admin.event;

/** Turns the event on or off for its guests (turning it off asks first). */
export function EventStatusControl({
  eventId,
  isActive,
  couple,
}: {
  eventId: string;
  isActive: boolean;
  couple: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [confirming, setConfirming] = useState(false);

  const change = () => {
    setNotice(null);
    startTransition(async () => {
      const result = await changeEventStatus(eventId, !isActive);
      if (!result.ok) {
        setNotice({ tone: 'error', text: adminErrorText(result) });
        return;
      }
      setNotice({ tone: 'success', text: isActive ? t.status.deactivated : t.status.activated });
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col items-start gap-4">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className={cn(
            'mt-1.5 size-2.5 shrink-0 rounded-full ring-4',
            isActive ? 'bg-emerald-500 ring-emerald-100' : 'bg-red-500 ring-red-100',
          )}
        />
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-semibold text-stone-900">
            {isActive ? admin.events.active : admin.events.inactive}
          </p>
          <p className="text-sm text-stone-600">
            {isActive ? t.status.activeHint : t.status.inactiveHint}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => (isActive ? setConfirming(true) : change())}
        disabled={pending}
        className={buttonClasses(isActive ? 'danger' : 'primary', 'md', 'w-full')}
      >
        {isActive ? t.status.deactivate : t.status.activate}
      </button>
      <Notice notice={notice} className="w-full" />
      <ConfirmDialog
        open={confirming}
        title={fillTemplate(t.status.confirm.title, { couple })}
        text={t.status.confirm.text}
        confirmLabel={t.status.confirm.button}
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false);
          change();
        }}
      />
    </div>
  );
}

/** The event's plan: how many guests the couple can add (never below the ones already added). */
export function GuestLimitForm({
  eventId,
  guestLimit,
  guestCount,
}: {
  eventId: string;
  guestLimit: number;
  guestCount: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState(String(guestLimit));
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [notice, setNotice] = useState<NoticeState | null>(null);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(null);
    const parsed = guestLimitSchema.safeParse(value);
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message);
      return;
    }
    setFieldError(undefined);
    startTransition(async () => {
      const result = await changeGuestLimit(eventId, value);
      if (!result.ok) {
        const issue = result.issues?.[0]?.message;
        if (issue) setFieldError(issue);
        else setNotice({ tone: 'error', text: adminErrorText(result) });
        return;
      }
      setNotice({ tone: 'success', text: t.limit.saved });
      router.refresh();
    });
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <p className="flex items-baseline justify-between gap-2 text-sm">
          <span className="text-stone-600">{t.guests}</span>
          <span className="font-medium text-stone-900 tabular-nums">
            {fillTemplate(admin.events.guestsShort, {
              count: String(guestCount),
              limit: String(guestLimit),
            })}
          </span>
        </p>
        <UsageMeter value={guestCount} max={guestLimit} />
        <p className="text-sm text-stone-600">{t.limit.hint}</p>
      </div>
      {/* The button sits beside the input, so an error under them never moves it. */}
      <Field id="limite-convidados" label={t.limit.label} error={fieldError}>
        {(props) => (
          <div className="flex gap-2">
            <input
              {...props}
              type="number"
              inputMode="numeric"
              min={Math.max(1, guestCount)}
              max={ADMIN_LIMITS.guestLimit}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              className={inputClasses}
            />
            <button
              type="submit"
              disabled={pending}
              className={buttonClasses('secondary', 'md', 'shrink-0')}
            >
              {pending ? admin.common.saving : t.limit.save}
            </button>
          </div>
        )}
      </Field>
      <Notice notice={notice} />
    </form>
  );
}

/**
 * Deletes the event for good (it asks for the event's address first), then goes back to the
 * list, which says so.
 */
export function DeleteEventControl({
  eventId,
  slug,
  couple,
  guestCount,
}: {
  eventId: string;
  slug: string;
  couple: string;
  guestCount: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState<NoticeState | null>(null);

  const remove = (typed: string) => {
    setNotice(null);
    startTransition(async () => {
      const result = await removeEvent(eventId, typed);
      if (!result.ok) {
        setNotice({ tone: 'error', text: adminErrorText(result) });
        return;
      }
      router.replace('/admin?eliminado=1');
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-stone-600">{t.delete.hint}</p>
      <button
        type="button"
        onClick={() => {
          setNotice(null);
          setOpen(true);
        }}
        className={buttonClasses('danger', 'md', 'w-full')}
      >
        <IconTrash size={18} stroke={1.75} aria-hidden="true" />
        {t.delete.button}
      </button>
      <DeleteDialog
        open={open}
        title={fillTemplate(t.delete.confirm.title, { couple })}
        label={t.delete.confirm.label}
        expected={slug}
        confirms={(typed) => confirmsEvent(typed, slug)}
        pending={pending}
        notice={notice}
        onConfirm={remove}
        onCancel={() => setOpen(false)}
      >
        <p>
          {fillTemplate(t.delete.confirm.text, {
            guests: formatCount(guestCount, dashboard.events.guestCount),
          })}
        </p>
      </DeleteDialog>
    </div>
  );
}
