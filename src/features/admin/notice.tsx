import { cn } from '@/lib/cn';

export interface NoticeState {
  tone: 'success' | 'error';
  text: string;
}

/** The outcome of an action under its button: announced politely, errors assertively. */
export function Notice({ notice, className }: { notice: NoticeState | null; className?: string }) {
  if (!notice) return null;
  return (
    <p
      role={notice.tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'rounded-lg px-3 py-2 font-sans text-sm',
        notice.tone === 'error' ? 'bg-red-50 text-red-800' : 'bg-emerald-50 text-emerald-800',
        className,
      )}
    >
      {notice.text}
    </p>
  );
}
