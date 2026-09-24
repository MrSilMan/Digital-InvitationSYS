import { dateParts, formatInvitationWeekdayTime, toLuandaIso } from '@/i18n/format';
import { cn } from '@/lib/cn';

interface DateLineProps {
  date: Date;
  /** Also show "SEXTA-FEIRA, ÀS 16H00" under the date. */
  withWeekday?: boolean;
  className?: string;
}

function Dot() {
  return (
    <span
      aria-hidden="true"
      className="mx-2 inline-block size-2 rounded-full bg-accent align-middle"
    />
  );
}

/** "15 • JANEIRO • 2027" with accent-coloured dots, in Luanda time. */
export function DateLine({ date, withWeekday = false, className }: DateLineProps) {
  const { day, month, year } = dateParts(date);
  return (
    <div className={cn('text-center text-ink', className)}>
      <time
        dateTime={toLuandaIso(date)}
        className="font-body text-[clamp(1.7rem,8.4cqi,2.4rem)] leading-none font-medium tracking-[0.02em] uppercase"
      >
        {day}
        <Dot />
        {month}
        <Dot />
        {year}
      </time>
      {withWeekday ? (
        <p className="mt-2 font-caps text-[clamp(1rem,4.6cqi,1.3rem)] tracking-wider text-ink">
          {formatInvitationWeekdayTime(date)}
        </p>
      ) : null}
    </div>
  );
}
