import { IconChevronRight } from '@tabler/icons-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { dashboard } from '@/i18n/pt-AO';
import { cn } from '@/lib/cn';

/**
 * What the pages of the signed-in areas (couple dashboard, admin) are made of: the page's
 * `<main>`, its header, panels, facts and empty states.
 */

const PAGE_WIDTHS = {
  wide: 'max-w-6xl',
  form: 'max-w-3xl',
  narrow: 'max-w-2xl',
} as const;

/** The page's `<main>`, centred in the space left by the header or sidebar. */
export function PageMain({
  width = 'wide',
  children,
}: {
  width?: keyof typeof PAGE_WIDTHS;
  children: ReactNode;
}) {
  return (
    <main
      className={cn(
        'mx-auto flex w-full flex-col gap-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-10',
        PAGE_WIDTHS[width],
      )}
    >
      {children}
    </main>
  );
}

interface PageHeaderProps {
  title: ReactNode;
  /** The couple's names are set in the serif, like on their invitation. */
  serif?: boolean;
  /** The pages above this one (the current page is the title). */
  parents?: { href: string; label: string }[];
  /** Before the title: an avatar or a swatch. Decorative. */
  leading?: ReactNode;
  badges?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}

/** Breadcrumbs, the page's `<h1>` with its badges, a line of context and the main actions. */
export function PageHeader({
  title,
  serif = false,
  parents,
  leading,
  badges,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3">
      {parents && parents.length > 0 ? (
        <nav aria-label={dashboard.breadcrumbs}>
          <ol className="flex flex-wrap items-center gap-1 text-sm text-stone-600">
            {parents.map((parent) => (
              <li key={parent.href} className="flex items-center gap-1">
                <Link
                  href={parent.href}
                  className="rounded underline-offset-4 hover:text-stone-900 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900"
                >
                  {parent.label}
                </Link>
                <IconChevronRight size={14} stroke={2} aria-hidden="true" />
              </li>
            ))}
          </ol>
        </nav>
      ) : null}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          {leading}
          <div className="flex min-w-0 flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h1
                className={cn(
                  'min-w-0 wrap-break-word text-stone-900',
                  serif
                    ? 'font-serif text-3xl leading-tight lining-nums sm:text-4xl'
                    : 'text-2xl font-semibold tracking-tight sm:text-3xl',
                )}
              >
                {title}
              </h1>
              {badges ? <div className="flex flex-wrap items-center gap-2">{badges}</div> : null}
            </div>
            {description ? <div className="text-sm text-stone-600">{description}</div> : null}
          </div>
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}

const PANEL_TONES = {
  default: { card: 'border-stone-200', header: 'border-stone-200', title: 'text-stone-900' },
  /** Changes that cannot be undone (deleting). */
  danger: { card: 'border-red-200', header: 'border-red-200 bg-red-50/60', title: 'text-red-800' },
} as const;

interface PanelProps {
  id: string;
  title: ReactNode;
  description?: ReactNode;
  /** Links or buttons at the right of the title. */
  actions?: ReactNode;
  /** The content reaches the panel's edges (lists with their own dividers). */
  flush?: boolean;
  tone?: keyof typeof PANEL_TONES;
  className?: string;
  children: ReactNode;
}

/** A titled card: a section of a page. */
export function Panel({
  id,
  title,
  description,
  actions,
  flush = false,
  tone = 'default',
  className,
  children,
}: PanelProps) {
  const look = PANEL_TONES[tone];
  return (
    <section
      aria-labelledby={id}
      className={cn(
        'flex flex-col overflow-hidden rounded-2xl border bg-white shadow-xs',
        look.card,
        className,
      )}
    >
      <div
        className={cn(
          'flex flex-wrap items-start justify-between gap-x-4 gap-y-2 border-b px-5 py-4',
          look.header,
        )}
      >
        <div className="flex min-w-0 flex-col gap-0.5">
          <h2 id={id} className={cn('text-base font-semibold', look.title)}>
            {title}
          </h2>
          {description ? <p className="text-sm text-stone-600">{description}</p> : null}
        </div>
        {actions}
      </div>
      <div className={flush ? undefined : 'p-5'}>{children}</div>
    </section>
  );
}

/** One label and value of a `<dl>`. */
export function Fact({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1', className)}>
      <dt className="text-xs font-medium tracking-wide text-stone-600 uppercase">{label}</dt>
      <dd className="text-sm text-stone-900">{children}</dd>
    </div>
  );
}

/** An empty list or a list without results: an icon, a line of text and maybe an action. */
export function EmptyState({
  icon,
  children,
  action,
}: {
  icon: ReactNode;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-stone-100 text-stone-600">
        {icon}
      </span>
      <p className="max-w-sm text-sm text-stone-600">{children}</p>
      {action}
    </div>
  );
}

/** A note about the whole page, e.g. "this is your own account". */
export function Callout({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <p>{children}</p>
    </div>
  );
}
