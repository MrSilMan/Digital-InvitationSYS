import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { cardClasses } from '@/components/dashboard/styles';
import { LoginForm } from '@/features/auth/login-form';
import { app, auth } from '@/i18n/pt-AO';
import { safeReturnPath } from '@/lib/auth/return-path';
import { getSessionUser } from '@/server/auth/session';

export const metadata: Metadata = {
  title: auth.login.title,
  robots: { index: false, follow: false },
};

/** Login for couples and admins. `?voltar=/painel/…` returns there afterwards. */
export default async function LoginPage({ searchParams }: PageProps<'/entrar'>) {
  const { voltar } = await searchParams;
  const returnTo = safeReturnPath(voltar);
  if (await getSessionUser()) redirect(returnTo);

  return (
    <main className="flex min-h-svh items-center justify-center bg-stone-100 px-4 py-12 font-sans text-stone-900">
      <div className={`${cardClasses} w-full max-w-sm p-8`}>
        <p className="text-center font-serif text-2xl text-stone-700">{app.name}</p>
        <h1 className="mt-6 text-xl font-semibold">{auth.login.heading}</h1>
        <p className="mt-1 mb-6 text-sm text-stone-600">{auth.login.intro}</p>
        <LoginForm returnTo={returnTo} />
        <p className="mt-6 text-center text-xs text-stone-500">{auth.login.noAccount}</p>
      </div>
    </main>
  );
}
