'use client';

import { useRouter } from 'next/navigation';
import { type FormEvent, useState, useTransition } from 'react';

import { Field } from '@/components/dashboard/field';
import { buttonClasses, inputClasses } from '@/components/dashboard/styles';
import { admin } from '@/i18n/pt-AO';
import { fillTemplate } from '@/lib/template';
import { ADMIN_LIMITS, guestLimitSchema } from '@/lib/validation/admin';

import { changeEventStatus, changeGuestLimit } from './actions';
import { adminErrorText } from './errors';
import { Notice, type NoticeState } from './notice';

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

  const toggle = () => {
    if (isActive && !window.confirm(fillTemplate(t.status.deactivateConfirm, { couple }))) return;
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
    <div className="flex flex-col items-start gap-3">
      <p className="text-sm text-stone-700">
        {isActive ? t.status.activeHint : t.status.inactiveHint}
      </p>
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        className={buttonClasses(isActive ? 'danger' : 'primary')}
      >
        {isActive ? t.status.deactivate : t.status.activate}
      </button>
      <Notice notice={notice} />
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
    <form onSubmit={submit} noValidate className="flex flex-col items-start gap-3">
      <p className="text-sm text-stone-700">
        {fillTemplate(t.limit.hint, { count: String(guestCount) })}
      </p>
      <div className="flex flex-wrap items-end gap-3">
        <Field id="limite-convidados" label={t.limit.label} error={fieldError}>
          {(props) => (
            <input
              {...props}
              type="number"
              inputMode="numeric"
              min={Math.max(1, guestCount)}
              max={ADMIN_LIMITS.guestLimit}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              className={`${inputClasses} w-32`}
            />
          )}
        </Field>
        <button type="submit" disabled={pending} className={buttonClasses('secondary')}>
          {pending ? admin.common.saving : t.limit.save}
        </button>
      </div>
      <Notice notice={notice} />
    </form>
  );
}
