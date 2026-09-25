'use client';

import { useEffect } from 'react';

import { errors } from '@/i18n/pt-AO/errors';
import { browserSentry } from '@/lib/sentry/browser';

import './globals.css';

/** Replaces the root layout when it fails, so it renders its own <html> and <body>. */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    browserSentry.captureException(error);
  }, [error]);

  return (
    <html lang="pt-AO">
      <body className="min-h-svh antialiased">
        <title>{errors.generic.title}</title>
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
      </body>
    </html>
  );
}
