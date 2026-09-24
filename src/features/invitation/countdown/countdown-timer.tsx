'use client';

import { useEffect, useState } from 'react';

import { clockOffset, countdownParts, type CountdownParts } from '../countdown';

type Unit = keyof CountdownParts;
const UNITS: readonly Unit[] = ['days', 'hours', 'minutes', 'seconds'];

interface CountdownTimerProps {
  /** Ceremony start, epoch ms. */
  target: number;
  /** Server time when the page was rendered, epoch ms. */
  serverNow: number;
  labels: {
    units: Record<Unit, { one: string; other: string }>;
    untilTheDay: string;
    after: string;
  };
}

/**
 * The phone's clock at the moment the server rendered the page: when the response started
 * arriving (Navigation Timing), or now if the browser does not say.
 */
function clientTimeOfServerRender(): number {
  const [navigation] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
  return navigation ? performance.timeOrigin + navigation.responseStart : Date.now();
}

/**
 * Days, hours, minutes and seconds to the ceremony. Counts against the server's clock (a phone set
 * to the wrong time still shows the right countdown); the first render uses the server's values so
 * it matches the HTML.
 */
export function CountdownTimer({ target, serverNow, labels }: CountdownTimerProps) {
  const [parts, setParts] = useState(() => countdownParts(target, serverNow));

  useEffect(() => {
    const offset = clockOffset(serverNow, clientTimeOfServerRender());
    let timer: ReturnType<typeof setTimeout> | undefined;
    const tick = () => {
      const now = Date.now() + offset;
      const next = countdownParts(target, now);
      setParts(next);
      // Next tick on the next whole second of server time.
      if (next) timer = setTimeout(tick, 1000 - (now % 1000) + 5);
    };
    timer = setTimeout(tick, 0);
    return () => clearTimeout(timer);
  }, [target, serverNow]);

  if (!parts) {
    return (
      <p className="max-w-88 font-body text-[clamp(1.3rem,6cqi,1.6rem)] leading-snug font-medium text-balance">
        {labels.after}
      </p>
    );
  }

  return (
    <div role="timer" className="w-full">
      <dl className="grid w-full grid-cols-4 gap-2">
        {UNITS.map((unit) => (
          <div
            key={unit}
            className="flex flex-col-reverse items-center rounded-2xl border border-accent/50 px-1 py-3"
          >
            <dt className="font-caps text-[clamp(0.8rem,3.8cqi,1rem)] tracking-wider text-muted">
              {parts[unit] === 1 ? labels.units[unit].one : labels.units[unit].other}
            </dt>
            <dd className="font-body text-[clamp(2rem,10cqi,2.8rem)] leading-none font-medium tabular-nums">
              {String(parts[unit]).padStart(unit === 'days' ? 1 : 2, '0')}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 font-caps text-[clamp(1rem,4.8cqi,1.25rem)] tracking-wider">
        {labels.untilTheDay}
      </p>
    </div>
  );
}
