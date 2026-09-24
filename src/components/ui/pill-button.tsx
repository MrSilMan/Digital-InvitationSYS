import Link from 'next/link';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { Icon } from '@/components/icons';

import { PILL_ICON_SIZE, pillButtonClasses, type PillShape } from './pill-button-classes';

interface CommonProps {
  /** Line icon on the left, drawn in the button's text colour (e.g. "map-pin", "check-circle"). */
  icon?: string;
  children: ReactNode;
  /** "pill" (Praia Rosa) or "circle" (Champanhe). */
  shape?: PillShape;
  className?: string;
}

type LinkProps = CommonProps & {
  href: string;
  /** Opens in a new tab without leaking the invitation URL (Google Maps, WhatsApp, Waze). */
  external?: boolean;
  /** A file to download (e.g. the .ics calendar file): a plain link, no client navigation. */
  download?: string;
};

type ButtonProps = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className'> & { href?: undefined };

export type PillButtonProps = LinkProps | ButtonProps;

/**
 * Accent-coloured call-to-action: link (internal or external) or button. Use <strong> inside the
 * label for the bold word, as in "CONFIRMAR <strong>PRESENÇA</strong>".
 */
export function PillButton(props: PillButtonProps) {
  const { icon, children, shape = 'pill', className } = props;
  const classes = pillButtonClasses(shape, className);
  const content = (
    <>
      {icon ? <Icon name={icon} size={PILL_ICON_SIZE[shape]} stroke={1.75} /> : null}
      <span>{children}</span>
    </>
  );

  if (props.href !== undefined) {
    if (props.external) {
      return (
        <a href={props.href} target="_blank" rel="noopener noreferrer" className={classes}>
          {content}
        </a>
      );
    }
    if (props.download !== undefined) {
      return (
        <a href={props.href} download={props.download} className={classes}>
          {content}
        </a>
      );
    }
    return (
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
