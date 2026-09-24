import { cn } from '@/lib/cn';

interface MonogramProps {
  /** The couple's initials, e.g. "BN". Only the first two letters are used. */
  initials: string;
  className?: string;
}

/** Monogram letters as used on the monogram: the first two letters, upper-cased. */
export function monogramLetters(initials: string): string[] {
  return Array.from(initials.toLocaleUpperCase('pt-AO'))
    .filter((character) => /\p{L}/u.test(character))
    .slice(0, 2);
}

/**
 * The couple's initials as an interlocking serif monogram in the accent colour: the second letter
 * overlaps the first, slightly lower. Decorative (the names appear in full elsewhere).
 * Font size follows the parent, so size it with a text class (e.g. text-7xl).
 */
export function Monogram({ initials, className }: MonogramProps) {
  const [first, second] = monogramLetters(initials);
  if (!first) return null;
  return (
    <div
      aria-hidden="true"
      className={cn(
        'inline-flex items-start font-caps leading-none font-medium text-accent select-none',
        className,
      )}
    >
      <span>{first}</span>
      {second ? <span className="ml-[-0.3em] translate-y-[0.14em]">{second}</span> : null}
    </div>
  );
}
