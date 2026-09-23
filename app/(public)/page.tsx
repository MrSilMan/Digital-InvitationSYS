import { t } from '@/i18n';

export default function HomePage() {
  const { landing } = t;
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <p className="text-sm tracking-[0.3em] text-accent uppercase">{landing.eyebrow}</p>
      <h1 className="font-serif text-4xl sm:text-5xl">{landing.title}</h1>
      <p className="max-w-md font-serif text-lg text-muted">{landing.subtitle}</p>
      <span className="rounded-full border border-accent px-5 py-1.5 text-sm tracking-widest text-accent uppercase">
        {landing.comingSoon}
      </span>
    </main>
  );
}
