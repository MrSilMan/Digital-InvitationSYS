'use client';

import { IconCopy } from '@tabler/icons-react';
import { useEffect, useState } from 'react';

import { PILL_ICON_SIZE, pillButtonClasses } from '@/components/ui/pill-button-classes';

interface CopyButtonProps {
  value: string;
  labels: { copy: string; copied: string; failed: string };
}

/** Copies `value` (e.g. the IBAN) and says so, also to screen readers. */
export function CopyButton({ value, labels }: CopyButtonProps) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle');

  useEffect(() => {
    if (status !== 'copied') return;
    const timer = setTimeout(() => setStatus('idle'), 3000);
    return () => clearTimeout(timer);
  }, [status]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setStatus('copied');
    } catch {
      setStatus('failed');
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button type="button" onClick={copy} className={pillButtonClasses('pill')}>
        <IconCopy size={PILL_ICON_SIZE.pill} stroke={1.75} aria-hidden="true" />
        <span>{labels.copy}</span>
      </button>
      <p role="status" className="min-h-6 max-w-72 font-caps text-base tracking-wider text-muted">
        {status === 'copied' ? labels.copied : status === 'failed' ? labels.failed : ''}
      </p>
    </div>
  );
}
