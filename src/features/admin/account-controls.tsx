'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { buttonClasses } from '@/components/dashboard/styles';
import { admin } from '@/i18n/pt-AO';
import { fillTemplate } from '@/lib/template';
import type { AccountFormValues } from '@/lib/validation/admin';

import { AccountForm } from './account-form';
import { changeAccountSuspension, editAccount, issueTemporaryPassword } from './actions';
import { adminErrorText } from './errors';
import { Notice, type NoticeState } from './notice';
import { TemporaryPassword } from './temporary-password';
import type { TemporaryCredentials } from './types';

const t = admin.accountDetail;

/** The account's name and e-mail. */
export function AccountDetailsForm({
  userId,
  initialValues,
}: {
  userId: string;
  initialValues: AccountFormValues;
}) {
  const router = useRouter();
  const [notice, setNotice] = useState<NoticeState | null>(null);
  return (
    <div className="flex flex-col gap-3">
      <AccountForm
        initialValues={initialValues}
        submitLabel={admin.common.save}
        submittingLabel={admin.common.saving}
        emailHint={t.details.emailHint}
        onSubmit={(values) => editAccount(userId, values)}
        onSaved={() => {
          setNotice({ tone: 'success', text: admin.common.saved });
          router.refresh();
        }}
        onNotice={setNotice}
      />
      <Notice notice={notice} />
    </div>
  );
}

/** A new temporary password for the account (asks first; shows it once). */
export function PasswordResetControl({
  userId,
  name,
  loginUrl,
}: {
  userId: string;
  name: string;
  loginUrl: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [credentials, setCredentials] = useState<TemporaryCredentials | null>(null);

  const reset = () => {
    if (!window.confirm(fillTemplate(t.password.confirm, { name }))) return;
    setNotice(null);
    setCredentials(null);
    startTransition(async () => {
      const result = await issueTemporaryPassword(userId);
      if (!result.ok) {
        setNotice({ tone: 'error', text: adminErrorText(result) });
        return;
      }
      setCredentials(result.credentials);
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col items-start gap-3">
      <p className="text-sm text-stone-700">{t.password.hint}</p>
      <button
        type="button"
        onClick={reset}
        disabled={pending}
        className={buttonClasses('secondary')}
      >
        {t.password.reset}
      </button>
      <Notice notice={notice} />
      {credentials ? <TemporaryPassword credentials={credentials} loginUrl={loginUrl} /> : null}
    </div>
  );
}

/** Suspends the account (asks first) or lifts the suspension. */
export function SuspensionControl({
  userId,
  name,
  suspended,
}: {
  userId: string;
  name: string;
  suspended: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<NoticeState | null>(null);

  const toggle = () => {
    if (!suspended && !window.confirm(fillTemplate(t.access.suspendConfirm, { name }))) return;
    setNotice(null);
    startTransition(async () => {
      const result = await changeAccountSuspension(userId, !suspended);
      if (!result.ok) {
        setNotice({ tone: 'error', text: adminErrorText(result) });
        return;
      }
      setNotice({ tone: 'success', text: suspended ? t.access.unsuspended : t.access.suspended });
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col items-start gap-3">
      <p className="text-sm text-stone-700">
        {suspended ? t.access.suspendedHint : t.access.activeHint}
      </p>
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        className={buttonClasses(suspended ? 'primary' : 'danger')}
      >
        {suspended ? t.access.unsuspend : t.access.suspend}
      </button>
      <Notice notice={notice} />
    </div>
  );
}
