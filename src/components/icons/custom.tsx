import { forwardRef, type ReactNode, type SVGProps } from 'react';

/**
 * Line icons Tabler does not have, drawn on the same 24×24 grid with round caps and joins so they
 * match Tabler's stroke style. Same props as Tabler icons (size, stroke, color, title).
 */

export interface LineIconProps extends Omit<SVGProps<SVGSVGElement>, 'stroke' | 'ref'> {
  size?: number | string;
  stroke?: number | string;
  color?: string;
  title?: string;
}

function createLineIcon(name: string, paths: ReactNode) {
  const Icon = forwardRef<SVGSVGElement, LineIconProps>(function LineIcon(
    { size = 24, stroke = 2, color = 'currentColor', title, className, ...rest },
    ref,
  ) {
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={['convites-icon', `convites-icon-${name}`, className].filter(Boolean).join(' ')}
        {...rest}
      >
        {title ? <title>{title}</title> : null}
        {paths}
      </svg>
    );
  });
  Icon.displayName = name;
  return Icon;
}

export const WeddingDressIcon = createLineIcon(
  'wedding-dress',
  <>
    <path d="M9.6 7.2 8.9 3.5M14.4 7.2l.7-3.7" />
    <path d="M9.6 7.2c.8.6 1.6.6 2.4 0c.8.6 1.6.6 2.4 0l-.6 3.6h-3.6z" />
    <path d="M10.2 10.8C9 13.6 6.7 16.9 4.5 20h15c-2.2-3.1-4.5-6.4-5.7-9.2" />
    <path d="M6.6 17.2c1 .7 2.2.7 3.1 0c1 .7 2.3.7 3.3 0c1 .7 2.2.7 3.2 0" />
    <path d="M12 12.6l-.5.5.5.5.5-.5z" />
  </>,
);

export const BrideGroomIcon = createLineIcon(
  'bride-groom',
  <>
    <circle cx="7.5" cy="4.6" r="1.9" />
    <path d="M5.8 3.6C4.6 5 4 7.2 4 9.8" />
    <path d="M7.5 7.3c-1 0-1.7.8-1.9 1.8L4 20h7L9.4 9.1c-.2-1-.9-1.8-1.9-1.8z" />
    <circle cx="16.5" cy="4.6" r="1.9" />
    <path d="M13.8 20v-9.4c0-1.6 1.2-3 2.7-3s2.7 1.4 2.7 3V20" />
    <path d="M16.5 7.6l-.9 1.6.9 2.2.9-2.2zM16.5 14v6" />
  </>,
);

export const BouquetIcon = createLineIcon(
  'bouquet',
  <>
    <circle cx="12" cy="4.4" r="2" />
    <circle cx="8.3" cy="6.6" r="2" />
    <circle cx="15.7" cy="6.6" r="2" />
    <path d="M9.4 8.4 12 13M14.6 8.4 12 13M12 6.4V13" />
    <path d="M7.4 9.6c-1.7 0-3-1.1-3.2-2.6c1.6-.2 3 .7 3.5 2" />
    <path d="M16.6 9.6c1.7 0 3-1.1 3.2-2.6c-1.6-.2-3 .7-3.5 2" />
    <path d="M8.4 12.4 12 21l3.6-8.6z" />
    <path d="M10.4 16.2c1 .6 2.2.6 3.2 0" />
  </>,
);

export const DancingCoupleIcon = createLineIcon(
  'dancing-couple',
  <>
    <circle cx="7.4" cy="5.2" r="1.7" />
    <path d="M7.4 7.4v5.8M7.4 13.2 5.6 20M7.4 13.2l1.9 6.8" />
    <path d="M7.4 9.2 12 4.4l4.6 4.8" />
    <path d="M7.4 9.6 4.8 11.8" />
    <circle cx="16.6" cy="5.2" r="1.7" />
    <path d="M16.6 7.4 13.9 16h5.4z" />
    <path d="M15.6 16v4M17.6 16v4" />
    <path d="M16.6 9.6 19.2 11.8" />
    <path d="M3.5 3.5l.6.9M20.5 3.5l-.6.9M12 1.8v1" />
  </>,
);
