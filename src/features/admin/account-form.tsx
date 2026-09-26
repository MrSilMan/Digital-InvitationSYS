'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useId } from 'react';
import { useForm } from 'react-hook-form';

import { Field } from '@/components/dashboard/field';
import { buttonClasses, inputClasses } from '@/components/dashboard/styles';
import { admin } from '@/i18n/pt-AO';
import {
  ADMIN_LIMITS,
  type AccountData,
  type AccountFormValues,
  accountSchema,
} from '@/lib/validation/admin';

import { adminErrorText, applyFieldIssues } from './errors';
import type { NoticeState } from './notice';
import type { AdminActionResult } from './types';

const t = admin.newAccount;

interface AccountFormProps {
  initialValues: AccountFormValues;
  submitLabel: string;
  submittingLabel: string;
  /** Under the name's label; a couple's example by default, null for none. */
  nameHint?: string | null;
  emailHint?: string;
  /** Saves on the server; problems come back onto the fields or as the notice. */
  onSubmit: (values: AccountFormValues) => Promise<AdminActionResult>;
  /** After a successful save (the values as saved). */
  onSaved: (values: AccountFormValues) => void;
  onNotice: (notice: NoticeState | null) => void;
}

/** An account's name and e-mail (creating an account, and changing them later). */
export function AccountForm({
  initialValues,
  submitLabel,
  submittingLabel,
  nameHint = t.nameHint,
  emailHint,
  onSubmit,
  onSaved,
  onNotice,
}: AccountFormProps) {
  const id = useId();
  const {
    register,
    handleSubmit,
    setError,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<AccountFormValues, unknown, AccountData>({
    resolver: zodResolver(accountSchema),
    defaultValues: initialValues,
    mode: 'onTouched',
  });

  const submit = handleSubmit(async (parsed) => {
    onNotice(null);
    try {
      const result = await onSubmit(getValues());
      if (result.ok) {
        onSaved(parsed);
        return;
      }
      applyFieldIssues(result, setError, ['name', 'email'] as const);
      if (result.error === 'email-taken') {
        setError('email', { type: 'server', message: adminErrorText(result) });
      }
      onNotice({ tone: 'error', text: adminErrorText(result) });
    } catch {
      onNotice({ tone: 'error', text: admin.errors.unavailable });
    }
  });

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <Field
        id={`${id}-name`}
        label={t.name}
        hint={nameHint ?? undefined}
        error={errors.name?.message}
      >
        {(props) => (
          <input
            {...props}
            {...register('name')}
            type="text"
            autoComplete="off"
            maxLength={ADMIN_LIMITS.accountName}
            className={inputClasses}
          />
        )}
      </Field>
      <Field id={`${id}-email`} label={t.email} hint={emailHint} error={errors.email?.message}>
        {(props) => (
          <input
            {...props}
            {...register('email')}
            type="email"
            inputMode="email"
            autoComplete="off"
            className={inputClasses}
          />
        )}
      </Field>
      <button
        type="submit"
        disabled={isSubmitting}
        className={buttonClasses('primary', 'md', 'self-start')}
      >
        {isSubmitting ? submittingLabel : submitLabel}
      </button>
    </form>
  );
}
