import { IconArrowLeft } from '@tabler/icons-react';
import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { getServerEnv } from '@/env';
import { LoginForm } from '@/features/auth/login-form';
import { contactUrl, contactWhatsapp } from '@/features/landing/contact';
import { WhatsappCta } from '@/features/landing/cta-links';
import { Petals, Sparkle } from '@/features/landing/decor';
import { LandingRoot } from '@/features/landing/landing-root';
import styles from '@/features/landing/landing.module.css';
import { app, auth } from '@/i18n/pt-AO';
import { defaultReturnPath, parseReturnPath } from '@/lib/auth/return-path';
import { cn } from '@/lib/cn';
import { getSessionUser } from '@/server/auth/session';

export const metadata: Metadata = {
  title: auth.login.title,
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: '#121826' };

const t = auth.login;

/**
 * Login for couples and admins. `?voltar=/painel/…` returns there afterwards; without it, couples
 * go to their dashboard and admins to the admin area.
 *
 * The landing page's night sky around an ivory card (a second LandingRoot, so the tokens inside it
 * take the paper colours again); the form fields keep the dashboard look they lead to.
 */
export default async function LoginPage({ searchParams }: PageProps<'/entrar'>) {
  const { voltar } = await searchParams;
  const returnTo = parseReturnPath(voltar);
  const user = await getSessionUser();
  if (user) redirect(returnTo ?? defaultReturnPath(user.role));

  const contactHref = contactUrl(contactWhatsapp(getServerEnv().CONTACT_WHATSAPP));

  return (
    <LandingRoot>
      <main
        className={cn(
          styles.night,
          styles.glow,
          'relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-4 py-12',
        )}
      >
        <Petals count={10} />
        <div className={cn(styles.rise, 'relative flex w-full max-w-md flex-col items-center')}>
          <Link href="/" className="relative px-2">
            <span className={cn(styles.gold, 'font-script text-[3.25rem] leading-[1.3]')}>
              {app.name}
            </span>
            <Sparkle className="top-1 -right-3 size-4 text-accent" />
            <Sparkle className="bottom-3 -left-3 size-3 text-script" delay={1.4} />
          </Link>

          <LandingRoot className="relative mt-6 w-full overflow-hidden rounded-[2rem] px-6 pt-11 pb-9 shadow-[0_40px_80px_-30px_rgb(0_0_0/0.75)] sm:px-10">
            <span
              aria-hidden="true"
              className={cn(styles.ribbon, 'absolute inset-x-0 top-0 h-1.5')}
            />
            <h1 className="text-center font-caps text-[1.75rem] leading-tight tracking-wide text-ink">
              {t.heading}
            </h1>
            <Ornament />
            <p className="mb-8 text-center font-body text-lg leading-snug text-muted">{t.intro}</p>
            <LoginForm returnTo={returnTo} />
            <div className="mt-9 border-t border-line/20 pt-7 text-center">
              <p className="font-body text-base leading-snug text-muted">{t.noAccount}</p>
              <div className="mt-4 flex justify-center">
                <WhatsappCta href={contactHref} variant="outline" size="small">
                  {t.contact}
                </WhatsappCta>
              </div>
            </div>
          </LandingRoot>

          <Link
            href="/"
            className="mt-8 inline-flex items-center gap-2 font-button text-sm text-muted transition-colors hover:text-accent"
          >
            <IconArrowLeft size={16} stroke={1.75} aria-hidden="true" />
            {t.backHome}
          </Link>
        </div>
      </main>
    </LandingRoot>
  );
}

/** Two gold rules and a star under the heading. Decorative. */
function Ornament() {
  return (
    <div aria-hidden="true" className="mx-auto my-4 flex w-32 items-center gap-3 text-accent">
      <span className="h-px flex-1 bg-current opacity-50" />
      <svg viewBox="0 0 24 24" className="size-3 fill-current">
        <path d="M12 0C13 8 16 11 24 12 16 13 13 16 12 24 11 16 8 13 0 12 8 11 11 8 12 0Z" />
      </svg>
      <span className="h-px flex-1 bg-current opacity-50" />
    </div>
  );
}
