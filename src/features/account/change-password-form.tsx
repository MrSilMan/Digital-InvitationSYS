'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { type Path, useForm } from 'react-hook-form';

import { Field } from '@/components/dashboard/field';
import { buttonClasses, inputClasses } from '@/components/dashboard/styles';
import { account } from '@/i18n/pt-AO';
import { fillTemplate } from '@/lib/template';
import {
  type ChangePasswordInput,
  changePasswordSchema,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from '@/lib/validation/auth';

import { changePassword } from './actions';

const t = account.password;

const EMPTY: ChangePasswordInput = { currentPassword: '', newPassword: '', confirmPassword: '' };

/** Current password, then the new one twice. Other devices are signed out afterwards. */
export function ChangePasswordForm() {
  const [shown, setShown] = useState(false);
  const [status, setStatus] = useState<{ kind: 'error' | 'saved'; text: string } | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    reset,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: EMPTY,
    mode: 'onTouched',
  });

  const submit = handleSubmit(async () => {
    setStatus(null);
    try {
      const result = await changePassword(getValues());
      if (result.ok) {
        reset(EMPTY);
        setStatus({ kind: 'saved', text: t.changed });
        return;
      }
      for (const issue of result.issues ?? []) {
        setError(issue.path as Path<ChangePasswordInput>, { message: issue.message });
      }
      if (result.error === 'wrong-password') {
        setError('currentPassword', { message: account.errors['wrong-password'] });
      }
      setStatus({ kind: 'error', text: account.errors[result.error] });
    } catch {
      setStatus({ kind: 'error', text: account.errors.unavailable });
    }
  });

  const type = shown ? 'text' : 'password';

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <Field
        id="conta-palavra-passe-atual"
        label={t.current}
        error={errors.currentPassword?.message}
      >
        {(props) => (
          <input
            {...props}
            {...register('currentPassword')}
            type={type}
            autoComplete="current-password"
            maxLength={PASSWORD_MAX_LENGTH}
            className={inputClasses}
          />
        )}
      </Field>
      <Field
        id="conta-palavra-passe-nova"
        label={t.new}
        hint={fillTemplate(t.newHint, { min: String(PASSWORD_MIN_LENGTH) })}
        error={errors.newPassword?.message}
      >
        {(props) => (
          <input
            {...props}
            {...register('newPassword')}
            type={type}
            autoComplete="new-password"
            maxLength={PASSWORD_MAX_LENGTH}
            className={inputClasses}
          />
        )}
      </Field>
      <Field
        id="conta-palavra-passe-repetir"
        label={t.confirm}
        error={errors.confirmPassword?.message}
      >
        {(props) => (
          <input
            {...props}
            {...register('confirmPassword')}
            type={type}
            autoComplete="new-password"
            maxLength={PASSWORD_MAX_LENGTH}
            className={inputClasses}
          />
        )}
      </Field>
      <label className="flex items-center gap-2 text-sm text-stone-700">
        <input
          type="checkbox"
          checked={shown}
          onChange={(event) => setShown(event.target.checked)}
          className="size-4 accent-stone-900"
        />
        {t.show}
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={isSubmitting} className={buttonClasses('primary')}>
          {isSubmitting ? t.submitting : t.submit}
        </button>
        <p
          role="status"
          className={status?.kind === 'error' ? 'text-sm text-red-700' : 'text-sm text-emerald-700'}
        >
          {status?.text}
        </p>
      </div>
    </form>
  );
}
