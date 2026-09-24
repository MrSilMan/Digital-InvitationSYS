import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getServerEnv } from '@/env';
import { ComponentGallery } from '@/features/design-preview/component-gallery';
import { FontComparison } from '@/features/design-preview/font-comparison';
import { Palette } from '@/features/design-preview/palette';
import { designPreview } from '@/i18n/pt-AO';
import { getTheme } from '@/themes';

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
        <header className="space-y-2">
          <h1 className="font-sans text-3xl font-bold">{designPreview.title}</h1>
          <p className="max-w-2xl font-sans text-slate-600">{designPreview.intro}</p>
        </header>
        <FontComparison />
        <Palette theme={theme} />
        <ComponentGallery theme={theme} />
      </div>
    </main>
  );
}
