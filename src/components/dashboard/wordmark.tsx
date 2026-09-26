import { LANDING_THEME_ID } from '@/features/landing/landing-root';
import { app } from '@/i18n/pt-AO';
import { cn } from '@/lib/cn';
import { THEMES, themeCssVariables } from '@/themes';
import { themeFontClassName } from '@/themes/fonts';

const WORDMARK_FONT = themeCssVariables(THEMES[LANDING_THEME_ID]);

/**
 * "Convites Digitais" in gold, in the landing page's script font, on the night frame of the
 * signed-in areas. That font is the only theme font they download (fonts load per glyph used).
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        themeFontClassName(LANDING_THEME_ID),
        'font-script leading-[1.2] text-gold',
        className,
      )}
      style={WORDMARK_FONT}
    >
      {app.name}
    </span>
  );
}
