'use client';

import { IconCalendarPlus, IconCircleCheck, IconUser } from '@tabler/icons-react';
import Link from 'next/link';
import { useState } from 'react';

import { buttonClasses, cardClasses } from '@/components/dashboard/styles';
import { admin } from '@/i18n/pt-AO';
import { cn } from '@/lib/cn';

import { AccountForm } from './account-form';
import { addAccount } from './actions';
import { Notice, type NoticeState } from './notice';
import { TemporaryPassword } from './temporary-password';
import type { TemporaryCredentials } from './types';

const t = admin.newAccount;

/** Creates a couple's account and shows its temporary password once. */
export function NewAccount({ loginUrl }: { loginUrl: string }) {
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [created, setCreated] = useState<{
    userId: string;
    credentials: TemporaryCredentials;
  } | null>(null);

  if (created) {
    return (
      <section
        aria-labelledby="conta-criada"
        className={cn(cardClasses, 'flex flex-col items-start gap-5 p-6 sm:p-8')}
      >
        <span className="flex size-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
          <IconCircleCheck size={26} stroke={1.75} aria-hidden="true" />
        </span>
        <h2 id="conta-criada" role="status" className="text-xl font-semibold">
          {t.created.title}
        </h2>
        <TemporaryPassword credentials={created.credentials} loginUrl={loginUrl} />
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/admin/eventos/novo?conta=${encodeURIComponent(created.userId)}`}
            className={buttonClasses('primary')}
          >
            <IconCalendarPlus size={18} stroke={1.75} aria-hidden="true" />
            {t.created.createEvent}
          </Link>
          <Link href={`/admin/contas/${created.userId}`} className={buttonClasses('secondary')}>
            <IconUser size={18} stroke={1.75} aria-hidden="true" />
            {t.created.manage}
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className={cn(cardClasses, 'flex flex-col gap-4 p-5 sm:p-6')}>
      <AccountForm
        initialValues={{ name: '', email: '' }}
        submitLabel={t.submit}
        submittingLabel={t.submitting}
        onSubmit={async (values) => {
          const result = await addAccount(values);
          if (result.ok) setCreated({ userId: result.userId, credentials: result.credentials });
          return result;
        }}
        onSaved={() => undefined}
        onNotice={setNotice}
      />
      <Notice notice={notice} />
    </div>
  );
}
