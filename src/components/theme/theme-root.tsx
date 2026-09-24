import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';
import { themeCssVariables, type ThemeDefinition } from '@/themes';
import { themeFontClassName } from '@/themes/fonts';
import type { ThemeOverrides } from '@/themes/overrides';

interface ThemeRootProps {
  theme: ThemeDefinition;
  overrides?: ThemeOverrides;
  /** Make the root a size container (default). Turn off when a wrapper inside sets the width. */
  container?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * Applies a theme to everything inside it: CSS variables for colours and fonts (read by the
 * Tailwind tokens), the font files, and the watercolour paper texture.
 * It is also a size container: components size text with `cqi` units, so the invitation scales
 * with its own width (a phone screen, or the dashboard's phone-frame preview).
 */
export function ThemeRoot({
  theme,
  overrides,
  container = true,
  className,
  children,
}: ThemeRootProps) {
  return (
    <div
      data-theme={theme.id}
      className={cn(
        themeFontClassName(theme.id),
        container && '@container',
        'theme-surface',
        className,
      )}
      style={themeCssVariables(theme, overrides)}
    >
      {children}
    </div>
  );
}
