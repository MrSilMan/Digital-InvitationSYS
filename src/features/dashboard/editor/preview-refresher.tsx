'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

import {
  PREVIEW_REFRESH,
  PREVIEW_UPDATED,
  type PreviewMessage,
  previewMessageVersion,
} from './preview-messages';

/**
 * Inside the preview iframe: re-renders the page (on the server, with the latest draft) when the
 * editor asks, keeping the scroll position, and reports the draft version it now shows.
 */
export function PreviewRefresher() {
  const router = useRouter();
  const [refreshing, startTransition] = useTransition();
  const [version, setVersion] = useState(0);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      const requested = previewMessageVersion(event, PREVIEW_REFRESH);
      if (requested === null) return;
      setVersion(requested);
      startTransition(() => router.refresh());
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [router]);

  useEffect(() => {
    if (refreshing || window.parent === window) return;
    const message: PreviewMessage = { type: PREVIEW_UPDATED, version };
    window.parent.postMessage(message, window.location.origin);
  }, [refreshing, version]);

  return null;
}
