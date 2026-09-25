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

/** Previous / next links under a list; nothing when everything fits on one page. */
export function Pagination({ page, pages, hrefFor }: PaginationProps) {
  if (pages <= 1) return null;
  return (
    <nav aria-label={t.pagination} className="flex items-center justify-between gap-3">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} rel="prev" className={buttonClasses('secondary', 'sm')}>
          {t.previous}
        </Link>
      ) : (
        <span />
      )}
      <p className="text-sm text-stone-600">
        {fillTemplate(t.page, { page: String(page), pages: String(pages) })}
      </p>
      {page < pages ? (
        <Link href={hrefFor(page + 1)} rel="next" className={buttonClasses('secondary', 'sm')}>
          {t.next}
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
