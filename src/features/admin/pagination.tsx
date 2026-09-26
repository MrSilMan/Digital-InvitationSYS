import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import Link from 'next/link';

import { buttonClasses } from '@/components/dashboard/styles';
import { admin } from '@/i18n/pt-AO';
import { fillTemplate } from '@/lib/template';

const t = admin.common;

interface PaginationProps {
  page: number;
  pages: number;
  /** The link to another page of the same list (same filters). */
  hrefFor: (page: number) => string;
}

/** Previous / next links at the foot of a list card; nothing when everything fits on one page. */
export function Pagination({ page, pages, hrefFor }: PaginationProps) {
  if (pages <= 1) return null;
  return (
    <nav
      aria-label={t.pagination}
      className="flex items-center justify-between gap-3 border-t border-stone-200 px-4 py-3"
    >
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} rel="prev" className={buttonClasses('secondary', 'sm')}>
          <IconChevronLeft size={16} stroke={2} aria-hidden="true" />
          {t.previous}
        </Link>
      ) : (
        <span />
      )}
      <p className="text-sm text-stone-600 tabular-nums">
        {fillTemplate(t.page, { page: String(page), pages: String(pages) })}
      </p>
      {page < pages ? (
        <Link href={hrefFor(page + 1)} rel="next" className={buttonClasses('secondary', 'sm')}>
          {t.next}
          <IconChevronRight size={16} stroke={2} aria-hidden="true" />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
