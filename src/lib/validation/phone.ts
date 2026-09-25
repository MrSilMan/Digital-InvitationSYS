import { z } from 'zod';

import { validation } from '@/i18n/pt-AO';

/**
 * Angolan mobile numbers (the ones WhatsApp works with): 9 digits starting with 9, stored in
 * E.164 form (+2449XXXXXXXX). Accepts what people usually type: spaces, dots, dashes,
 * brackets, and an optional +244 / 00244 / 244 prefix. Guests' phones also accept numbers abroad.
 */

const MOBILE_DIGITS = /^9\d{8}$/;

export function normalizeAngolanPhone(input: string): string | null {
  let digits = input.trim().replace(/[\s().-]/g, '');
  if (digits.startsWith('+')) digits = digits.slice(1);
  else if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.length === 12 && digits.startsWith('244')) digits = digits.slice(3);
  return MOBILE_DIGITS.test(digits) ? `+244${digits}` : null;
}

/** "+244923456789" → "+244 923 456 789" */
export function formatAngolanPhone(e164: string): string {
  const digits = e164.replace(/^\+244/, '');
  return `+244 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}

/** Zod schema: validates and normalizes to E.164. */
export const angolanPhoneSchema = z.string().transform((value, ctx) => {
  const normalized = normalizeAngolanPhone(value);
  if (!normalized) {
    ctx.addIssue({ code: 'custom', message: validation.phone.invalid });
    return z.NEVER;
  }
  return normalized;
});

// ── Guests' phones ───────────────────────────────────────────────────────────
// Guests may live abroad (family in Portugal, Brazil…): besides Angolan mobiles, any number typed
// with its country code (+ or 00) is accepted. Without one, a number is read as Angolan. The
// couple's own WhatsApp numbers stay Angolan (angolanPhoneSchema).

/** E.164 allows 15 digits with the country code; shorter than 8 is never a mobile number. */
const INTERNATIONAL_DIGITS = /^[1-9]\d{7,14}$/;

export function normalizeGuestPhone(input: string): string | null {
  const angolan = normalizeAngolanPhone(input);
  if (angolan) return angolan;
  const compact = input.trim().replace(/[\s().-]/g, '');
  const digits = compact.startsWith('+')
    ? compact.slice(1)
    : compact.startsWith('00')
      ? compact.slice(2)
      : null;
  // An Angolan number that failed above (landline, wrong length) is not accepted as foreign.
  if (digits === null || digits.startsWith('244')) return null;
  return INTERNATIONAL_DIGITS.test(digits) ? `+${digits}` : null;
}

export function isAngolanPhone(e164: string): boolean {
  return /^\+2449\d{8}$/.test(e164);
}

/** Angolan numbers grouped ("+244 923 456 789"); numbers abroad as stored ("+351912345678"). */
export function formatGuestPhone(e164: string): string {
  return isAngolanPhone(e164) ? formatAngolanPhone(e164) : e164;
}

/** Zod schema for a guest's phone: validates and normalizes to E.164. */
export const guestPhoneSchema = z.string().transform((value, ctx) => {
  const normalized = normalizeGuestPhone(value);
  if (!normalized) {
    ctx.addIssue({ code: 'custom', message: validation.phone.invalidGuest });
    return z.NEVER;
  }
  return normalized;
});
