import { describe, expect, it } from 'vitest';
import { config } from 'zod/v4/core';

import { disableZodEval } from './zod-settings';

describe('disableZodEval', () => {
  it("sets Zod's own jitless setting (the global Zod reads its settings from)", () => {
    disableZodEval();
    expect(config().jitless).toBe(true);
  });

  it('keeps the other settings', () => {
    const target = { __zod_globalConfig: { customError: 'kept' } };
    disableZodEval(target);
    expect(target.__zod_globalConfig).toEqual({ customError: 'kept', jitless: true });
  });
});
