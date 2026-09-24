import { Icon } from '@/components/icons';
import { ThemeRoot } from '@/components/theme/theme-root';
import { CornerDecorations } from '@/components/ui/corner-decorations';
import { t } from '@/i18n';
import { DEFAULT_THEME_ID, getTheme } from '@/themes';

/**
 * "Convite não encontrado": malformed or unknown links, links of another event, inactive events.
 * They all look the same, so a link reveals nothing about which events or guests exist.
 */
export default function InvitationNotFound() {
  const theme = getTheme(DEFAULT_THEME_ID);
  const { notFound } = t.invitation;
  return (
    <ThemeRoot theme={theme} className="min-h-svh">
      <main className="relative mx-auto flex min-h-svh max-w-120 flex-col items-center justify-center gap-6 overflow-hidden px-6 text-center">
        <CornerDecorations theme={theme} area="closing" eager />
        <Icon name="heart" size={56} stroke={1.25} className="relative text-accent" />
        <h1 className="relative font-caps text-[clamp(1.8rem,8cqi,2.4rem)] leading-tight font-medium tracking-wide">
          {notFound.title}
        </h1>
        <p className="relative max-w-88 font-body text-[clamp(1.15rem,5.2cqi,1.35rem)] leading-snug text-balance">
          {notFound.description}
        </p>
      </main>
    </ThemeRoot>
  );
}
