import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getServerEnv } from '@/env';
import { ComponentGallery } from '@/features/design-preview/component-gallery';
import { FontComparison } from '@/features/design-preview/font-comparison';
import { Palette } from '@/features/design-preview/palette';
import { designPreview } from '@/i18n/pt-AO';
import { cn } from '@/lib/cn';
import { getTheme, THEMES } from '@/themes';

export const metadata: Metadata = {
  title: designPreview.title,
  robots: { index: false, follow: false },
};

/**
 * Internal design preview: fonts, theme colours and shared components. Never in production.
 * `/design?theme=<id>` previews another theme (unknown IDs show the default one).
 */
export default async function DesignPage({ searchParams }: PageProps<'/design'>) {
  if (getServerEnv().APP_ENV === 'production') notFound();
  const { theme: themeId } = await searchParams;
  const theme = getTheme(typeof themeId === 'string' ? themeId : undefined);

  return (
    <main className="min-h-svh bg-slate-50 px-4 py-10 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-6xl space-y-14">
        <header className="space-y-4">
          <h1 className="font-sans text-3xl font-bold">{designPreview.title}</h1>
          <p className="max-w-2xl font-sans text-slate-600">{designPreview.intro}</p>
          <nav aria-label={designPreview.themes} className="flex flex-wrap items-center gap-2">
            <span className="font-sans text-sm font-semibold text-slate-700">
              {designPreview.themes}:
            </span>
            {Object.values(THEMES).map(({ id, name }) => (
              <Link
                key={id}
                href={`/design?theme=${id}`}
                aria-current={id === theme.id ? 'page' : undefined}
                className={cn(
                  'rounded-full border px-4 py-1.5 font-sans text-sm',
                  id === theme.id
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-300 bg-white text-slate-700 hover:border-slate-500',
                )}
              >
                {name}
              </Link>
            ))}
          </nav>
        </header>
        <FontComparison theme={theme} />
        <Palette theme={theme} />
        <ComponentGallery theme={theme} />
      </div>
    </main>
  );
}
