import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { MediaImage } from './media-image';

describe('MediaImage', () => {
  it('lets the browser choose among the processed files, never re-encoding them', () => {
    const html = renderToStaticMarkup(
      <MediaImage
        src="/m/ev-1/md-2/w1600.webp"
        widths={[480, 960, 1600]}
        width={1600}
        height={2000}
        alt="Os noivos"
        sizes="100vw"
      />,
    );
    expect(html).toContain('/m/ev-1/md-2/w960.webp 640w');
    expect(html).toContain('/m/ev-1/md-2/w1600.webp 3840w');
    expect(html).toContain('src="/m/ev-1/md-2/w1600.webp"');
    expect(html).not.toContain('/_next/image');
  });

  it('serves a single processed file as it is', () => {
    const html = renderToStaticMarkup(
      <MediaImage src="/m/ev-1/md-2/w300.webp" widths={[300]} width={300} height={200} alt="" />,
    );
    expect(html).toContain('src="/m/ev-1/md-2/w300.webp"');
    expect(html).not.toContain('srcSet');
    expect(html).not.toContain('srcset');
  });

  it('sends theme art and demo photos through the image optimizer', () => {
    const html = renderToStaticMarkup(
      <MediaImage src="/themes/praia-rosa/hero.webp" width={1080} height={600} alt="" />,
    );
    expect(html).toContain('/_next/image?url=%2Fthemes%2Fpraia-rosa%2Fhero.webp');
  });
});
