import { describe, expect, it } from 'vitest';

import { validation } from '@/i18n/pt-AO';
import {
  angolanPhoneSchema,
  formatAngolanPhone,
  formatGuestPhone,
  guestPhoneSchema,
  normalizeAngolanPhone,
  normalizeGuestPhone,
} from '@/lib/validation/phone';

describe('Angolan phone numbers', () => {
  it.each([
    '923456789',
    '923 456 789',
    '923-456-789',
    '(923) 456.789',
    '+244923456789',
    '+244 923 456 789',
    '00244923456789',
    '244923456789',
    '  +244 923 456 789  ',
  ])('normalizes %j to E.164', (input) => {
    expect(normalizeAngolanPhone(input)).toBe('+244923456789');
  });

  it.each([
    '',
    '12345',
    '823456789', // mobile numbers start with 9
    '222 123 456', // landline, not reachable on WhatsApp
    '9234567890', // 10 digits
    '+351 912 345 678', // not Angolan
    'nove dois três',
  ])('rejects %j', (input) => {
    expect(normalizeAngolanPhone(input)).toBeNull();
  });

  it('formats for display', () => {
    expect(formatAngolanPhone('+244923456789')).toBe('+244 923 456 789');
  });

  it('validates with Zod and reports a Portuguese message', () => {
    expect(angolanPhoneSchema.parse('923 456 789')).toBe('+244923456789');

    const result = angolanPhoneSchema.safeParse('12345');
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(validation.phone.invalid);
  });
});

describe('guest phone numbers', () => {
  it('reads numbers without a country code as Angolan', () => {
    expect(normalizeGuestPhone('923 456 789')).toBe('+244923456789');
    expect(normalizeGuestPhone('+244 923 456 789')).toBe('+244923456789');
  });

  it.each([
    ['+351 912 345 678', '+351912345678'],
    ['00351912345678', '+351912345678'],
    ['+55 (11) 98765-4321', '+5511987654321'],
    ['+27 82 123 4567', '+27821234567'],
  ])('accepts %j from abroad, with its country code', (input, expected) => {
    expect(normalizeGuestPhone(input)).toBe(expected);
  });

  it.each([
    '812 345 678', // no country code: read as Angolan, and not a valid one
    '+244 222 123 456', // an Angolan landline is not accepted as "foreign"
    '+244 9234', // a short Angolan number either
    '+0123456789', // country codes never start with 0
    '+123', // too short
    '+1234567890123456', // more than 15 digits
    'abc',
  ])('rejects %j', (input) => {
    expect(normalizeGuestPhone(input)).toBeNull();
  });

  it('formats Angolan numbers grouped and others as stored', () => {
    expect(formatGuestPhone('+244923456789')).toBe('+244 923 456 789');
    expect(formatGuestPhone('+351912345678')).toBe('+351912345678');
  });

  it('validates with Zod and reports a Portuguese message', () => {
    expect(guestPhoneSchema.parse('00 351 912 345 678')).toBe('+351912345678');
    expect(guestPhoneSchema.safeParse('12345').error?.issues[0]?.message).toBe(
      validation.phone.invalidGuest,
    );
  });
});
