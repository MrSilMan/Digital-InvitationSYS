@AGENTS.md

# Convites Digitais — project guide for Claude

Digital wedding invitations for Angola. The full brief is [docs/SPEC.md](docs/SPEC.md); read the
relevant sections before planning a phase. README.md documents setup and architecture.

## How we work

- The build is split into 11 phases (SPEC §14). Before each phase: show a short plan and wait for
  approval. After it: `npm run check` and `npm run build` must pass, then summarize and commit.
- Before installing anything, check current versions with `npm view` and read the current docs
  (Next.js ships version-matched docs in `node_modules/next/dist/docs/`).
- Phase status: 1–5 done. Next: Phase 6 ("Champanhe" theme).

## Commands

```bash
docker compose up -d        # Postgres (host port 5433), Redis, MinIO + bucket, Mailpit
npm run dev                 # dev server
npm run check               # format check + lint + typecheck + unit tests
npm run test:integration    # tests against Postgres (convites_test)
npm run test:e2e            # Playwright, phone-sized Chromium; needs `npm run db:seed`
npm run build && npm start  # production build, run like the Docker image
npm run db:migrate -- --name what-changed   # after editing prisma/schema.prisma
npm run db:seed             # demo data (idempotent)
npx vitest run path/to/file.test.ts
```

## Version pins (do not bump these majors blindly)

- `typescript ~6.0.x`: TS 7 is blocked, `typescript-eslint` (via `eslint-config-next`) supports <6.1.
- `eslint ^9`: ESLint 10 is blocked by the react/import/jsx-a11y plugins in `eslint-config-next`.
- `@types/node ^24`: the runtime is Node 24 LTS.
- `prisma`, `@prisma/client`, `@prisma/adapter-pg` pinned to the same exact 7.x version: the
  `latest` npm tag points at an 8.0 RC, and Better Auth supports Prisma <=7. Bump all three together.

## Next.js 16 specifics that matter here

- Middleware is `proxy.ts` (Node.js runtime only). Request APIs (`headers()`, `params`) are async.
  Error boundaries receive `retry()`. There is no `next lint`.
- In production, `instrumentation.ts` runs lazily on the first request. `scripts/preload.ts`
  (bundled to `dist/preload.cjs` by `npm run build`) validates the env and installs the request
  hooks at startup: always start the production server with `node --require ./dist/preload.cjs`.
- AsyncLocalStorage context cannot be opened in `proxy.ts` (it runs apart from rendering); it is
  opened at the HTTP layer by `src/lib/observability/http-hooks.ts`.
- `next dev` rewrites the managed block in AGENTS.md; commit it, don't fight it.

## Database (Prisma 7)

- Server code: `getPrisma()` from `src/server/db/prisma.ts` (lazy: `next build` needs no database).
  Scripts and integration tests: `createPrismaClient()` from `src/server/db/client.ts`.
- Imports: `@/generated/prisma/client` on the server only; Client Components use
  `@/generated/prisma/enums` or `/models`. The generated folder is gitignored (postinstall).
- `prisma.config.ts` loads `.env.local` itself (Prisma 7 does not read .env files). Prisma 7 does
  not generate or seed after `migrate dev`: run `db:generate` / `db:seed` explicitly.
- Schema changes: `npm run db:migrate -- --name x`, review the SQL, commit schema + migration.
  Never edit an applied migration. CHECK constraints are hand-written in migration SQL.
- Prisma blocks `migrate reset` when an AI agent runs it without the user's explicit consent.
  Never work around that: fix forward with a new migration, or ask the user.
- Better Auth tables must match what its CLI generates for our auth config (email + password,
  admin plugin with roles `couple`/`admin`). Re-run it when auth plugins change:
  `npx auth@1.7.5 generate --config <file> --adapter prisma --dialect postgresql --output <file>`
- Guest tokens: `createGuestToken()` (22 chars, 128 bits); check with `isGuestToken()` before any
  lookup. Phones: `angolanPhoneSchema` (stored as +2449XXXXXXXX). Section order/visibility:
  `parseSectionConfig()`. Default texts and rules: `src/i18n/pt-AO.ts` / `src/lib/event-defaults.ts`.
- The integration test database name must end in `_test`; the suite empties it on every run.

## Conventions

- Layout: routes in `app/` (root), everything else in `src/` (`@/*` → `src/*`). Feature code goes in
  `src/features/<area>/`, shared UI in `src/components/ui/`, server-only code in `src/server/`.
- Server-only modules start with `import 'server-only'`. Vitest and esbuild alias it to
  `scripts/stubs/server-only.ts`.
- Environment: read with `getServerEnv()` (`src/env.ts`); browser values via `publicEnv`
  (`src/env.public.ts`, no Zod on the client). A new variable goes into the schema, `.env.example`
  and the README table.
- Logging: `import { logger } from '@/lib/logger'` (Node.js runtime only); errors go in as
  `logger.error('msg', { err })`. No `console.log` (ESLint). Log IDs, not guest data: redaction is
  a safety net, not permission.
- Process-wide singletons (logger, ALS storage, Redis, DB pools) live on `globalThis` under
  `Symbol.for('convites.*')`, because Next.js bundles instrumentation and routes separately.
- UI text only in `src/i18n/pt-AO.ts` (pt-AO spelling). Client Components import single sections
  (`import { errors } from '@/i18n/pt-AO'`) to keep bundles small.
- Validate every input with Zod (forms, Server Actions, Route Handlers, env, CSV) and re-check
  authorization inside every Server Action and Route Handler; never rely on `proxy.ts` alone.
