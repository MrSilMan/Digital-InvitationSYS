'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { IconEye, IconEyeOff } from '@tabler/icons-react';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';

import { Field } from '@/components/dashboard/field';
import { inputClasses } from '@/components/dashboard/styles';
import { ctaClasses } from '@/features/landing/cta-links';
import { auth } from '@/i18n/pt-AO';
import { cn } from '@/lib/cn';
import { type LoginInput, loginSchema } from '@/lib/validation/auth';

import { signIn, type SignInErrorCode } from './actions';

const t = auth.login;

const ERROR_MESSAGES: Record<SignInErrorCode, string> = {
  invalid: t.errors.invalidCredentials,
  'invalid-credentials': t.errors.invalidCredentials,
  'rate-limited': t.errors.rateLimited,
  suspended: t.errors.suspended,
  unavailable: t.errors.unavailable,
};

/**
 * E-mail + password; on success the Server Action redirects (to `returnTo` when given). Dashboard
 * fields, and the landing page's button (the login page is a LandingRoot).
 */
export function LoginForm({ returnTo }: { returnTo: string | null }) {
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    startTransition(async () => {
      const result = await signIn(values, returnTo ?? undefined);
      if (result && !result.ok) setFormError(ERROR_MESSAGES[result.error]);
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <Field id="login-email" label={t.email} error={errors.email?.message}>
        {(props) => (
          <input
            {...props}
            {...register('email')}
            type="email"
            autoComplete="username"
            inputMode="email"
            className={inputClasses}
          />
        )}
      </Field>
      <Field id="login-password" label={t.password} error={errors.password?.message}>
        {(props) => (
          <div className="relative">
            <input
              {...props}
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              className={`${inputClasses} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((shown) => !shown)}
              aria-pressed={showPassword}
              aria-label={showPassword ? t.hidePassword : t.showPassword}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-stone-600 hover:text-stone-800 focus-visible:outline-2 focus-visible:outline-stone-900"
            >
              {showPassword ? (
                <IconEyeOff size={20} stroke={1.75} aria-hidden="true" />
              ) : (
                <IconEye size={20} stroke={1.75} aria-hidden="true" />
              )}
            </button>
          </div>
        )}
      </Field>
      {formError ? (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 font-sans text-sm text-red-800">
          {formError}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className={cn(ctaClasses('gold'), 'mt-1 w-full disabled:cursor-wait disabled:opacity-75')}
      >
        {pending ? t.submitting : t.submit}
      </button>
    </form>
  );
}
