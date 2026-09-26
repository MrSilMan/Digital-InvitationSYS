'use client';

import { buttonClasses } from '@/components/dashboard/styles';
import { Dialog } from '@/components/dashboard/dialog';
import { admin } from '@/i18n/pt-AO';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  text: string;
  /** The confirming button, e.g. "Sim, desativar" (never the same words as the button behind). */
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Asks before a change that is hard to undo (deactivating, suspending, a new password). Focus
 * starts on "Cancelar", so Enter never confirms by accident; Esc cancels.
 */
export function ConfirmDialog({
  open,
  title,
  text,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onCancel} title={title} closeLabel={admin.common.close}>
      <p className="text-sm text-stone-700">{text}</p>
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          className={buttonClasses('secondary')}
          data-autofocus
        >
          {admin.common.cancel}
        </button>
        <button type="button" onClick={onConfirm} className={buttonClasses('destructive')}>
          {confirmLabel}
        </button>
      </div>
    </Dialog>
  );
}
