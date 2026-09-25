'use client';

import { useCallback, useEffect, useState } from 'react';

import { guests } from '@/i18n/pt-AO';
import { formatCount } from '@/i18n/plural';
import { fillTemplate } from '@/lib/template';
import type { GuestFormValues } from '@/lib/validation/guest';
import { formatGuestPhone } from '@/lib/validation/phone';

import type { GuestErrorCode, GuestListItem } from './types';

const t = guests;

/** A stored guest as form values (the phone as people read it). */
export function toGuestFormValues(guest: GuestListItem): GuestFormValues {
  return {
    displayName: guest.displayName,
    phone: guest.phone ? formatGuestPhone(guest.phone) : '',
    seatsAllowed: String(guest.seatsAllowed),
    groupTag: guest.groupTag ?? '',
  };
}

/** The message for a failed guest action. */
export function guestErrorText(result: { error: GuestErrorCode; people?: number }): string {
  if (result.error === 'seats') {
    return fillTemplate(t.errors.seats, { people: formatCount(result.people ?? 0, t.people) });
  }
  return t.errors[result.error];
}

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
