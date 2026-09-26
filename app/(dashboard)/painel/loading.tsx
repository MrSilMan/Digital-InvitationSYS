import { PageMain } from '@/components/dashboard/page-parts';
import { cn } from '@/lib/cn';

const BAR = 'animate-pulse rounded-md bg-stone-200 motion-reduce:animate-none';

/** Placeholder while a dashboard page loads (event list, editor): a header and a few cards. */
export default function DashboardLoading() {
  return (
    <PageMain>
      <div aria-busy="true" className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <div className={cn(BAR, 'h-8 w-56')} />
          <div className={cn(BAR, 'h-4 w-80 max-w-full')} />
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xs"
            >
              <div className="h-24 animate-pulse bg-stone-200/70 motion-reduce:animate-none" />
              <div className="flex flex-col gap-3 p-5">
                <div className={cn(BAR, 'h-5 w-24 rounded-full')} />
                <div className={cn(BAR, 'h-6 w-3/4')} />
                <div className={cn(BAR, 'h-4 w-1/2')} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageMain>
  );
}
