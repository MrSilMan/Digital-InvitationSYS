'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

import { buttonClasses, cardClasses } from '@/components/dashboard/styles';
import { errors } from '@/i18n/pt-AO';

/** Errors inside the admin area keep the header (the menu and sign out stay reachable). */
export default function AdminError({
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
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className={`${cardClasses} flex flex-col items-start gap-3 p-6`}>
        <h1 className="text-xl font-semibold">{errors.generic.title}</h1>
        <p className="text-stone-600">{errors.generic.description}</p>
        <button type="button" onClick={() => retry()} className={buttonClasses('primary')}>
          {errors.generic.retry}
        </button>
        {error.digest ? (
          <p className="text-xs text-stone-500">
            {errors.reference}: {error.digest}
          </p>
        ) : null}
      </div>
    </main>
  );
}
