'use client';

import { IconAlertTriangle, IconRefresh } from '@tabler/icons-react';
import { useEffect } from 'react';

import { PageMain } from '@/components/dashboard/page-parts';
import { buttonClasses, cardClasses } from '@/components/dashboard/styles';
import { errors } from '@/i18n/pt-AO/errors';
import { browserSentry } from '@/lib/sentry/browser';

/** Errors inside the dashboard keep the header (sign out stays reachable). */
export default function DashboardError({
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
    <PageMain width="narrow">
      <div className={`${cardClasses} flex flex-col items-start gap-4 p-6 sm:p-8`}>
        <span className="flex size-12 items-center justify-center rounded-full bg-amber-50 text-amber-700 ring-1 ring-amber-200">
          <IconAlertTriangle size={24} stroke={1.75} aria-hidden="true" />
        </span>
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold">{errors.generic.title}</h1>
          <p className="text-stone-600">{errors.generic.description}</p>
        </div>
        <button type="button" onClick={() => retry()} className={buttonClasses('primary')}>
          <IconRefresh size={18} stroke={1.75} aria-hidden="true" />
          {errors.generic.retry}
        </button>
        {error.digest ? (
          <p className="text-xs text-stone-600">
            {errors.reference}: {error.digest}
          </p>
        ) : null}
      </div>
    </PageMain>
  );
}
