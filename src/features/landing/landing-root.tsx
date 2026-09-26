import type { CSSProperties, ReactNode } from 'react';

import { cn } from '@/lib/cn';
import { THEMES, themeCssVariables, type ThemeId } from '@/themes';
import { themeFontClassName } from '@/themes/fonts';

/**
 * The landing page's own look. It borrows the Champanhe theme's fonts (Great Vibes, Cinzel,
 * EB Garamond: no extra font files, the Champanhe examples need them anyway) and its paper, and
 * sets the theme variables with its own colours, so the invitation tokens (`font-script`,
 * `text-accent`, `font-caps`…) work on the whole page. Examples of a theme put a ThemeRoot inside;
 * the night sections redefine the colours (landing.module.css → .night).
 *
 * Colours on the ivory paper: ink 14:1, muted 6.8:1, script (rose) 5.4:1, accent 5.6:1, and white
 * on the accent 6:1.
 */
/**
 * The theme whose fonts the page uses. The hero shows it, and the theme gallery starts with it:
 * another theme on the first screens would download its fonts and artwork before the page's own
 * first paint.
 */
export const LANDING_THEME_ID: ThemeId = 'champanhe';

const LANDING_VARIABLES = {
  ...themeCssVariables(THEMES[LANDING_THEME_ID]),
  '--theme-background': '#fbf7ef',
  '--theme-ink': '#1d2433',
  '--theme-muted': '#4f5868',
  '--theme-script': '#b23a61',
  '--theme-accent': '#7d5e22',
  '--theme-accent-contrast': '#ffffff',
  '--theme-line': '#7d5e22',
} as CSSProperties;

export function LandingRoot({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(themeFontClassName(LANDING_THEME_ID), 'theme-surface', className)}
      style={LANDING_VARIABLES}
    >
      {children}
    </div>
  );
}
