/** Placeholder while an admin page loads (lists, details). */
export default function AdminLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8" aria-busy="true">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-stone-200" />
      <div className="mt-6 h-12 animate-pulse rounded-2xl bg-stone-200/70" />
      <div className="mt-4 flex flex-col gap-3">
        {[0, 1, 2].map((index) => (
          <div key={index} className="h-24 animate-pulse rounded-2xl bg-stone-200/70" />
        ))}
      </div>
    </div>
  );
}
