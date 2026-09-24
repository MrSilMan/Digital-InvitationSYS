import Link from 'next/link';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { Icon } from '@/components/icons';
import { cn } from '@/lib/cn';

interface CommonProps {
  /** Line icon on the left, drawn in the button's text colour (e.g. "map-pin", "check-circle"). */
  icon?: string;
  children: ReactNode;
  /** "pill" (Praia Rosa) or "circle" (Champanhe). */
  shape?: 'pill' | 'circle';
  className?: string;
}

type LinkProps = CommonProps & {
  href: string;
  /** Opens in a new tab without leaking the invitation URL (Google Maps, WhatsApp, Waze). */
  external?: boolean;
};

type ButtonProps = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className'> & { href?: undefined };

export type PillButtonProps = LinkProps | ButtonProps;

const SHAPES = {
  pill: 'min-h-14 gap-3 rounded-full px-8 py-3 text-[1.05rem]',
  circle: 'size-32 flex-col gap-1.5 rounded-full p-4 text-center text-[0.8rem] leading-tight',
} as const;

/**
 * Accent-coloured call-to-action: link (internal or external) or button. Use <strong> inside the
 * label for the bold word, as in "CONFIRMAR <strong>PRESENÇA</strong>".
 */
export function PillButton(props: PillButtonProps) {
  const { icon, children, shape = 'pill', className } = props;
  const classes = cn(
    'inline-flex items-center justify-center bg-accent font-button tracking-[0.06em] text-accent-contrast uppercase shadow-[0_8px_18px_-10px_rgb(0_0_0/0.55)] transition-[filter] hover:brightness-110 active:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent [&_strong]:font-bold',
    SHAPES[shape],
    className,
  );
  const content = (
    <>
      {icon ? <Icon name={icon} size={shape === 'pill' ? 28 : 34} stroke={1.75} /> : null}
      <span>{children}</span>
    </>
  );

  if (props.href !== undefined) {
    return props.external ? (
      <a href={props.href} target="_blank" rel="noopener noreferrer" className={classes}>
        {content}
      </a>
    ) : (
      <Link href={props.href} className={classes}>
        {content}
      </Link>
    );
  }

  const { icon: _icon, children: _children, shape: _shape, className: _className, ...rest } = props;
  return (
    <button type="button" {...rest} className={classes}>
      {content}
    </button>
  );
}
