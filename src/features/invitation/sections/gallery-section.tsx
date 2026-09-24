import { SectionTitle } from '@/components/ui/section-title';
import { invitation } from '@/i18n/pt-AO';

import { GalleryCarousel } from '../gallery/gallery-carousel';
import { SectionPage } from '../section-page';
import { fillTemplate } from '../text';

import type { SectionProps } from './types';

const HEADING_ID = 'secao-galeria';
const t = invitation.sections.gallery;

/** "Galeria de fotos" (reference "6 de 14"): coverflow carousel and full-screen lightbox. */
export function GallerySection({ event, theme }: SectionProps) {
  const total = String(event.gallery.length);
  const photos = event.gallery.map((photo, index) => ({
    src: photo.src,
    width: photo.width,
    height: photo.height,
    alt: photo.alt ?? fillTemplate(t.photoAlt, { n: String(index + 1), total }),
  }));

  return (
    <SectionPage
      theme={theme}
      area="gallery"
      labelledBy={HEADING_ID}
      padded={false}
      contentClassName="gap-4"
    >
      <div className="flex flex-col items-center gap-3 px-6">
        <SectionTitle id={HEADING_ID} icon="camera" script={t.script} />
        <p className="max-w-64 font-caps text-[clamp(1.1rem,5.2cqi,1.35rem)] tracking-wider text-balance">
          {t.subtitle}
        </p>
      </div>
      <GalleryCarousel
        photos={photos}
        labels={{
          openPhoto: t.openPhoto,
          previous: t.previous,
          next: t.next,
          close: invitation.buttons.close,
          counter: t.counter,
          dialog: t.script,
        }}
      />
    </SectionPage>
  );
}