- CSP: nonce-based, built in `src/lib/security/csp.ts`. No inline `<script>` without the nonce; add
  external origins through the builder options. Styles may be inline.
- Sentry privacy lives in `src/lib/sentry/options.ts`: never loosen `dataCollection`, never add
  Session Replay, never send guest names, phones, IBANs or tokens.
- Guest pages must stay light (low-end Android): Server Components by default, small Client
  Components, no heavy client libraries.
- Tests: Vitest, `*.test.ts(x)` next to the code; root-level files are tested in `tests/unit/`;
  database tests are `tests/integration/*.int.test.ts`. Components: render with
  `renderToStaticMarkup` from `react-dom/server` (no DOM environment needed).

## Design system and themes (README → Themes)

- Themes in `src/themes/` are plain data: never import `next/font` or React there. Fonts are bound
  per theme in `src/themes/fonts.ts`, applied by `ThemeRoot` with the `--theme-*` variables.
- Invitation components use the Tailwind tokens (`text-script`, `bg-accent`, `text-ink`,
  `font-caps`…), never hex colours, so theme overrides just work. Size invitation text with `cqi`
  (`text-[clamp(1rem,5cqi,1.5rem)]`), never `vw`: it also renders in the dashboard's phone preview.
- Plain CSS (CSS modules, `@utility`) must use `var(--theme-*)` directly, never `var(--color-*)` /
  `var(--font-*)`: those resolve on `:root`, above the theme root, and silently give the fallbacks.
- `cn()` does not merge conflicting Tailwind classes: never pass a class that overrides one the
  component already sets (e.g. `px-0` over `px-6`); add a prop instead (`SectionPage padded`).
- Icon keys (`src/components/icons/index.tsx`) are stored in the database: never rename or remove
  one without a data migration.
- The serpentine timeline's geometry lives in both `serpentine-layout.ts` and its CSS module (row
  height, dot position, overhang, label inset): change them together, then check `/design`.
- Visual checks: open `/design` (404 in production), capture it with `scripts/screenshot.mjs`
  (usage in its header) and look at the PNGs. Compare with the reference screenshots in
  `docs/reference/` (gitignored: they show a real couple).
- `public/themes/*` artwork is placeholder art until licensed files replace it. Never redraw it with
  `npm run themes:placeholders -- --force` once real artwork is in.

## Guest invitation (README → Guest invitation)

- Guest pages get their data only from `getInvitation(slug, token)` (`src/server/invitations`):
  a JSON-safe read model of one event and one guest. Never query guests in a page, never add other
  guests or phone numbers to it; validate couple-provided URLs/colours/phones in the mapper.
- Every guest-link route (page, `opengraph-image`, `calendario.ics`) validates params with
  `invitationParamsSchema` and answers "not found" identically for every failure. No `loading.tsx`
  on the invitation route (it would turn the 404 into a 200).
- A section = a component in `src/features/invitation/sections/` + an entry in
  `SECTION_COMPONENTS` (invitation-view.tsx) + a content rule in `sections.ts`.
- Client Components stay small: import Tabler icons directly (not `Icon`, which bundles all of
  them), style buttons with `pillButtonClasses`, use `fillTemplate` from `@/lib/template`, and never
  import the whole pt-AO dictionary (pass labels as props).
- Read the time with `serverNow()` (`src/lib/clock.ts`) in server code; client countdowns get the
  server time as a prop.
- Visual checks of a guest page: `node scripts/screenshot.mjs <url> <outDir> "--selector=main >
section" "--click=button[aria-label='Abrir o convite']" --wait=3000`.
- RSVP rules live in `src/features/invitation/rsvp/rules.ts` and are enforced on the server (Server
  Action `submitRsvp`, WhatsApp route); the browser only mirrors them. The form schema
  (`src/lib/validation/rsvp.ts`) uses `zod/mini` because it ships to guests: keep it that way.
- A WhatsApp tap never overwrites a form answer (`recordWhatsappIntent`).

## Redis (README → Caching, rate limits and views)

- On request paths use `withRedis(...)` / `getReadyRedis()` from `src/server/redis.ts`, never raw
  client calls: Redis may be down and pages must not wait for it. Always provide the Postgres (or
  "allow") fallback.
- Keys start with `convites:`; hash secrets and personal data in keys (`hashKeyPart`): guest
  tokens, IPs. Bump `CACHE_VERSION` in `src/server/invitations/queries.ts` when the cached read
  model changes shape.
- Every change to what a guest page shows must call `invalidateInvitationEvent` /
  `invalidateInvitationGuest` (dashboard, guests, admin).
- Rate limits: add policies to `src/server/rate-limit/policies.ts`; subjects are IPs (`clientIp`)
  or tokens. Integration tests use Redis database 15 (`tests/integration/redis.ts`: connect/flush/
  close helpers); tests that change cached data must invalidate it.

## Local environment notes

- Postgres is on host port 5433 (a native PostgreSQL service may own 5432).
- The containerized dev server (`--profile app`) runs `next dev --webpack` with `WATCHPACK_POLLING`:
  Turbopack's watcher misses host edits through the bind mount. Host `npm run dev` uses Turbopack.
  After dependency changes start it with `--build --renew-anon-volumes`: its `node_modules` lives in
  an anonymous volume that Compose otherwise reuses (stale packages, "Module not found").
- Never rewrite files with PowerShell 5.1 `Get-Content`/`Set-Content`: it reads UTF-8 as ANSI and
  corrupts accents (pt-AO text). Use the editor tools.
- Git Bash rewrites `/paths` passed to docker: prefix commands with `MSYS_NO_PATHCONV=1`.
- MinIO image: `cgr.dev/chainguard/minio` (official images were removed from Docker Hub).
