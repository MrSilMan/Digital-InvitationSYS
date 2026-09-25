'use client';

import { IconBrandWhatsapp, IconCheck, IconDots, IconLink } from '@tabler/icons-react';

import { buttonClasses } from '@/components/dashboard/styles';
import { formatShortDate } from '@/i18n/format';
import { guests } from '@/i18n/pt-AO';
import { formatCount } from '@/i18n/plural';
import { cn } from '@/lib/cn';
import { confirmedPeople, type GuestStatus, guestStatus } from '@/lib/guests/status';
import { fillTemplate } from '@/lib/template';
import { formatGuestPhone } from '@/lib/validation/phone';

import type { GuestListItem } from './types';

const t = guests;

const STATUS_CLASSES: Record<GuestStatus, string> = {
  confirmed: 'border-emerald-600/25 bg-emerald-50 text-emerald-800',
  declined: 'border-red-600/25 bg-red-50 text-red-800',
  whatsapp: 'border-amber-600/30 bg-amber-50 text-amber-900',
  opened: 'border-sky-600/25 bg-sky-50 text-sky-800',
  'not-opened': 'border-stone-400/40 bg-stone-100 text-stone-700',
};

const badge = 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium';

/** One guest of the list: who, where they stand, and the quick actions. */
export function GuestRow({
  guest,
  copied,
  onSend,
  onCopyLink,
  onDetails,
}: {
  guest: GuestListItem;
  /** The link was just copied (brief confirmation). */
  copied: boolean;
  onSend: () => void;
  onCopyLink: () => void;
  onDetails: () => void;
}) {
  const status = guestStatus(guest);
  const people = confirmedPeople(guest);
  const meta = [
    guest.phone ? formatGuestPhone(guest.phone) : t.noPhone,
    guest.groupTag,
    formatCount(guest.seatsAllowed, t.seats),
  ].filter(Boolean);
  const name = { name: guest.displayName };

  return (
    <li className="flex flex-col gap-3 px-4 py-4 sm:px-5 md:flex-row md:items-center md:gap-4">
      <div className="min-w-0 flex-1">
        <h3 className="font-medium wrap-break-word text-stone-900">{guest.displayName}</h3>
        <p className="mt-0.5 text-sm text-stone-600">{meta.join(' · ')}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className={cn(badge, STATUS_CLASSES[status])}>
            {t.status[status]}
            {status === 'confirmed' ? ` · ${formatCount(people, t.people)}` : null}
          </span>
          <span
            className={cn(
              badge,
              guest.sentAt
                ? 'border-stone-300 bg-white text-stone-700'
                : 'border-dashed border-stone-400 bg-white text-stone-600',
            )}
          >
            {guest.sentAt
              ? fillTemplate(t.row.sent, { date: formatShortDate(new Date(guest.sentAt)) })
              : t.row.notSent}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <button
          type="button"
          onClick={onSend}
          className={buttonClasses('secondary', 'sm')}
          aria-label={fillTemplate(t.row.sendLabel, name)}
        >
          <IconBrandWhatsapp size={18} stroke={1.75} aria-hidden="true" />
          {t.row.send}
        </button>
        <button
          type="button"
          onClick={onCopyLink}
          className={buttonClasses('secondary', 'sm')}
          aria-label={fillTemplate(t.row.copyLinkLabel, name)}
        >
          {copied ? (
            <IconCheck size={18} stroke={1.75} aria-hidden="true" />
          ) : (
            <IconLink size={18} stroke={1.75} aria-hidden="true" />
          )}
          <span className="hidden sm:inline">{t.row.copyLink}</span>
        </button>
        <button
          type="button"
          onClick={onDetails}
          className={buttonClasses('secondary', 'sm')}
          aria-label={fillTemplate(t.row.detailsLabel, name)}
        >
          <IconDots size={18} stroke={1.75} aria-hidden="true" />
          <span className="hidden sm:inline">{t.row.details}</span>
        </button>
      </div>
    </li>
  );
}
