import { describe, expect, it } from 'vitest';

import { clockOffset, countdownParts } from '@/features/invitation/countdown';

const ceremony = Date.parse('2027-01-15T15:00:00Z'); // 16h00 in Luanda

describe('countdown', () => {
  it('splits the time left into days, hours, minutes and seconds', () => {
    const now = ceremony - (3 * 86_400 + 4 * 3_600 + 5 * 60 + 6) * 1000;
    expect(countdownParts(ceremony, now)).toEqual({ days: 3, hours: 4, minutes: 5, seconds: 6 });
  });

  it('ignores milliseconds and ends exactly at the ceremony', () => {
    expect(countdownParts(ceremony, ceremony - 1_500)).toEqual({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 1,
    });
    expect(countdownParts(ceremony, ceremony - 999)).toBeNull();
    expect(countdownParts(ceremony, ceremony)).toBeNull();
    expect(countdownParts(ceremony, ceremony + 60_000)).toBeNull();
  });

  it('uses server time: a phone clock 2 hours fast still counts right', () => {
    const serverNow = ceremony - 86_400_000; // one day before
    const phoneClockThen = serverNow + 2 * 3_600_000;
    const offset = clockOffset(serverNow, phoneClockThen);
    // Ten seconds later on the phone:
    const phoneNow = phoneClockThen + 10_000;
    expect(countdownParts(ceremony, phoneNow + offset)).toEqual({
      days: 0,
      hours: 23,
      minutes: 59,
      seconds: 50,
    });
  });
});
