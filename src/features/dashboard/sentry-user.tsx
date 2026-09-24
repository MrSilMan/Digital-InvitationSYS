'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

/** Tags browser errors with the signed-in user's ID and role (never the e-mail or name). */
export function SentryUser({ id, role }: { id: string; role: string }) {
  useEffect(() => {
    Sentry.setUser({ id, role });
    return () => Sentry.setUser(null);
  }, [id, role]);
  return null;
}
