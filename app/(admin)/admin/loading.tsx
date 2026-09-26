import { PageMain } from '@/components/dashboard/page-parts';
import { cardClasses } from '@/components/dashboard/styles';
import { cn } from '@/lib/cn';

const BAR = 'animate-pulse rounded-md bg-stone-200 motion-reduce:animate-none';

/** Placeholder while an admin page loads: a header and a list card (lists and details alike). */
export default function AdminLoading() {
  return (
    <PageMain>
      <div aria-busy="true" className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <div className={cn(BAR, 'h-8 w-48')} />
          <div className={cn(BAR, 'h-4 w-72 max-w-full')} />
        </div>
        <div className={cn(cardClasses, 'overflow-hidden')}>
          <div className="flex gap-3 border-b border-stone-200 p-4">
            <div className={cn(BAR, 'h-9 w-64 max-w-full')} />
          </div>
          {[0, 1, 2, 3, 4].map((index) => (
            <div
              key={index}
              className="flex items-center gap-3 border-b border-stone-100 px-5 py-4 last:border-b-0"
            >
              <div className={cn(BAR, 'size-7 shrink-0 rounded-full')} />
              <div className="flex flex-1 flex-col gap-2">
                <div className={cn(BAR, 'h-4 w-1/3')} />
                <div className={cn(BAR, 'h-3 w-1/2')} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageMain>
  );
}
