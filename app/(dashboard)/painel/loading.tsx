/** Placeholder while a dashboard page loads (event list, editor). */
export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10" aria-busy="true">
      <div className="h-8 w-56 animate-pulse rounded-lg bg-stone-200" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {[0, 1].map((index) => (
          <div key={index} className="h-48 animate-pulse rounded-2xl bg-stone-200/70" />
        ))}
      </div>
    </div>
  );
}
