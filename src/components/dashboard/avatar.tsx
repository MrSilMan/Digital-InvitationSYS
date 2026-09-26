import { cn } from '@/lib/cn';

/** Words left out of initials: "Ana e João" → "AJ". */
const JOINERS = new Set(['e', 'de', 'da', 'do', 'das', 'dos', '&']);

/** Up to two initials: the first and the last word of the name ("Braúlio & Nanda" → "BN"). */
export function initialsOf(name: string): string {
  const words = name
    .split(/\s+/)
    .filter((word) => /\p{L}/u.test(word) && !JOINERS.has(word.toLocaleLowerCase('pt-AO')));
  const first = words[0]?.match(/\p{L}/u)?.[0] ?? '?';
  const last = words.length > 1 ? (words.at(-1)?.match(/\p{L}/u)?.[0] ?? '') : '';
  return `${first}${last}`.toLocaleUpperCase('pt-AO');
}

/** Soft tones (every text ≥ 4.5:1 on its background: axe checks hidden text too). */
const TONES = [
  'bg-rose-100 text-rose-800',
  'bg-amber-100 text-amber-900',
  'bg-emerald-100 text-emerald-800',
  'bg-sky-100 text-sky-800',
  'bg-violet-100 text-violet-800',
  'bg-stone-200 text-stone-800',
] as const;

function toneOf(name: string): string {
  let sum = 0;
  for (const char of name) sum += char.codePointAt(0) ?? 0;
  return TONES[sum % TONES.length] ?? TONES[0];
}

const SIZES = {
  xs: 'size-7 text-[0.6875rem]',
  sm: 'size-9 text-xs',
  md: 'size-11 text-sm',
  lg: 'size-14 text-lg',
} as const;

/** A person's initials in a circle, always the same colour for the same name. Decorative. */
export function Avatar({
  name,
  size = 'sm',
  onNight = false,
}: {
  name: string;
  size?: keyof typeof SIZES;
  /** On the night frame (admin sidebar, dashboard header). */
  onNight?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-sans font-semibold tracking-wide select-none',
        SIZES[size],
        onNight ? 'bg-white/10 text-gold' : toneOf(name),
      )}
    >
      {initialsOf(name)}
    </span>
  );
}
