'use client';

import { useEffect } from 'react';

import { browserSentry } from '@/lib/sentry/browser';

/** Tags browser errors with the signed-in user's ID and role (never the e-mail or name). */
export function SentryUser({ id, role }: { id: string; role: string }) {
  useEffect(() => {
    browserSentry.setUser({ id, role });
    return () => browserSentry.setUser(null);
  }, [id, role]);
  return null;
}
