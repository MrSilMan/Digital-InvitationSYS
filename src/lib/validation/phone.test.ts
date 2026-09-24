import { describe, expect, it } from 'vitest';

import { validation } from '@/i18n/pt-AO';
import {
  angolanPhoneSchema,
  formatAngolanPhone,
  normalizeAngolanPhone,
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
