'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useId, useState } from 'react';
import { type Path, useForm } from 'react-hook-form';

import { Field } from '@/components/dashboard/field';
import { buttonClasses, inputClasses } from '@/components/dashboard/styles';
import { guests } from '@/i18n/pt-AO';
import {
  type GuestData,
  type GuestFormValues,
  GUEST_LIMITS,
  guestSchema,
} from '@/lib/validation/guest';

import type { GuestActionResult } from './types';
import { guestErrorText } from './ui-helpers';

const t = guests.form;
const SEAT_OPTIONS = Array.from({ length: GUEST_LIMITS.seats }, (_, index) => String(index + 1));

interface GuestFormProps {
  initialValues: GuestFormValues;
  /** Existing groups, suggested while typing. */
  groups: string[];
  submitLabel: string;
  /**
   * Saves on the server and returns the values as stored (phone and group normalized); field
   * issues come back onto the inputs.
   */
  onSubmit: (values: GuestFormValues) => Promise<GuestActionResult<{ values: GuestFormValues }>>;
  onCancel?: () => void;
}

/** Name, phone, seats and group of a guest (adding and editing). */
export function GuestForm({
  initialValues,
  groups,
  submitLabel,
  onSubmit,
  onCancel,
}: GuestFormProps) {
  const id = useId();
  const form = useForm<GuestFormValues, unknown, GuestData>({
    resolver: zodResolver(guestSchema),
    defaultValues: initialValues,
    mode: 'onTouched',
  });
  const {
    register,
    handleSubmit,
    setError,
    reset,
    getValues,
    formState: { errors, isSubmitting, isDirty },
  } = form;
  const [status, setStatus] = useState<{ kind: 'error' | 'saved'; text: string } | null>(null);

  const submit = handleSubmit(async () => {
    setStatus(null);
    try {
      const result = await onSubmit(getValues());
      if (result.ok) {
        reset(result.values);
        setStatus({ kind: 'saved', text: t.saved });
        return;
      }
      for (const issue of result.issues ?? []) {
        setError(issue.path as Path<GuestFormValues>, { message: issue.message });
      }
      setStatus({ kind: 'error', text: guestErrorText(result) });
    } catch {
      setStatus({ kind: 'error', text: guests.errors.unavailable });
    }
  });

  const fieldId = (name: keyof GuestFormValues) => `${id}-${name}`;

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <Field
        id={fieldId('displayName')}
        label={t.displayName}
        hint={t.displayNameHint}
        error={errors.displayName?.message}
      >
        {(props) => (
          <input
            {...props}
            {...register('displayName')}
            type="text"
            autoComplete="off"
            maxLength={GUEST_LIMITS.name}
            className={inputClasses}
          />
        )}
      </Field>
      <Field id={fieldId('phone')} label={t.phone} hint={t.phoneHint} error={errors.phone?.message}>
        {(props) => (
          <input
            {...props}
            {...register('phone')}
            type="tel"
            inputMode="tel"
            autoComplete="off"
            maxLength={GUEST_LIMITS.phoneInput}
            placeholder="923 456 789"
            className={inputClasses}
          />
        )}
      </Field>
      <div className="grid gap-4 sm:grid-cols-[8rem_minmax(0,1fr)]">
        <Field
          id={fieldId('seatsAllowed')}
          label={t.seats}
          hint={t.seatsHint}
          error={errors.seatsAllowed?.message}
        >
          {(props) => (
            <select {...props} {...register('seatsAllowed')} className={inputClasses}>
              {SEAT_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field
          id={fieldId('groupTag')}
          label={t.group}
          hint={t.groupHint}
          error={errors.groupTag?.message}
        >
          {(props) => (
            <>
              <input
                {...props}
                {...register('groupTag')}
                type="text"
                autoComplete="off"
                list={`${id}-groups`}
                maxLength={GUEST_LIMITS.group}
                className={inputClasses}
              />
              <datalist id={`${id}-groups`}>
                {groups.map((group) => (
                  <option key={group} value={group} />
                ))}
              </datalist>
            </>
          )}
        </Field>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting || (!isDirty && status?.kind === 'saved')}
          className={buttonClasses('primary')}
        >
          {isSubmitting ? t.saving : submitLabel}
        </button>
        {onCancel ? (
          <button type="button" onClick={onCancel} className={buttonClasses('ghost')}>
            {t.cancel}
          </button>
        ) : null}
        <p
          role="status"
          className={status?.kind === 'error' ? 'text-sm text-red-700' : 'text-sm text-stone-600'}
        >
          {status?.text}
        </p>
      </div>
    </form>
  );
}
