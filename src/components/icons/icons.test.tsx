import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { Icon, ICON_KEYS, isIconKey } from '@/components/icons';
import { DEFAULT_GUEST_RULES } from '@/lib/event-defaults';

import { DEMO_TIMELINE } from '../../../prisma/seed/demo-data';

describe('icon registry', () => {
  it('has every icon that default and demo data refer to', () => {
    const used = [...DEFAULT_GUEST_RULES, ...DEMO_TIMELINE].map((item) => item.icon);
    expect(used.filter((key) => !isIconKey(key))).toEqual([]);
  });

  it('only accepts its own keys', () => {
    expect(isIconKey('guests')).toBe(true);
    expect(isIconKey('toString')).toBe(false);
    expect(isIconKey(42)).toBe(false);
  });

  it.each(ICON_KEYS)('renders "%s" as an SVG', (key) => {
    expect(renderToStaticMarkup(<Icon name={key} />)).toMatch(/^<svg[^>]*>.+<\/svg>$/s);
  });
});

describe('Icon', () => {
  it('is hidden from screen readers unless it has a title', () => {
    const decorative = renderToStaticMarkup(<Icon name="clock" />);
    expect(decorative).toContain('aria-hidden="true"');
    expect(decorative).not.toContain('role="img"');

    const labelled = renderToStaticMarkup(<Icon name="clock" title="Horário" />);
    expect(labelled).not.toContain('aria-hidden');
    expect(labelled).toContain('role="img"');
    expect(labelled).toContain('<title>Horário</title>');
  });

  it('falls back to the heart for unknown keys (old data)', () => {
    expect(renderToStaticMarkup(<Icon name="no-such-icon" />)).toBe(
      renderToStaticMarkup(<Icon name="heart" />),
    );
  });
});
