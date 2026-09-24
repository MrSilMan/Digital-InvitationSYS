import type { ReactNode } from 'react';

import { ThemeRoot } from '@/components/theme/theme-root';
import { designPreview, invitation, invitationDefaults } from '@/i18n/pt-AO';
import { cn } from '@/lib/cn';
import type { ThemeDefinition } from '@/themes';
import { themeFontNames } from '@/themes/fonts';

import {
  BODY_CANDIDATES,
  CAPS_CANDIDATES,
  type FontCandidate,
  SCRIPT_CANDIDATES,
} from './candidate-fonts';
import { SAMPLE } from './sample-content';

const t = designPreview.fonts;

function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-slate-300 px-2 py-0.5 text-xs text-slate-600">
      {children}
    </span>
  );
}

function CandidateCard({
  candidate,
  chosen,
  children,
}: {
  candidate: FontCandidate;
  chosen: boolean;
  children: ReactNode;
}) {
  return (
    <article
      className={cn(
        'rounded-2xl border bg-white/70 p-5 shadow-sm',
        chosen ? 'border-accent ring-2 ring-accent/30' : 'border-slate-200',
      )}
    >
      <header className="mb-3 flex flex-wrap items-center gap-2 font-sans text-sm">
        <strong className="text-slate-900">{candidate.name}</strong>
        {candidate.inBrief ? <Tag>{t.inBrief}</Tag> : null}
        {chosen ? <Tag>{t.chosen}</Tag> : null}
      </header>
      <div className={candidate.className}>{children}</div>
    </article>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-4">
      <h3 className="font-sans text-lg font-semibold text-slate-800">{title}</h3>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{children}</div>
    </div>
  );
}

/** Every candidate font on the theme's paper and colours; the theme's own choice is marked. */
export function FontComparison({ theme }: { theme: ThemeDefinition }) {
  const { sections } = invitation;
  const chosen = themeFontNames(theme.id);
  return (
    <section className="space-y-6">
      <h2 className="font-sans text-2xl font-bold text-slate-900">
        {t.title} — {theme.name}
      </h2>
      <ThemeRoot theme={theme} container={false} className="space-y-10 rounded-3xl p-6 shadow-md">
        <Group title={t.script}>
          {SCRIPT_CANDIDATES.map((candidate) => (
            <CandidateCard
              key={candidate.name}
              candidate={candidate}
              chosen={candidate.name === chosen.script}
            >
              <p className="text-[3.2rem] leading-tight text-script">
                {SAMPLE.groomName} e {SAMPLE.brideName}
              </p>
              <p className="text-[2.6rem] leading-tight text-script">
                {sections.message.script} · {sections.schedule.script}
              </p>
              <p className="text-[2.6rem] leading-tight text-script">
                {sections.gallery.script} · {sections.guestManual.script}
              </p>
            </CandidateCard>
          ))}
        </Group>

        <Group title={t.caps}>
          {CAPS_CANDIDATES.map((candidate) => (
            <CandidateCard
              key={candidate.name}
              candidate={candidate}
              chosen={candidate.name === chosen.caps}
            >
              <p className="text-2xl tracking-[0.06em] text-ink">
                {sections.message.caps} · {sections.schedule.caps}
              </p>
              <p className="mt-2 text-xl tracking-wider text-ink">
                {invitationDefaults.introLine} · {invitationDefaults.invitationLine}
              </p>
              <p className="mt-2 text-3xl font-bold tracking-[0.04em] text-ink uppercase">
                {SAMPLE.guestName}
              </p>
              <p
                aria-hidden="true"
                className="mt-2 inline-flex text-[4.5rem] leading-none text-accent"
              >
                <span>B</span>
                <span className="ml-[-0.3em] translate-y-[0.14em]">N</span>
              </p>
            </CandidateCard>
          ))}
        </Group>

        <Group title={t.body}>
          {BODY_CANDIDATES.map((candidate) => (
            <CandidateCard
              key={candidate.name}
              candidate={candidate}
              chosen={candidate.name === chosen.body}
            >
              <p className="text-[1.35rem] leading-snug font-medium whitespace-pre-line text-ink">
                {SAMPLE.message}
              </p>
              <p className="mt-3 text-lg font-medium text-ink">
                {SAMPLE.timeline[0].label} – {SAMPLE.timeline[0].time}
              </p>
            </CandidateCard>
          ))}
        </Group>
      </ThemeRoot>
    </section>
  );
}
