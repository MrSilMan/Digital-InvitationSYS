import { Icon } from '@/components/icons';
import { cn } from '@/lib/cn';

interface SectionTitleProps {
  /** Large handwritten word, e.g. "Mensagem". */
  script: string;
  /** Small-caps subtitle, e.g. "dos noivos" (write it in normal case: the font draws small caps). */
  caps?: string;
  /** Optional line icon above the title (e.g. "camera" for the gallery). */
  icon?: string;
  /** "end" pushes the subtitle to the right, as under "Cronograma". */
  capsAlign?: 'center' | 'end';
  as?: 'h1' | 'h2' | 'h3';
  /** For `aria-labelledby` on the section. */
  id?: string;
  className?: string;
}

/** The two-part title lockup: pink script word slightly overlapping a serif small-caps subtitle. */
export function SectionTitle({
  script,
  caps,
  icon,
  capsAlign = 'center',
  as: Heading = 'h2',
  id,
  className,
}: SectionTitleProps) {
  return (
    <Heading id={id} className={cn('flex flex-col items-center text-center', className)}>
      {icon ? <Icon name={icon} size={56} stroke={1.25} className="mb-1 text-accent" /> : null}
      <span className="font-script text-[clamp(3rem,15cqi,4.5rem)] leading-[1.15] text-script">
        {script}
      </span>{' '}
      {caps ? (
        <span
          className={cn(
            'relative mt-[-0.6em] font-caps text-[clamp(1.1rem,5.4cqi,1.5rem)] font-medium tracking-[0.06em] text-ink',
            capsAlign === 'end' && 'self-end pr-[14%]',
          )}
        >
          {caps}
        </span>
      ) : null}
    </Heading>
  );
}
