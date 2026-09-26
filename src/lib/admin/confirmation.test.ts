import { describe, expect, it } from 'vitest';

import { confirmsAccount, confirmsEvent } from './confirmation';

describe('typed confirmations', () => {
  it("takes the event's address exactly (spaces around it are ignored)", () => {
    expect(confirmsEvent(' braulio-e-nanda ', 'braulio-e-nanda')).toBe(true);
    expect(confirmsEvent('Braulio-e-Nanda', 'braulio-e-nanda')).toBe(false);
    expect(confirmsEvent('braulio-e-nanda-2', 'braulio-e-nanda')).toBe(false);
    expect(confirmsEvent('', 'braulio-e-nanda')).toBe(false);
  });

  it("takes the account's e-mail in any case", () => {
    expect(confirmsAccount('Noivos@Convites.test ', 'noivos@convites.test')).toBe(true);
    expect(confirmsAccount('noivos@convites', 'noivos@convites.test')).toBe(false);
  });
});
