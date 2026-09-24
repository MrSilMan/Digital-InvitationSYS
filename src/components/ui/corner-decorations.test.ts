import { describe, expect, it } from 'vitest';

import { decorationSizes, decorationStyle } from '@/components/ui/corner-decorations';
import type { Decoration } from '@/themes';

const corner = (position: Decoration['position']): Decoration => ({
  image: 'corner',
  position,
  width: '40%',
  maxWidth: 240,
  offset: { x: -6, y: -8 },
});

describe('decorationStyle', () => {
  it.each([
    ['top-left', { top: 0, left: 0, transform: 'translate(-6%, -8%)' }],
    ['top-right', { top: 0, right: 0, transform: 'translate(6%, -8%) scaleX(-1)' }],
    ['bottom-left', { bottom: 0, left: 0, transform: 'translate(-6%, 8%) scaleY(-1)' }],
    ['bottom-right', { bottom: 0, right: 0, transform: 'translate(6%, 8%) scale(-1)' }],
  ] as const)('mirrors top-left artwork into the %s corner, pushed outwards', (position, style) => {
    expect(decorationStyle(corner(position))).toEqual({ width: '40%', maxWidth: 240, ...style });
  });

  it('places edge artwork without an offset flush with the edge', () => {
    const garland: Decoration = { image: 'garland', position: 'bottom', width: '64%' };
    expect(decorationStyle(garland)).toEqual({
      width: '64%',
      maxWidth: undefined,
      bottom: 0,
      right: 0,
      transform: 'translate(0%, 0%) scale(-1)',
    });
  });
});

describe('decorationSizes', () => {
  it('asks for a share of the viewport on phones and the capped width above', () => {
    // 40% of the viewport reaches 240px at 600px wide.
    expect(decorationSizes(corner('top-left'))).toBe('(max-width: 600px) 40vw, 240px');
  });

  it('falls back to the plain width without a cap', () => {
    expect(decorationSizes({ image: 'garland', position: 'top', width: '78%' })).toBe('78%');
  });
});
