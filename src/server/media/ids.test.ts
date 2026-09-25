import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { uuidv7 } from './ids';

describe('uuidv7', () => {
  it('is a version 7 UUID carrying the time', () => {
    const now = Date.UTC(2026, 8, 24, 12, 0, 0);
    const id = uuidv7(now);
    expect(z.uuid().safeParse(id).success).toBe(true);
    expect(id[14]).toBe('7');
    expect(['8', '9', 'a', 'b']).toContain(id[19]);
    expect(Number.parseInt(id.replace(/-/g, '').slice(0, 12), 16)).toBe(now);
  });

  it('sorts by creation time and never repeats', () => {
    const earlier = uuidv7(1_000);
    const later = uuidv7(2_000);
    expect(earlier < later).toBe(true);
    expect(new Set(Array.from({ length: 1000 }, () => uuidv7())).size).toBe(1000);
  });
});
