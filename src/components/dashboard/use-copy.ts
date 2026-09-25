'use client';

import { useCallback, useEffect, useState } from 'react';

export type CopyStatus = 'idle' | 'copied' | 'failed';

/** Copies text to the clipboard; the status goes back to idle after a few seconds. */
export function useCopy() {
  const [status, setStatus] = useState<CopyStatus>('idle');
  useEffect(() => {
    if (status === 'idle') return;
    const timer = setTimeout(() => setStatus('idle'), 3000);
    return () => clearTimeout(timer);
  }, [status]);
  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setStatus('copied');
      return true;
    } catch {
      setStatus('failed');
      return false;
    }
  }, []);
  return { status, copy };
}
