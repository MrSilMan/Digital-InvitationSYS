import type { Metadata } from 'next';
import Link from 'next/link';

import { cardClasses } from '@/components/dashboard/styles';
import { ChangePasswordForm } from '@/features/account/change-password-form';
import { account } from '@/i18n/pt-AO';
import { requireUser } from '@/server/auth/session';

const t = account;

export const metadata: Metadata = { title: t.title };

/** The signed-in user's own account (couples and admins): details and password. */
export default async function AccountPage() {
  const user = await requireUser();
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8">
      <h1 className="text-2xl font-semibold">{t.title}</h1>
      <section aria-labelledby="os-seus-dados" className={`${cardClasses} flex flex-col gap-3 p-5`}>
        <h2 id="os-seus-dados" className="text-lg font-semibold">
          {t.details.legend}
        </h2>
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium tracking-wide text-stone-500 uppercase">
              {t.details.name}
            </dt>
            <dd className="text-sm text-stone-900">{user.name}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium tracking-wide text-stone-500 uppercase">
              {t.details.email}
            </dt>
            <dd className="text-sm break-all text-stone-900">{user.email}</dd>
          </div>
        </dl>
        {user.role === 'admin' ? (
          <p className="text-xs text-stone-500">
            {t.details.adminHint}{' '}
            <Link
              href={`/admin/contas/${user.id}`}
              className="font-medium text-stone-700 underline underline-offset-2"
            >
              {t.details.adminLink}
            </Link>
            .
          </p>
        ) : (
          <p className="text-xs text-stone-500">{t.details.hint}</p>
        )}
      </section>
      <section
        aria-labelledby="alterar-palavra-passe"
        className={`${cardClasses} flex flex-col gap-3 p-5`}
      >
        <h2 id="alterar-palavra-passe" className="text-lg font-semibold">
          {t.password.legend}
        </h2>
        <p className="text-sm text-stone-600">{t.password.hint}</p>
        <ChangePasswordForm />
      </section>
    </main>
  );
}
