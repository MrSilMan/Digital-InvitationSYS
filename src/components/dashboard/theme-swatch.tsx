import { cn } from '@/lib/cn';
import { getTheme } from '@/themes';

const SIZES = { sm: 'size-5', md: 'size-7', lg: 'size-10' } as const;

/**
 * A theme's colours in a small circle: paper, the script colour and the accent. Decorative (the
 * theme's name is always written next to it). The theme's own values, so no theme root is needed.
 */
export function ThemeSwatch({
  themeId,
  size = 'sm',
}: {
  themeId: string;
  size?: keyof typeof SIZES;
}) {
  const { colors } = getTheme(themeId);
  return (
    <span
      aria-hidden="true"
      className={cn('inline-block shrink-0 rounded-full ring-1 ring-black/10', SIZES[size])}
      style={{
        background: `linear-gradient(135deg, ${colors.background} 0 48%, ${colors.script} 48% 74%, ${colors.accent} 74%)`,
      }}
    />
  );
}
