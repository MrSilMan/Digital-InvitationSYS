'use client';

import { IconCopy, IconKey } from '@tabler/icons-react';

import { buttonClasses } from '@/components/dashboard/styles';
import { useCopy } from '@/components/dashboard/use-copy';
import { admin } from '@/i18n/pt-AO';
import { fillTemplate } from '@/lib/template';

import type { TemporaryCredentials } from './types';

const t = admin.temporaryPassword;

/**
 * A temporary password, shown once: the admin copies it (or a ready-made message with the login
 * address and e-mail) and sends it to the couple. It is never stored in clear or shown again.
 */
export function TemporaryPassword({
  credentials,
  loginUrl,
}: {
  credentials: TemporaryCredentials;
  loginUrl: string;
}) {
  const password = useCopy();
  const message = useCopy();
  const text = fillTemplate(t.message, {
    url: loginUrl,
    email: credentials.email,
    password: credentials.password,
  });
  const failed = password.status === 'failed' || message.status === 'failed';

  return (
    <section
      aria-labelledby="palavra-passe-temporaria"
      className="flex flex-col gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4"
    >
      <h3
        id="palavra-passe-temporaria"
        className="flex items-center gap-2 text-sm font-semibold text-amber-950"
      >
        <IconKey size={18} stroke={1.75} aria-hidden="true" />
        {t.title}
      </h3>
      <p className="text-sm text-amber-950">{t.hint}</p>
      <p className="text-sm text-stone-700">{credentials.email}</p>
      <p
        className="rounded-lg bg-white px-3 py-2 font-mono text-lg tracking-wider text-stone-900 select-all"
        data-testid="temporary-password"
      >
        {credentials.password}
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void password.copy(credentials.password)}
          className={buttonClasses('secondary', 'sm')}
        >
          <IconCopy size={16} stroke={1.75} aria-hidden="true" />
          {password.status === 'copied' ? t.copied : t.copy}
        </button>
        <button
          type="button"
          onClick={() => void message.copy(text)}
          className={buttonClasses('secondary', 'sm')}
        >
          <IconCopy size={16} stroke={1.75} aria-hidden="true" />
          {message.status === 'copied' ? t.copied : t.copyMessage}
        </button>
      </div>
      {failed ? (
        <p role="alert" className="text-sm text-red-800">
          {t.copyFailed}
        </p>
      ) : null}
    </section>
  );
}
