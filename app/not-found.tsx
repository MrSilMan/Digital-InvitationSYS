import Link from 'next/link';

import { t } from '@/i18n';

export default function NotFound() {
  const { notFound } = t.errors;
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="font-serif text-3xl">{notFound.title}</h1>
      <p className="max-w-sm text-muted">{notFound.description}</p>
      <Link
        href="/"
        className="mt-2 rounded-full bg-accent px-6 py-2.5 text-sm tracking-wider text-accent-contrast uppercase"
      >
        {notFound.backHome}
      </Link>
    </main>
  );
}
