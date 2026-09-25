'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useId, useTransition } from 'react';

import { inputClasses } from '@/components/dashboard/styles';
import { overview } from '@/i18n/pt-AO';
import { cn } from '@/lib/cn';

/** Chooses the group the overview counts (`?grupo=…`); the page renders again on the server. */
export function GroupFilter({ groups, value }: { groups: string[]; value: string | null }) {
  const id = useId();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="font-sans text-sm font-medium text-stone-800">
        {overview.group}
      </label>
      <select
        id={id}
        value={value ?? ''}
        aria-busy={pending || undefined}
        onChange={(event) => {
          const group = event.target.value;
          const query = group ? `?${new URLSearchParams({ grupo: group }).toString()}` : '';
          startTransition(() => router.replace(`${pathname}${query}`, { scroll: false }));
        }}
        className={cn(inputClasses, 'w-auto min-w-48', pending && 'opacity-60')}
      >
        <option value="">{overview.allGroups}</option>
        {groups.map((group) => (
          <option key={group} value={group}>
            {group}
          </option>
        ))}
      </select>
    </div>
  );
}
