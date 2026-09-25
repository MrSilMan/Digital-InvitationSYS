@AGENTS.md

# Convites Digitais — project guide for Claude

Digital wedding invitations for Angola. The full brief is [docs/SPEC.md](docs/SPEC.md); read the
relevant sections before planning a phase. README.md documents setup and architecture.

## How we work

- The build is split into 11 phases (SPEC §14). Before each phase: show a short plan and wait for
  approval. After it: `npm run check` and `npm run build` must pass, then summarize and commit.
- Before installing anything, check current versions with `npm view` and read the current docs
  (Next.js ships version-matched docs in `node_modules/next/dist/docs/`).
- Phase status: 1–7 and 8a (guest list, WhatsApp sending, overview, CSV export) done. Next: 8b
  (CSV import through the queue), then Phase 9 (admin area and audit log).

## Commands

```bash
docker compose up -d        # Postgres (host port 5433), Redis, MinIO + bucket, Mailpit
npm run dev                 # dev server
npm run worker:dev          # background worker (uploads), restarts on changes
npm run check               # format check + lint + typecheck + unit tests
npm run test:integration    # tests against Postgres (convites_test), Redis db 15, MinIO
npm run test:e2e            # Playwright, phone-sized Chromium (+ a worker); needs `npm run db:seed`
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
- A theme needs entries in `THEMES`, `src/themes/fonts.ts` and `OG_FONTS` (og-image.tsx, `.woff`
  files in `assets/fonts/`), plus artwork in `public/themes/<id>/` (README → Adding a theme).
  Theme fonts use `preload: false`: next/font preloads per route, not per theme, so a preloaded
  theme font is downloaded by every guest. Only the shared body font is preloaded.
- Set the caps font only with the `font-caps` class: it also applies the theme's `capsSizeAdjust`
  (Champanhe's Cinzel runs ~20% larger). Never `font-family: var(--theme-font-caps)` in plain CSS.
- Main actions take `theme.buttonShape` (`PillButton shape`, `RsvpDialog shape`); WhatsApp RSVP
  buttons are always circles, buttons inside a form or box always pills.
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
- `public/themes/*` artwork is placeholder art until licensed files replace it. Never redraw a theme
  whose real artwork is in (`npm run themes:placeholders -- --theme=<id> --force`). Placeholder
  drawings live in `scripts/theme-placeholders/<id>.ts`; keep their edges opaque where possible
  (the image optimizer keeps alpha lossless, soft transparency makes images several times heavier).

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
section" "--click=button[aria-label='Abrir o convite']" --wait=3000`. Demo links per theme:
  `/c/braulio-e-nanda/demo-familia-silva-001` (Praia Rosa),
  `/c/braulio-e-nanda-champanhe/demo-champanhe-silva-01` (Champanhe). To see a Save the Date in
  another theme, change the demo event's `phase` in the local database, delete its cached read
  model (`convites:inv:v<CACHE_VERSION>:event:<slug>`, else up to 10 min stale) and re-seed
  afterwards.
- RSVP rules live in `src/features/invitation/rsvp/rules.ts` and are enforced on the server (Server
  Action `submitRsvp`, WhatsApp route); the browser only mirrors them. The form schema
  (`src/lib/validation/rsvp.ts`) uses `zod/mini` because it ships to guests: keep it that way.
- A WhatsApp tap never overwrites a form answer (`recordWhatsappIntent`).

## Logins and dashboard (README → Couple dashboard)

- Better Auth instance: `getAuth()` (`src/server/auth/auth.ts`, lazy like `getPrisma`). Its HTTP
  handler is not mounted: logins go through `signIn`/`signOut` Server Actions
  (`src/features/auth/actions.ts`, our rate limits and logs). Mount it only with an allowlist of
  paths, keeping `disabledPaths`.
- Who is signed in: `getSessionUser()` / `requireUser()` (`src/server/auth/session.ts`). Event access:
  `requireEditableEvent(id)` in pages, `authorizeEventAction(id)` in Server Actions
  (`src/server/events/access.ts`): owner or admin; everyone else gets "not found". `proxy.ts` only
  checks that a session cookie exists (`isSignedInArea`); never rely on it.
- Redirects after login go through `safeReturnPath` (only `/painel…` and `/admin…`).
- The editor's single source of truth is `src/lib/validation/event-editor.ts`: field schemas, the
  cross-field rules (`eventEditorSchema`), `toEditorData` (form → database), placeholders
  (`{pessoas}`/`{local}`/`{hora}` ↔ `{seats}`/`{venue}`/`{time}`) and the preview's lenient
  `parseEditorDraft`. `src/server/events/editor.ts` maps the database row both ways and saves in
  one transaction (+ `invalidateInvitationEvent`). A new editable field touches both files, the
  form tab and the pt-AO `editor` texts.
- Dates in forms: `src/lib/luanda-time.ts` (Luanda is UTC+1 all year; times before 06:00 are the
  night after the wedding day, `onWeddingDay`).
- Live preview: drafts in Redis (`convites:draft:<eventId>:<userId>`, 2 h), rendered by
  `/previsualizar/<id>` with `InvitationView preview` (sample guest; `SectionProps.preview` makes
  RSVP, WhatsApp and calendar buttons inert). The editor and the iframe exchange versioned
  messages (`preview-messages.ts`): keep that handshake when changing either side.
- Dashboard look: `src/components/dashboard/` (`buttonClasses`, `inputClasses`, `Field`), stone
  tones and the system font; never the invitation theme tokens.
- Icon keys live in `src/components/icons/keys.ts` (plain data); pickers offer `CONTENT_ICON_KEYS`.
- React Hook Form drops the values of `disabled` inputs: show locked values without a disabled
  control. Anything that appears on validation (badges) must not shift clickable elements.
- The editor is one `<form>`: buttons inside tabs need `type="button"`, and Enter in a text input
  that is not a form field must be caught (the media descriptions blur instead of submitting).

## Guests (README → Guests and WhatsApp)

- Event pages share `app/(dashboard)/painel/eventos/[eventId]/layout.tsx` (names + menu): Resumo is
  the event's root page, the editor is `/editar`, the guest list `/convidados`. The layout does not
  protect its pages: each page still calls `requireEditableEvent` (cached per request).
- One guest schema (`src/lib/validation/guest.ts`) for the form, the Server Actions and CSV rows:
  string inputs, `GuestData` out. Guest phones use `normalizeGuestPhone` (Angolan or `+`/`00` with a
  country code); the couple's own WhatsApp numbers stay `angolanPhoneSchema`.
- Guest changes go through `src/server/guests/service.ts`, always scoped `{ id, eventId }`. Adding
  guests must lock the event row (`lockEvent`) before counting against `guestLimit`; anything that
  changes a name, seats or the token calls `invalidateInvitationGuest(oldToken)`.
- Statuses and counts only from `src/lib/guests/status.ts` (list, overview and export agree);
  filters and their Portuguese URL params from `src/lib/guests/filters.ts`.
- Personal links: `guestLink(slug, token)` (from `APP_URL`); never build `/c/…` URLs by hand.
- `Event.inviteMessage` keeps the Portuguese placeholders as typed (dashboard only, never mapped to
  English ones); null = the phase's suggested text; the link is appended if missing.
- Couple-entered answers are `Rsvp.source = COUPLE`; they keep the guest's message and WhatsApp tap.
- CSV exports: `guestsToCsv` (`;`, BOM, CRLF, formula escaping with our own pattern: Papa Parse's
  default misses values with line breaks). `Response.text()` drops the BOM: test the bytes.
- In the editor, links out of the page are guarded while the form is dirty (a capture-phase click
  listener): keep it when adding links around the editor.

## Uploads and the worker (README → Uploads and the worker)

- Storage keys (`src/lib/media/keys.ts`): uploads under `originals/` are never served (EXIF/GPS);
  the worker writes under `media/<event>/<media>/`, served at `/m/…` only through `servedPath`.
  Every upload gets a new media ID, so files are cached as immutable: never write other content to
  an existing key. Delete a media's files with `discardStoredFiles` (queue first, then direct).
- Presigned PUTs sign the content type and exact size (`presignUpload`); the S3 client keeps
  `requestChecksumCalculation: 'WHEN_REQUIRED'` (R2 and MinIO reject some default checksums).
- Dashboard media logic lives in `src/server/media/dashboard.ts`, behind the Server Actions of
  `src/features/dashboard/media/actions.ts` (auth, rate limit, Zod first). Anything that changes a
  READY media must call `invalidateInvitationEvent`.
- `processMedia` must stay idempotent: only PENDING media are processed, file keys depend only on
  the media, and READY is set by `updateMany … where status PENDING` in the same transaction that
  replaces older single-type media. Bad files end FAILED with a `MEDIA_FAILURES` code (texts in
  pt-AO `editor.media.failures`); only `error` is retryable.
- Queue (`src/server/queues/media-queue.ts`): the web app only adds jobs, through the fail-fast
  `getMediaQueue()` (returns false when Redis is down; the sweep catches up). `process-<mediaId>`
  job IDs de-duplicate, so a manual retry uses a new ID and the sweep removes finished jobs first.
  Workers need `maxRetriesPerRequest: null`. Validate job data with Zod in the worker.
- The worker (`worker/index.ts`) runs with `tsx --conditions=react-server` (server-only modules);
  `./setup` must stay its first import (env and `SERVICE_NAME` before the logger reads them). It
  shares the Sentry init with the web server (`src/lib/sentry/server-options.ts`).
- Image widths per type live in `src/lib/media/ladder.ts`; read models carry `widths`. Render
  uploaded images with `MediaImage`, never plain `next/image`: `/m/` is not in `localPatterns`, so
  the optimizer would refuse it (and must not re-encode uploads). sharp 0.35 exports its types
  directly (`import sharp, { type Metadata } from 'sharp'`, no `sharp.` namespace).
- The CSP's `connect-src` allows the storage origin on every page (`uploadOrigin`): the dashboard is
  reached by client-side navigation, and a document keeps its first page's policy.
- Integration tests use the MinIO bucket `convites-media-test` (created by the tests; the name
  must end in `-test`) and run jobs directly (`processMedia`, `deleteStoredFiles`).

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
- Manual browser tests of the dashboard hit the login limit (8 per e-mail per 15 min): sign in
  once and reuse Playwright's `storageState`, or delete `convites:rl:*` in the dev Redis. The e2e
  dashboard tests edit the Champanhe demo event (the other specs read the Praia Rosa one).
- Next 16 allows one `next dev` per project folder ("Another next dev server is already
  running"). Stopping a background shell on Windows can leave its node process alive: stop the
  PID the message prints before `npm run test:e2e`.
- The containerized dev server (`--profile app`) runs `next dev --webpack` with `WATCHPACK_POLLING`:
  Turbopack's watcher misses host edits through the bind mount. Host `npm run dev` uses Turbopack.
  After dependency changes start it with `--build --renew-anon-volumes`: its `node_modules` lives in
  an anonymous volume that Compose otherwise reuses (stale packages, "Module not found").
- Never rewrite files with PowerShell 5.1 `Get-Content`/`Set-Content`: it reads UTF-8 as ANSI and
  corrupts accents (pt-AO text). Use the editor tools.
- Git Bash rewrites `/paths` passed to docker: prefix commands with `MSYS_NO_PATHCONV=1`.
- MinIO image: `cgr.dev/chainguard/minio` (official images were removed from Docker Hub).
