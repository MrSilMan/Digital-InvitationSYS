'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

import { errors } from '@/i18n/pt-AO';

export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="font-serif text-3xl">{errors.generic.title}</h1>
      <p className="max-w-sm text-muted">{errors.generic.description}</p>
      <button
        type="button"
        onClick={() => retry()}
        className="mt-2 rounded-full bg-accent px-6 py-2.5 text-sm tracking-wider text-accent-contrast uppercase"
      >
        {errors.generic.retry}
      </button>
      {error.digest ? (
        <p className="mt-4 text-xs text-muted">
          {errors.reference}: {error.digest}
        </p>
      ) : null}
    </main>
  );
}
