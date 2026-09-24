/** Countdown maths, shared by the server render and the ticking client component. */

export interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

/** Time left until `targetMs`, or null once it has passed. */
export function countdownParts(targetMs: number, nowMs: number): CountdownParts | null {
  const left = Math.floor((targetMs - nowMs) / 1000);
  if (!Number.isFinite(left) || left <= 0) return null;
  return {
    days: Math.floor(left / 86_400),
    hours: Math.floor((left % 86_400) / 3_600),
    minutes: Math.floor((left % 3_600) / 60),
    seconds: left % 60,
  };
}

/**
 * How far the phone's clock is from the server's: `serverNowMs` was read while the page was
 * rendered, `clientMsThen` is the phone's clock at that moment (when the response started
 * arriving). Adding the offset to Date.now() gives server time, whatever the phone's settings.
 */
export function clockOffset(serverNowMs: number, clientMsThen: number): number {
  return serverNowMs - clientMsThen;
}
