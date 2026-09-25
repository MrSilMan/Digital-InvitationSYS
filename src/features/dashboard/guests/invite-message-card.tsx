'use client';

import { IconChevronDown } from '@tabler/icons-react';
import { useId, useState } from 'react';

import { buttonClasses, cardClasses, inputClasses } from '@/components/dashboard/styles';
import { guests } from '@/i18n/pt-AO';
import { cn } from '@/lib/cn';
import { defaultInviteMessage, type InviteContext } from '@/lib/guests/invite-message';
import { fillTemplate } from '@/lib/template';
import { GUEST_LIMITS } from '@/lib/validation/guest';

import { updateInviteMessage } from './actions';
import { guestErrorText } from './ui-helpers';

const t = guests.template;

/** "Mensagem de envio": the text sent with every personal link (collapsed by default). */
export function InviteMessageCard({
  eventId,
  invite,
  onSaved,
}: {
  eventId: string;
  invite: InviteContext;
  onSaved: (template: string | null) => void;
}) {
  const id = useId();
  const suggested = defaultInviteMessage(invite.phase);
  const [text, setText] = useState(invite.template ?? suggested);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ kind: 'error' | 'saved'; text: string } | null>(null);
  const max = GUEST_LIMITS.inviteMessage;

  const save = async () => {
    setSaving(true);
    setStatus(null);
    try {
      const result = await updateInviteMessage(eventId, text);
      if (result.ok) {
        onSaved(result.template);
        setText(result.template ?? suggested);
        setStatus({ kind: 'saved', text: t.saved });
      } else {
        setStatus({
          kind: 'error',
          text: result.issues?.[0]?.message ?? guestErrorText(result),
        });
      }
    } catch {
      setStatus({ kind: 'error', text: guests.errors.unavailable });
    } finally {
      setSaving(false);
    }
  };

  return (
    <details className={cn(cardClasses, 'group')}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-5 py-4 font-medium text-stone-900 focus-visible:outline-2 focus-visible:outline-stone-900 [&::-webkit-details-marker]:hidden">
        {t.legend}
        <IconChevronDown
          size={20}
          stroke={1.75}
          className="shrink-0 transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <div className="flex flex-col gap-3 border-t border-stone-200 px-5 py-4">
        <p id={`${id}-hint`} className="text-sm text-stone-600">
          {t.hint}
        </p>
        <label htmlFor={`${id}-text`} className="sr-only">
          {t.label}
        </label>
        <textarea
          id={`${id}-text`}
          aria-describedby={`${id}-hint`}
          value={text}
          maxLength={max}
          rows={9}
          onChange={(event) => setText(event.target.value)}
          className={cn(inputClasses, 'resize-y')}
        />
        <p className="text-right text-xs text-stone-500" aria-live="polite">
          {fillTemplate(t.counter, { count: String(text.length), max: String(max) })}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => void save()}
            className={buttonClasses('primary', 'sm')}
          >
            {t.save}
          </button>
          <button
            type="button"
            disabled={saving || text === suggested}
            onClick={() => setText(suggested)}
            className={buttonClasses('ghost', 'sm')}
          >
            {t.reset}
          </button>
          <p
            role="status"
            className={status?.kind === 'error' ? 'text-sm text-red-700' : 'text-sm text-stone-600'}
          >
            {status?.text}
          </p>
        </div>
      </div>
    </details>
  );
}
