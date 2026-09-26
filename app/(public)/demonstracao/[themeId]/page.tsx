import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';

import { getServerEnv } from '@/env';
import { InvitationView } from '@/features/invitation/invitation-view';
import { contactUrl, contactWhatsapp } from '@/features/landing/contact';
import { DemoBar } from '@/features/landing/demo-bar';
import { demoInvitation } from '@/features/landing/demo-event';
import { app, landing } from '@/i18n/pt-AO';
import { serverNow } from '@/lib/clock';
import { fillTemplate } from '@/lib/template';
import { isThemeId, THEMES, type ThemeId } from '@/themes';

type Props = PageProps<'/demonstracao/[themeId]'>;

async function themeIdOf(params: Props['params']): Promise<ThemeId | null> {
  const { themeId } = await params;
  return isThemeId(themeId) ? themeId : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const themeId = await themeIdOf(params);
  if (!themeId) return {};
  const theme = THEMES[themeId].name;
  const title = fillTemplate(landing.demo.title, { theme });
  const description = fillTemplate(landing.demo.description, { theme });
  return {
    title,
    description,
    openGraph: { title, description, type: 'website', locale: 'pt_AO', siteName: app.name },
  };
}

export const viewport: Viewport = { colorScheme: 'light' };

/**
 * A theme's public demo: the whole invitation with the demo wedding (built in memory, no
 * database), as the dashboard's preview shows it: the envelope every time, and inert RSVP,
 * WhatsApp and calendar buttons. The bar on top leads back to the landing page or to WhatsApp.
 */
export default async function ThemeDemoPage({ params }: Props) {
  const themeId = await themeIdOf(params);
  if (!themeId) notFound();
  const theme = THEMES[themeId];
  const now = serverNow();
  const phone = contactWhatsapp(getServerEnv().CONTACT_WHATSAPP);

  return (
    <>
      <DemoBar contactHref={contactUrl(phone, theme.name)} themeName={theme.name} />
      <InvitationView
        invitation={demoInvitation(themeId, now)}
        rsvp={null}
        theme={theme}
        now={now}
        guestToken=""
        basePath=""
        preview={{ showEnvelope: true }}
      />
    </>
  );
}
