import type { Metadata, Viewport } from 'next';

import { getServerEnv } from '@/env';
import { FinalCall, Faq, HowItWorks } from '@/features/landing/closing-sections';
import { contactUrl, contactWhatsapp } from '@/features/landing/contact';
import { CouplePreviewProvider } from '@/features/landing/couple-preview';
import { demoWeddingDate } from '@/features/landing/demo-event';
import { Features } from '@/features/landing/features';
import { GuestJourney } from '@/features/landing/guest-journey';
import { Hero, Ribbon } from '@/features/landing/hero';
import { LandingRoot } from '@/features/landing/landing-root';
import styles from '@/features/landing/landing.module.css';
import { MAIN_ID, SiteFooter, SiteHeader } from '@/features/landing/site-chrome';
import { ThemeShowcase } from '@/features/landing/theme-showcase';
import { app, landing } from '@/i18n/pt-AO';
import { cn } from '@/lib/cn';
import { serverNow } from '@/lib/clock';

const { title, description } = landing.metadata;

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  openGraph: { title, description, type: 'website', locale: 'pt_AO', siteName: app.name },
  twitter: { card: 'summary_large_image', title, description },
};

export const viewport: Viewport = { themeColor: '#121826' };

/**
 * The public landing page: the themes, what an invitation includes, how it works. Couples do not
 * sign up here: every call opens a WhatsApp chat with the team (CONTACT_WHATSAPP), and "Entrar"
 * leads to the login. The examples take the names typed in the hero (nothing is sent).
 */
export default function HomePage() {
  const env = getServerEnv();
  const phone = contactWhatsapp(env.CONTACT_WHATSAPP);
  const contactHref = contactUrl(phone);
  const now = serverNow();
  const date = demoWeddingDate(now);
  // How a personal link looks in the WhatsApp example (never a real guest's token).
  const linkText = `${new URL(env.APP_URL).host}/c/braulio-e-nanda/…`;

  return (
    <LandingRoot>
      <CouplePreviewProvider sample={landing.sampleCouple}>
        <SiteHeader contactHref={contactHref} />
        <main id={MAIN_ID} tabIndex={-1} className={cn(styles.smoothScroll, 'outline-none')}>
          <Hero contactHref={contactHref} date={date} />
          <Ribbon />
          <ThemeShowcase contactPhone={phone} date={date} />
          <GuestJourney date={date} linkText={linkText} />
          <Features />
          <HowItWorks contactHref={contactHref} />
          <Faq />
          <FinalCall contactHref={contactHref} />
        </main>
        <SiteFooter contactHref={contactHref} year={now.getUTCFullYear()} />
      </CouplePreviewProvider>
    </LandingRoot>
  );
}
