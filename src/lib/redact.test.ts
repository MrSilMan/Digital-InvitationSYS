import { describe, expect, it } from 'vitest';

import { maskIban, maskPhone, REDACTED, redact, redactEntry, redactString } from '@/lib/redact';

describe('redactString', () => {
  it('masks guest tokens in invitation URLs, keeping the first 4 characters', () => {
    expect(redactString('GET /c/bm-2026/AbCdEfGhIjKlMnOpQr 200')).toBe(
      'GET /c/bm-2026/AbCd**** 200',
    );
    expect(redactString('https://convites.ao/c/braulio-nanda/x9Y8z7W6v5U4t3S2?utm=1')).toBe(
      'https://convites.ao/c/braulio-nanda/x9Y8****?utm=1',
    );
  });

  it('leaves invitation paths without a token alone', () => {
    expect(redactString('/c/bm-2026')).toBe('/c/bm-2026');
    expect(redactString('/c/bm-2026/abc')).toBe('/c/bm-2026/abc');
  });

  it('masks sensitive query parameters, including presigned URL credentials', () => {
    expect(redactString('/api/x?token=abc123&page=2')).toBe('/api/x?token=[REDACTED]&page=2');
    expect(
      redactString(
        'https://s3.local/b/k.webp?X-Amz-Credential=AKIA%2F1&X-Amz-Signature=beef&X-Amz-Expires=300',
      ),
    ).toBe(
      'https://s3.local/b/k.webp?X-Amz-Credential=[REDACTED]&X-Amz-Signature=[REDACTED]&X-Amz-Expires=300',
    );
  });

  it('masks bearer tokens and JWTs', () => {
    expect(redactString('Authorization: Bearer abc.def-ghi_jkl')).toBe(
      'Authorization: Bearer [REDACTED]',
    );
    const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0In0.c2lnbmF0dXJl';
    expect(redactString(`valor ${jwt}`)).toBe('valor [REDACTED_JWT]');
  });

  it('masks Angolan and international phone numbers, keeping the last 3 digits', () => {
    expect(redactString('Ligar para +244 923 456 789')).toBe('Ligar para ***789');
    expect(redactString('WhatsApp 00244923456789')).toBe('WhatsApp ***789');
    expect(redactString('telefone 923456789.')).toBe('telefone ***789.');
    expect(redactString('telefone 923-456-789')).toBe('telefone ***789');
    expect(redactString('Portugal +351 912 345 678')).toBe('Portugal ***678');
  });

  it('masks IBANs, keeping the country/check digits and the last 4 characters', () => {
    expect(redactString('IBAN AO06 0044 0000 0123 4567 8910 1 ok')).toBe('IBAN AO06****9101 ok');
    expect(redactString('IBAN AO06004400000123456789101')).toBe('IBAN AO06****9101');
  });

  it('masks e-mail addresses', () => {
    expect(redactString('login falhou para noiva@example.com')).toBe(
      'login falhou para n***@example.com',
    );
  });

  it('does not change ordinary log content', () => {
    const plain =
      'GET /api/health 200 3.21ms request 5f0c7a2e-4b1d-4c7e-9a3f-2d8e1b6c9f00 release 3f9a1c2 at 16h30';
    expect(redactString(plain)).toBe(plain);
  });

  it('is idempotent', () => {
    const once = redactString(
      'GET /c/ev/AbCdEfGhIjKlMnOpQr?token=x +244 923 456 789 a@b.co AO06004400000123456789101',
    );
    expect(redactString(once)).toBe(once);
  });

  it('truncates very long strings', () => {
    expect(redactString('x'.repeat(10_000), 100)).toBe(`${'x'.repeat(100)}…[truncated]`);
  });
});

describe('maskPhone / maskIban', () => {
  it('keeps only the useful tail', () => {
    expect(maskPhone('+244 923 456 789')).toBe('***789');
    expect(maskIban('AO06 0044 0000 0123 4567 8910 1')).toBe('AO06****9101');
  });

  it('fully redacts values too short to mask safely', () => {
    expect(maskPhone('12')).toBe(REDACTED);
    expect(maskIban('AO06')).toBe(REDACTED);
  });
});

describe('redact', () => {
  it('redacts values under sensitive keys, at any depth', () => {
    const input = {
      user: { email: 'a@b.co', password: 'hunter2' },
      headers: {
        authorization: 'Bearer abcdefghij',
        cookie: 'session=1',
        'x-request-id': 'req-12345678',
      },
      guest: { displayName: 'Família Silva', phone: '+244 923 456 789', guestToken: 'AbCdEfGh' },
      gift: { iban: 'AO06004400000123456789101' },
      companionNames: ['Ana', 'Rui'],
      emptyToken: '',
    };

    expect(redact(input)).toEqual({
      user: { email: 'a***@b.co', password: REDACTED },
      headers: { authorization: REDACTED, cookie: REDACTED, 'x-request-id': 'req-12345678' },
      guest: { displayName: REDACTED, phone: '***789', guestToken: REDACTED },
      gift: { iban: 'AO06****9101' },
      companionNames: REDACTED,
      emptyToken: '',
    });
  });

  it('serializes errors, dates, bigints and cycles without mutating the input', () => {
    const err = new Error('falhou para +244 923 456 789', { cause: new Error('token=abc') });
    const input: Record<string, unknown> = {
      when: new Date('2026-01-16T15:30:00Z'),
      err,
      big: 10n,
    };
    input.self = input;

    const out = redact(input) as Record<string, unknown>;

    expect(out.when).toBe('2026-01-16T15:30:00.000Z');
    expect(out.big).toBe('10');
    expect(out.self).toBe('[Circular]');
    expect(out.err).toMatchObject({
      name: 'Error',
      message: 'falhou para ***789',
      cause: { message: 'token=[REDACTED]' },
    });
    expect((out.err as { stack: string }).stack).toContain('***789');
    expect(err.message).toBe('falhou para +244 923 456 789');
  });

  it('truncates deep nesting and long arrays', () => {
    expect(redact({ a: { b: { c: 1 } } }, { maxDepth: 2 })).toEqual({ a: { b: '[Truncated]' } });
    expect(redact([1, 2, 3, 4], { maxArrayItems: 2 })).toEqual([1, 2, '[2 more]']);
  });
});

describe('redactEntry', () => {
  it('applies the key rule to top-level fields', () => {
    expect(redactEntry('password', 'x')).toBe(REDACTED);
    expect(redactEntry('whatsappNumber', '923456789')).toBe('***789');
    expect(redactEntry('path', '/c/ev/AbCdEfGhIjKlMnOp')).toBe('/c/ev/AbCd****');
    expect(redactEntry('status', 200)).toBe(200);
  });
});
