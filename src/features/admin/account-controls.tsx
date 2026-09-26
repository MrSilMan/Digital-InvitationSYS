'use client';

import { IconKey, IconTrash } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { buttonClasses } from '@/components/dashboard/styles';
import { formatCount } from '@/i18n/plural';
import { admin, dashboard } from '@/i18n/pt-AO';
import { confirmsAccount } from '@/lib/admin/confirmation';
import { cn } from '@/lib/cn';
import { fillTemplate } from '@/lib/template';
import type { AccountFormValues } from '@/lib/validation/admin';

import { AccountForm } from './account-form';
import {
  changeAccountSuspension,
  editAccount,
  issueTemporaryPassword,
  removeAccount,
} from './actions';
import { ConfirmDialog } from './confirm-dialog';
import { DeleteDialog } from './delete-dialog';
import { adminErrorText } from './errors';
import { Notice, type NoticeState } from './notice';
import { TemporaryPassword } from './temporary-password';
import type { TemporaryCredentials } from './types';

const t = admin.accountDetail;

/** The account's name and e-mail. */
export function AccountDetailsForm({
  userId,
  initialValues,
  nameHint,
}: {
  userId: string;
  initialValues: AccountFormValues;
  /** null: no example under the name (an admin's own account). */
  nameHint?: string | null;
}) {
  const router = useRouter();
  const [notice, setNotice] = useState<NoticeState | null>(null);
  return (
    <div className="flex flex-col gap-3">
      <AccountForm
        initialValues={initialValues}
        submitLabel={admin.common.save}
        submittingLabel={admin.common.saving}
        nameHint={nameHint}
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
  const [confirming, setConfirming] = useState(false);

  const reset = () => {
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
    <div className="flex flex-col gap-4">
      <p className="text-sm text-stone-600">{t.password.hint}</p>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        disabled={pending}
        className={buttonClasses('secondary', 'md', 'w-full')}
      >
        <IconKey size={18} stroke={1.75} aria-hidden="true" />
        {t.password.reset}
      </button>
      <Notice notice={notice} />
      {credentials ? <TemporaryPassword credentials={credentials} loginUrl={loginUrl} /> : null}
      <ConfirmDialog
        open={confirming}
        title={fillTemplate(t.password.confirm.title, { name })}
        text={t.password.confirm.text}
        confirmLabel={t.password.confirm.button}
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false);
          reset();
        }}
      />
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
  const [confirming, setConfirming] = useState(false);

  const change = () => {
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
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className={cn(
            'mt-1.5 size-2.5 shrink-0 rounded-full ring-4',
            suspended ? 'bg-red-500 ring-red-100' : 'bg-emerald-500 ring-emerald-100',
          )}
        />
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-semibold text-stone-900">
            {suspended ? admin.accounts.suspended : t.access.active}
          </p>
          <p className="text-sm text-stone-600">
            {suspended ? t.access.suspendedHint : t.access.activeHint}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => (suspended ? change() : setConfirming(true))}
        disabled={pending}
        className={buttonClasses(suspended ? 'primary' : 'danger', 'md', 'w-full')}
      >
        {suspended ? t.access.unsuspend : t.access.suspend}
      </button>
      <Notice notice={notice} />
      <ConfirmDialog
        open={confirming}
        title={fillTemplate(t.access.confirm.title, { name })}
        text={t.access.confirm.text}
        confirmLabel={t.access.confirm.button}
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false);
          change();
        }}
      />
    </div>
  );
}

/**
 * Deletes the account and its events for good (it lists the events and asks for the account's
 * e-mail first), then goes back to the list, which says so.
 */
export function DeleteAccountControl({
  userId,
  name,
  email,
  events,
}: {
  userId: string;
  name: string;
  email: string;
  /** The events deleted with it: the couple's names, the address and the number of guests. */
  events: { id: string; couple: string; slug: string; guests: number }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState<NoticeState | null>(null);

  const remove = (typed: string) => {
    setNotice(null);
    startTransition(async () => {
      const result = await removeAccount(userId, typed);
      if (!result.ok) {
        setNotice({ tone: 'error', text: adminErrorText(result) });
        return;
      }
      router.replace('/admin/contas?eliminada=1');
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-stone-600">{t.delete.hint}</p>
      <button
        type="button"
        onClick={() => {
          setNotice(null);
          setOpen(true);
        }}
        className={buttonClasses('danger', 'md', 'w-full')}
      >
        <IconTrash size={18} stroke={1.75} aria-hidden="true" />
        {t.delete.button}
      </button>
      <DeleteDialog
        open={open}
        title={fillTemplate(t.delete.confirm.title, { name })}
        label={t.delete.confirm.label}
        expected={email}
        confirms={(typed) => confirmsAccount(typed, email)}
        pending={pending}
        notice={notice}
        onConfirm={remove}
        onCancel={() => setOpen(false)}
      >
        <p>{t.delete.confirm.text}</p>
        {events.length > 0 ? (
          <>
            <p>{t.delete.confirm.events}</p>
            <ul className="flex flex-col divide-y divide-stone-100 rounded-lg border border-stone-200">
              {events.map((event) => (
                <li
                  key={event.id}
                  className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 px-3 py-2"
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="font-medium text-stone-900 lining-nums">{event.couple}</span>
                    <span className="font-mono text-xs break-all text-stone-600">
                      /c/{event.slug}
                    </span>
                  </span>
                  <span className="text-xs text-stone-600 tabular-nums">
                    {formatCount(event.guests, dashboard.events.guestCount)}
                  </span>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </DeleteDialog>
    </div>
  );
}
