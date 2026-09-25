'use client';

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
