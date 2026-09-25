'use client';

import { IconBrandWhatsapp, IconCopy } from '@tabler/icons-react';
import { useId, useState } from 'react';

import { buttonClasses, inputClasses } from '@/components/dashboard/styles';
import { useCopy } from '@/components/dashboard/use-copy';
import { whatsappUrl } from '@/features/invitation/links';
import { guests } from '@/i18n/pt-AO';
import { cn } from '@/lib/cn';
import { buildInviteMessage, type InviteContext } from '@/lib/guests/invite-message';

import type { GuestListItem } from './types';

const t = guests.send;

/**
 * "Enviar pelo WhatsApp": the message with the personal link, editable for this guest only, and a
 * button that opens WhatsApp with it (the guest's chat, or the contact picker without a phone).
 */
export function SendMessage({
  guest,
  invite,
  onOpened,
}: {
  guest: GuestListItem;
  invite: InviteContext;
  /** WhatsApp was opened: the guest counts as sent. */
  onOpened: () => void;
}) {
  const id = useId();
  const [text, setText] = useState(() => buildInviteMessage(invite, guest));
  const { status, copy } = useCopy();
  const hasLink = text.includes(guest.link);

  return (
    <div className="flex flex-col gap-4">
      {guest.phone ? null : (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">{t.noPhone}</p>
      )}
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-message`} className="text-sm font-medium text-stone-800">
          {t.message}
        </label>
        <p id={`${id}-hint`} className="text-xs text-stone-600">
          {t.hint}
        </p>
        <textarea
          id={`${id}-message`}
          aria-describedby={hasLink ? `${id}-hint` : `${id}-hint ${id}-missing`}
          aria-invalid={hasLink ? undefined : true}
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={10}
          className={cn(inputClasses, 'resize-y')}
        />
        {hasLink ? null : (
          <p id={`${id}-missing`} className="text-sm text-red-700">
            {t.linkMissing}
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {hasLink ? (
          <a
            href={whatsappUrl(guest.phone ?? '', text)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onOpened}
            className={buttonClasses('primary')}
          >
            <IconBrandWhatsapp size={20} stroke={1.75} aria-hidden="true" />
            {t.open}
          </a>
        ) : (
          <button type="button" disabled className={buttonClasses('primary')}>
            <IconBrandWhatsapp size={20} stroke={1.75} aria-hidden="true" />
            {t.open}
          </button>
        )}
        <button
          type="button"
          onClick={() => void copy(text)}
          className={buttonClasses('secondary')}
        >
          <IconCopy size={18} stroke={1.75} aria-hidden="true" />
          {t.copy}
        </button>
        <p
          role="status"
          className={status === 'failed' ? 'text-sm text-red-700' : 'text-sm text-stone-600'}
        >
          {status === 'copied' ? t.copied : status === 'failed' ? t.copyFailed : ''}
        </p>
      </div>
    </div>
  );
}
