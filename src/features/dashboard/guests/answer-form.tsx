'use client';

import { useId, useState } from 'react';

import { Field } from '@/components/dashboard/field';
import { buttonClasses, inputClasses } from '@/components/dashboard/styles';
import { guests } from '@/i18n/pt-AO';
import { cn } from '@/lib/cn';
import { type CoupleAnswerValues, coupleAnswerSchema } from '@/lib/validation/guest';

import type { GuestActionResult, GuestListItem } from './types';
import { guestErrorText } from './ui-helpers';

const t = guests.answer;

const CHOICES = [
  { value: 'sim', label: t.yes },
  { value: 'nao', label: t.no },
  { value: '', label: t.none },
] as const;

function initialValues(guest: GuestListItem): CoupleAnswerValues {
  const attending = guest.rsvp?.attending;
  return {
    attending: attending === true ? 'sim' : attending === false ? 'nao' : '',
    peopleCount: String(
      attending ? (guest.rsvp?.peopleCount ?? guest.seatsAllowed) : guest.seatsAllowed,
    ),
  };
}

/** Records an answer the couple received by WhatsApp or phone. */
export function AnswerForm({
  guest,
  onSave,
}: {
  guest: GuestListItem;
  onSave: (values: CoupleAnswerValues) => Promise<GuestActionResult>;
}) {
  const id = useId();
  const [values, setValues] = useState(() => initialValues(guest));
  const [error, setError] = useState<string | undefined>();
  const [status, setStatus] = useState<{ kind: 'error' | 'saved'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const seats = Array.from({ length: guest.seatsAllowed }, (_, index) => String(index + 1));

  const save = async () => {
    setStatus(null);
    const parsed = coupleAnswerSchema(guest.seatsAllowed).safeParse(values);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message);
      return;
    }
    setError(undefined);
    setSaving(true);
    try {
      const result = await onSave(values);
      setStatus(
        result.ok
          ? { kind: 'saved', text: t.saved }
          : { kind: 'error', text: guestErrorText(result) },
      );
    } catch {
      setStatus({ kind: 'error', text: guests.errors.unavailable });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-stone-800">{t.attending}</legend>
        <div className="flex flex-wrap gap-2">
          {CHOICES.map((choice) => (
            <label
              key={choice.value || 'none'}
              className={cn(
                'flex min-h-11 cursor-pointer items-center rounded-lg border px-4 text-sm font-medium has-focus-visible:outline-2 has-focus-visible:outline-stone-900',
                values.attending === choice.value
                  ? 'border-stone-900 bg-stone-900 text-white'
                  : 'border-stone-300 bg-white text-stone-800 hover:bg-stone-50',
              )}
            >
              <input
                type="radio"
                name={`${id}-attending`}
                value={choice.value}
                checked={values.attending === choice.value}
                onChange={() => setValues((current) => ({ ...current, attending: choice.value }))}
                className="sr-only"
              />
              {choice.label}
            </label>
          ))}
        </div>
      </fieldset>
      {values.attending === 'sim' && guest.seatsAllowed > 1 ? (
        <Field id={`${id}-people`} label={t.people} error={error} className="max-w-40">
          {(props) => (
            <select
              {...props}
              value={values.peopleCount}
              onChange={(event) =>
                setValues((current) => ({ ...current, peopleCount: event.target.value }))
              }
              className={inputClasses}
            >
              {seats.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          )}
        </Field>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className={buttonClasses('secondary')}
        >
          {t.save}
        </button>
        <p
          role="status"
          className={status?.kind === 'error' ? 'text-sm text-red-700' : 'text-sm text-stone-600'}
        >
          {status?.text}
        </p>
      </div>
    </div>
  );
}
