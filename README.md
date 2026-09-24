# Convites Digitais

Interactive digital wedding invitations for the Angolan market. Each couple gets an event, adds
their guests, and sends every guest a personal link (mainly over WhatsApp). Guests open an elegant,
mobile-first invitation with their own name and confirm attendance.

The full product brief lives in [docs/SPEC.md](docs/SPEC.md); the design reference screenshots in
[docs/reference/](docs/reference/).

## Status

The platform is built in 11 phases (see the brief). This README grows with each phase.

| Phase | Scope                                                                             | Status  |
| ----- | --------------------------------------------------------------------------------- | ------- |
| 1     | Foundation: Next.js, tooling, env validation, logging, Sentry, Docker dev, health | Done    |
| 2     | Database: Prisma schema, migrations, seed                                         | Done    |
| 3     | Design system, fonts, i18n, themes                                                | Done    |
| 4     | Invitation pages ("Praia Rosa")                                                   | Done    |
| 5     | RSVP, Redis cache, rate limiting, view tracking                                   | Done    |
| 6     | "Champanhe" theme                                                                 | Planned |
| 7     | Auth, couple dashboard, uploads, BullMQ worker                                    | Planned |
| 8     | Guest management, CSV, WhatsApp                                                   | Planned |
| 9     | Admin area and audit log                                                          | Planned |
| 10    | Production Docker/Caddy, backups, full CI/CD with staging and rollback            | Planned |
| 11    | Performance, accessibility, final docs                                            | Planned |

## Stack

Next.js 16.3 (App Router, Turbopack, React 19.3) · TypeScript 6.0 (strict) · Tailwind CSS 4.3 ·
Zod 4 · Winston 3 · Sentry 11 · PostgreSQL 18 with Prisma 7.10 · Better Auth 1.7 (tables and
password hashing so far) · Redis 8 (ioredis 6) · React Hook Form 7 · Tabler Icons 3 · Motion 13 ·
Embla Carousel 8 ·
sharp 0.35 (preview images; image processing later) · Vitest 5 · Playwright · Node.js 24 LTS.
Coming in later phases: BullMQ.

Every package is on its latest stable release except where a newer major is blocked:

| Package     | Pinned to | Why                                                                                         |
| ----------- | --------- | ------------------------------------------------------------------------------------------- |
| TypeScript  | `~6.0.3`  | TypeScript 7 is out, but `typescript-eslint` (used by `eslint-config-next`) supports `<6.1` |
| ESLint      | `^9.39`   | ESLint 10 is out, but the React/import/jsx-a11y plugins in `eslint-config-next` stop at 9   |
| @types/node | `^24`     | Matches the Node.js 24 LTS runtime                                                          |
| Prisma      | `7.10.0`  | npm's `latest` tag is an 8.0 release candidate, and Better Auth supports Prisma up to 7     |

## Getting started

Prerequisites: **Node.js 24** (see `.nvmrc`), **npm**, and **Docker** (Docker Desktop on Windows/macOS).

```bash
npm install                       # also generates the Prisma client
cp .env.example .env.local        # PowerShell: Copy-Item .env.example .env.local
docker compose up -d              # Postgres, Redis, MinIO (+ bucket), Mailpit
npm run db:deploy                 # apply the database migrations
npm run db:seed                   # demo event, guests and logins (see "Database")
npm run dev                       # http://localhost:3000
```

Check the stack with `curl http://localhost:3000/api/health`, then open a demo invitation (the seed
prints every link), e.g. http://localhost:3000/c/braulio-e-nanda/demo-familia-silva-001.

To run the dev server in a container as well (hot reload through a bind mount):

```bash
docker compose --profile app up -d --build --renew-anon-volumes
```

`--renew-anon-volumes` matters after dependency changes: the container keeps `node_modules` in an
anonymous volume, and Docker Compose would otherwise reuse the old one with the new image.

The containerized dev server uses webpack with a polling file watcher, because Turbopack's watcher
misses edits made on a Windows/macOS host through the bind mount. On Windows, `npm run dev` on the
host (Turbopack) is much faster; use the container when you need a Linux-identical environment.

### Local services

| Service    | Host port | Notes                                                                         |
| ---------- | --------- | ----------------------------------------------------------------------------- |
| PostgreSQL | 5433      | Not 5432, so a locally installed PostgreSQL never intercepts the app          |
| Redis      | 6379      | Append-only persistence; `noeviction` policy (required by BullMQ)             |
| MinIO      | 9000      | S3 API. Console on http://localhost:9001 (`convites` / `convites-dev-secret`) |
| Mailpit    | 8025      | Web UI for e-mails sent in development; SMTP on 1025                          |

Every host port can be changed through an environment variable read by Docker Compose
(`POSTGRES_PORT`, `REDIS_PORT`, `MINIO_PORT`, `MINIO_CONSOLE_PORT`, `MAILPIT_UI_PORT`,
`MAILPIT_SMTP_PORT`, `WEB_PORT`), e.g. in a `.env` file next to `docker-compose.yml`.

MinIO's official images were removed from Docker Hub in September 2026; the stack uses Chainguard's
free MinIO build (`cgr.dev/chainguard/minio`). The app only uses the S3 API, so any S3-compatible
server works.

### Running the production build locally

```bash
npm run build
npm start                         # standalone server + preload, like the Docker image
```

## Environment variables

Validated with Zod in [src/env.ts](src/env.ts) when the server (or worker) starts: the process exits
with the list of missing or invalid variables. They are **not** validated during `next build`, so
one image can be promoted from staging to production. `.env.example` documents every variable.

| Variable                                | Required | Default                 | Purpose                                               |
| --------------------------------------- | -------- | ----------------------- | ----------------------------------------------------- |
| `DATABASE_URL`                          | yes      |                         | PostgreSQL connection string                          |
| `REDIS_URL`                             | yes      |                         | Redis connection string                               |
| `APP_ENV`                               | no       | `development`           | `development`, `test`, `staging` or `production`      |
| `APP_URL`                               | no       | `http://localhost:3000` | Public base URL (must be https on staging/production) |
| `APP_RELEASE`                           | no       | `dev`                   | Release identifier (git SHA in CI/Docker)             |
| `SERVICE_NAME`                          | no       | `web`                   | `web` or `worker`, added to every log line            |
| `LOG_LEVEL`                             | no       | `info`                  | `error`, `warn`, `info`, `http` or `debug`            |
| `SENTRY_DSN`                            | no       |                         | Server-side Sentry DSN; Sentry is off when empty      |
| `SENTRY_TRACES_SAMPLE_RATE`             | no       | `0.1`                   | Fraction of requests traced (0–1)                     |
| `NEXT_PUBLIC_SENTRY_DSN`                | no       |                         | Browser Sentry DSN (inlined at build time)            |
| `NEXT_PUBLIC_APP_ENV`                   | no       | `development`           | Environment reported by the browser SDK               |
| `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE` | no       | `0.1`                   | Browser trace sample rate                             |
| `SENTRY_ORG`, `SENTRY_PROJECT`          | CI only  |                         | Source map upload target                              |
| `SENTRY_AUTH_TOKEN`                     | CI only  |                         | Enables source map upload; never needed at runtime    |
| `SEED_COUPLE_PASSWORD`                  | seed     | `noivos-demo-2027`      | Password of the demo couple login                     |
| `SEED_ADMIN_PASSWORD`                   | seed     | `admin-demo-2027`       | Password of the demo admin login                      |
| `TEST_DATABASE_URL`                     | tests    | `…:5433/convites_test`  | Integration test database (name must end in `_test`)  |
| `TEST_REDIS_URL`                        | tests    | `…:6379/15`             | Integration test Redis database (never 0; flushed)    |

## Scripts

| Command                       | What it does                                                       |
| ----------------------------- | ------------------------------------------------------------------ |
| `npm run dev`                 | Development server (Turbopack)                                     |
| `npm run build`               | Production build (standalone output) + observability preload       |
| `npm start`                   | Runs the production build locally, the way the Docker image does   |
| `npm run lint`                | ESLint (zero warnings allowed)                                     |
| `npm run typecheck`           | Generates route types, then `tsc --noEmit`                         |
| `npm run format`              | Prettier (also sorts Tailwind classes)                             |
| `npm test`                    | Vitest unit tests (fast, no services needed)                       |
| `npm run test:integration`    | Integration tests against Postgres (needs `docker compose up`)     |
| `npm run test:e2e`            | Playwright end-to-end tests in a phone-sized Chromium (seeded DB)  |
| `npm run check`               | Format check, lint, type-check and unit tests                      |
| `npm run db:migrate`          | Create and apply a migration after editing the schema (dev)        |
| `npm run db:deploy`           | Apply pending migrations (CI, staging, production)                 |
| `npm run db:seed`             | Load or refresh the demo data (never in production)                |
| `npm run db:reset`            | Wipe the dev database, re-apply migrations, seed (asks to confirm) |
| `npm run db:generate`         | Regenerate the Prisma client (`npm install` does it too)           |
| `npm run db:studio`           | Prisma Studio, a browser UI for the data                           |
| `npm run themes:placeholders` | Draw missing placeholder theme artwork (see "Themes")              |
| `npm run demo:media`          | Draw missing demo photos and music in `public/demo/`               |

## Architecture

```
app/                    Routes (App Router): (public), api/health; dashboard and admin in later phases
app/c/[eventSlug]/[guestToken]/  Guest invitation, its WhatsApp preview image and calendar file
app/(internal)/design/  Design preview page (/design; 404 in production)
assets/fonts/           Theme fonts as WOFF files for the generated preview image (OFL)
proxy.ts                Next.js 16 proxy (formerly middleware): request ID + nonce-based Content-Security-Policy
instrumentation.ts      Server startup: environment check, request hooks, Sentry (server/edge), onRequestError
instrumentation-client.ts  Sentry browser SDK
sentry.*.config.ts      Sentry server/edge initialization
scripts/preload.ts      Runs before the production server (see "Request IDs")
scripts/                Also: placeholder artwork generator, screenshot helper (see "Themes")
prisma/                 Schema, migrations, demo seed (prisma/seed/)
prisma.config.ts        Prisma 7 configuration (database URL, seed command)
public/themes/<id>/     Theme artwork (placeholders until the licensed artwork replaces them)
public/demo/            Demo event media: placeholder photos and music (npm run demo:media)
src/env.ts              Zod-validated server environment; src/env.public.ts for browser values
src/i18n/               pt-AO.ts: every user-facing string (Portuguese, Angola); date and plural formatting
src/components/         Shared UI: invitation building blocks (ui/), icons, the theme root
src/features/           Feature code by area: invitation/ (guest pages), design-preview/
src/themes/             Theme definitions (plain data), fonts, colour overrides, contrast maths
src/lib/                Logger, redaction, request context, Sentry privacy, CSP, guest tokens, validation
src/server/             Server-only code: Prisma and Redis clients, health checks, invitation queries, media URLs
src/generated/prisma    Generated Prisma client (not committed)
tests/unit/             Tests for root-level files (the rest live next to the code as *.test.ts)
tests/integration/      Tests against a real Postgres (*.int.test.ts)
tests/e2e/              Playwright end-to-end tests (*.spec.ts)
```

### Database

PostgreSQL 18 through Prisma 7.10 ([prisma/schema.prisma](prisma/schema.prisma)). Prisma 7 changed
its setup; the parts that matter here:

- [prisma.config.ts](prisma.config.ts) holds the database URL and the seed command. Prisma no
  longer reads `.env` files, so the config loads them with Next.js's own loader (`.env.local`
  included); variables already set in the environment win.
- The client is generated into `src/generated/prisma` (gitignored; `npm install` regenerates it)
  and talks to Postgres through the `pg` driver adapter. Server code uses the shared client from
  [src/server/db/prisma.ts](src/server/db/prisma.ts) (`getPrisma()`); Client Components may import
  types and enums from `@/generated/prisma/enums` or `/models`, never `/client`.
- Prisma no longer generates or seeds automatically after migrations: use the `db:*` scripts.

Model overview:

| Area     | Models                                                         | Notes                                                                                                                                        |
| -------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth     | `User`, `Session`, `Account`, `Verification`                   | Exactly what Better Auth expects (email + password, admin plugin). Roles: `couple` (default), `admin`                                        |
| Events   | `Event`, `EventLocation`, `TimelineItem`, `GuestRule`, `Media` | Editable texts are `null` until the couple changes them (the pt-AO defaults are shown). Section order and visibility live in `sectionConfig` |
| Guests   | `Guest`, `Rsvp`, `InvitationView`                              | One RSVP per guest; `attending = null` means the guest only tapped a WhatsApp button so far                                                  |
| Platform | `AuditLog`                                                     | Entries survive the deletion of the admin who made them                                                                                      |

Conventions: snake_case table names; UUIDv7 keys for our tables (Better Auth generates its own
IDs); every timestamp is `timestamptz`, stored in UTC and shown in Africa/Luanda. Deleting an event
deletes everything under it; deleting a user who owns an event is refused. Migration
[20260923222022_integrity_constraints](prisma/migrations/20260923222022_integrity_constraints/migration.sql)
adds CHECK constraints the Prisma schema cannot express: at least 1 seat, guest tokens of 16+
URL-safe characters, at most 2 parents per side, valid slugs and roles.

**Changing the schema:** edit `schema.prisma`, run `npm run db:migrate -- --name what-changed`,
review the generated SQL and commit it with the schema. Never edit a migration that has already
been applied anywhere; add a new one. CI fails if the schema changes without a migration.

**Demo data** (`npm run db:seed`): the Braúlio & Nanda wedding in the "Praia Rosa" theme on Friday
15 January 2027 (ceremony at Praia do Bispo at 16h00, copo-d'água at 20h00), the full timeline,
the 8 default guest rules, 6 placeholder gallery photos, a placeholder music loop and 10 guests
covering every RSVP state; plus the same wedding in the Save the Date phase
(`braulio-e-nanda-save-the-date`, 2 guests). The seed prints every guest's invitation link.
Logins (usable from Phase 7):

| Login                  | Default password   | Role     |
| ---------------------- | ------------------ | -------- |
| `noivos@convites.test` | `noivos-demo-2027` | `couple` |
| `admin@convites.test`  | `admin-demo-2027`  | `admin`  |

Demo phone numbers use the unassigned `+244 900 000 xxx` range, so no demo WhatsApp link reaches a
real person. The seed refuses to run when `APP_ENV` or `NODE_ENV` is `production`.

### Logging

[src/lib/logger.ts](src/lib/logger.ts) (Node.js runtime only) writes JSON lines to stdout in
production and colorized lines in development. Every line carries `timestamp`, `level`, `service`,
`env`, `release` and `requestId`. Pass errors as `logger.error('What failed', { err })`.

- **Redaction** ([src/lib/redact.ts](src/lib/redact.ts)) runs on every line: values under sensitive
  keys (passwords, tokens, cookies, phone numbers, IBANs, guest names) and sensitive patterns in any
  string (guest tokens in `/c/<slug>/<token>` URLs, query-string secrets, bearer tokens, JWTs, e-mail
  addresses, IBANs, +244 and international phone numbers). In production the same redaction is
  applied to console output from Next.js and libraries.
- **Access log**: one line per request with method, path, status and duration (`http` level; static
  assets and health probes at `debug`).
- **Sentry**: `error` logs are also sent to Sentry, except errors Sentry has already captured.

### Request IDs

Every request gets an `x-request-id` (a valid incoming one, e.g. from Caddy, is reused) that is
returned in the response, rendered as `data-request-id` on `<html>` for the browser SDK, attached
to Sentry events and included in every log line of that request through AsyncLocalStorage.

Two Next.js 16 details shape the implementation:

- The proxy runs as a separate step before rendering, so a context opened there never reaches Server
  Components, Server Actions or Route Handlers. The context is opened one level earlier, at the Node
  HTTP layer, through the `http.server.request.start` diagnostics channel
  ([src/lib/observability/http-hooks.ts](src/lib/observability/http-hooks.ts)); the same hook writes
  the access log. `proxy.ts` only guarantees the header.
- In production, Next.js runs `instrumentation.ts` lazily, on the first request. The server is
  therefore started with `node --require ./dist/preload.cjs`: the preload validates the environment
  (the process exits before listening if it is invalid) and installs the hooks at startup.

### Sentry

Server, edge and browser SDKs share one privacy configuration
([src/lib/sentry/options.ts](src/lib/sentry/options.ts)). Sentry 11 collects user info, cookies,
headers, bodies, query strings and local variables when `dataCollection` is left unset, so every
category is set explicitly, and events, breadcrumbs and spans pass through the same redaction as the
logs. Browser events are tunnelled through `/monitoring` on our own origin. Source maps are only
generated when `SENTRY_AUTH_TOKEN` is set (CI), uploaded, then deleted, so they are never public.
No Session Replay or feedback widget, to keep the JavaScript light on low-end phones.

### Security headers

- `next.config.ts`: HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`,
  `X-Frame-Options: SAMEORIGIN` (the dashboard will preview invitations in a same-origin iframe) and
  `Cross-Origin-Opener-Policy`. Invitation links (`/c/...`) also get `Referrer-Policy: no-referrer`
  and `X-Robots-Tag: noindex`, because their path contains the guest's secret token.
- `proxy.ts`: the Content-Security-Policy, with a fresh nonce per request. A static policy in
  `next.config` would have to allow inline scripts for Next.js's own scripts. Pages therefore render
  per request (the root layout reads the request headers).

### Health check

`GET /api/health` checks the database and Redis in parallel (1.5 s timeout each) and returns
`{ status, version, uptimeSeconds, timestamp, checks }`:

- `ok` (200): everything is up.
- `degraded` (200): Redis is down; the app keeps working.
- `down` (503): the database is unreachable.

Failure details are logged, never returned.

## Guest invitation

Every guest has a personal link, `/c/<eventSlug>/<guestToken>`
([app/c/[eventSlug]/[guestToken]/page.tsx](app/c/[eventSlug]/[guestToken]/page.tsx)), rendered on
the server in the event's theme.

- **Data:** the link is checked with Zod first, so malformed or probing URLs never reach Postgres.
  [src/server/invitations/queries.ts](src/server/invitations/queries.ts) then loads the event by
  slug and the guest by token (two lookups, cached separately in Redis from Phase 5) and builds a
  JSON-safe read model ([src/features/invitation/types.ts](src/features/invitation/types.ts)): this
  event and this one guest's name and seats. Never other guests, guests' phone numbers or the
  owner's account. Couple-provided values that reach HTML or CSS (links, colours, phone numbers)
  are validated again there.
- **Not found:** a malformed or unknown link, a guest of another event and an inactive event all
  show the same "Convite não encontrado" page with a real 404 status. The route has no
  `loading.tsx` on purpose: a streamed loading screen would turn that 404 into a 200.
- **Opening screen:** an envelope addressed to the guest, sealed with the monogram. The tap opens it
  (Motion's small WAAPI-based `useAnimate`, a plain fade with reduced motion) and starts the music,
  which browsers only allow after a tap. A floating button then mutes and unmutes; music pauses
  while the guest is in another app. The envelope shows once per browser tab (an inline script with
  the CSP nonce hides it before the first paint on a reload), and without JavaScript the invitation
  is simply readable. The same script remembers a tap made while the page's JavaScript is still
  loading (slow phones), and the envelope opens as soon as it is ready.
- **Phases:** in the Save the Date phase the guest sees only that page, whose "Confirmar presença"
  opens the RSVP options in a dialog. In the invitation phase the sections follow the couple's order
  and visibility (`Event.sectionConfig`), one full screen each with gentle scroll snap; optional
  sections without content are skipped.
- **Sections** ([src/features/invitation/sections/](src/features/invitation/sections/)): invitation
  card, countdown (against the server's clock, so a phone with the wrong time still counts right),
  message, gallery (Embla coverflow and a full-screen lightbox in a native `<dialog>`), schedule
  (venues with Google Maps and Waze, serpentine timeline), dress code, guest manual, gifts (IBAN
  with a copy button), RSVP (see below) and closing ("Adicionar ao calendário": an `.ics` file
  from `calendario.ics/route.ts` and a Google Calendar link).
- **WhatsApp link preview:** `generateMetadata` sets the title ("Convite de Casamento – Braúlio &
  Nanda"), the date and `noindex`; WhatsApp's crawler gets them in the `<head>` (Next.js serves
  metadata blocking to it). The image, `opengraph-image.tsx`, is drawn with `next/og` in the theme's
  style from the fonts in [assets/fonts/](assets/fonts/) and re-encoded as a JPEG of about 45 KB,
  because WhatsApp skips large previews. It shows the event only, never the guest.
- **Performance:** everything is server-rendered; the client pieces (envelope and music, countdown,
  gallery, copy button, RSVP dialog) add about 25 KB of gzipped JavaScript to the shared
  framework bundle (about 240 KB, mostly React, Next.js and the Sentry browser SDK). The first
  screen's images are preloaded, the rest load lazily. Guest links send `Referrer-Policy:
no-referrer` and `X-Robots-Tag: noindex`.

### RSVP

Each event has an RSVP mode (`Event.rsvpMode`); the Save the Date's "Confirmar presença" opens the
same options in a dialog.

- **FORM** (and BOTH): "Vai estar presente?", the number of people (up to the guest's seats),
  companion names and a message, in [src/features/invitation/rsvp/](src/features/invitation/rsvp/).
  React Hook Form validates in the browser with the Zod schema shared with the server
  ([src/lib/validation/rsvp.ts](src/lib/validation/rsvp.ts), built on `zod/mini` to keep the page
  light); the `submitRsvp` Server Action trusts nothing from the browser: it checks the link, the
  event (active, form mode), the deadline and the rate limits, and validates the answer again
  against the guest's seats from the database. A saved answer is shown with "Alterar a resposta"
  until the deadline, read-only after it. The form needs JavaScript (its submit button stays
  disabled until the page is interactive); its code only loads on pages that show it.
- **WHATSAPP** (and BOTH): round buttons for the groom and the bride. They open
  `/c/<slug>/<token>/whatsapp/<noivo|noiva>`, which records the tap as a confirmation intent (after
  the response; never overwriting a form answer; not after the deadline) and forwards to `wa.me`
  with the pre-filled message.
- The deadline (`Event.rsvpDeadline`, inclusive) and the seat limit are enforced on the server.

### Caching, rate limits and views

Redis is optional at runtime ([src/server/redis.ts](src/server/redis.ts)): request paths only use
it through `withRedis`, which skips it at once when it is not connected (no waiting on a
reconnect) and gives up after 250 ms, logging a warning at most every 30 s.

- **Cache** ([src/server/invitations/queries.ts](src/server/invitations/queries.ts)): the event read
  model by slug and the guest by a hash of the token, 10 minutes each. Anything that changes a guest
  page must call `invalidateInvitationEvent(slug)` / `invalidateInvitationGuest(token)` (dashboard
  edits in Phases 7 and 8, activation changes in Phase 9). RSVPs are not cached.
- **Rate limits** ([src/server/rate-limit/](src/server/rate-limit/)): a sliding-window log in a
  sorted set, one atomic Lua script per request; subjects (IPs, tokens) are hashed in the keys.
  Without Redis the request is allowed and the failure logged.

  | Limit                           | Value         | Where                                       |
  | ------------------------------- | ------------- | ------------------------------------------- |
  | Guest pages (`/c/…`) per IP     | 300 per 5 min | `proxy.ts` (link-preview bots exempt) → 429 |
  | RSVP form per guest link        | 10 per 10 min | `submitRsvp`                                |
  | RSVP form per IP                | 30 per 10 min | `submitRsvp`                                |
  | WhatsApp taps recorded per link | 20 per 10 min | WhatsApp route (still forwards to WhatsApp) |

  The per-IP limits are generous because Angolan mobile carriers put many phones behind one IP.
  The client IP is the right-most `X-Forwarded-For` entry (set by Caddy in production).

- **Views** ([src/server/invitations/views.ts](src/server/invitations/views.ts)): one
  `InvitationView` per guest per hour, recorded with `after()` once the page has been sent; link
  preview bots do not count. A Redis key de-duplicates; without Redis, Postgres is asked for a view
  in the last hour.

**Demo media.** Until uploads exist (Phase 7), the demo event's gallery photos and music are
placeholder files in `public/demo/` (`npm run demo:media`), referenced by `Media` rows with `demo/…`
keys that [src/server/media/urls.ts](src/server/media/urls.ts) maps to `/demo/…`. The music is a
synthesized loop: use licensed music for anything real.

## Themes

An invitation's look is its **theme** (`Event.themeId`) plus the couple's colour **overrides**
(`Event.themeOverrides`). "Praia Rosa" is available now; "Champanhe" arrives in Phase 6.

- **A theme is plain data** ([src/themes/praia-rosa.ts](src/themes/praia-rosa.ts)): colours, the
  envelope and wax seal colours, font variables, artwork files with their sizes, decorations per
  section, the hero illustration and the button shape. It imports no React or `next/font` code, so
  server code and tests can use it.
- **`ThemeRoot`** ([src/components/theme/theme-root.tsx](src/components/theme/theme-root.tsx))
  applies a theme: it sets the `--theme-*` CSS variables, attaches the fonts and the paper texture,
  and makes the invitation a size container.
- **Tailwind tokens** in [app/globals.css](app/globals.css) read those variables. Components use
  `text-script`, `bg-accent`, `text-ink`, `text-muted`, `font-script`, `font-caps`, `font-body`…
  and never hard-code theme colours, so overrides need no component changes. Plain CSS (CSS
  modules, `@utility`) must read `var(--theme-accent)` and friends directly: `--color-*` and
  `--font-*` are resolved on `:root`, above the theme, and would always give the fallbacks.
- **Container units:** invitation text is sized in `cqi` (a share of the invitation's own width),
  not `vw`, so it scales the same on a phone and in the dashboard's phone-frame preview.
- **Overrides** ([src/themes/overrides.ts](src/themes/overrides.ts)): `#RRGGBB` values for
  background, ink, script and accent only; anything else discards the overrides as a whole.
- **Contrast:** unit tests check every theme against WCAG AA: body text 4.5:1, script (large text
  only) 3:1, button labels 4.5:1, buttons, icons and lines 3:1. That is why the Praia Rosa pink and
  olive are a touch deeper than in the reference.

### Fonts

Self-hosted with `next/font` (the guest's phone never contacts Google; only the weights in use are
downloaded), declared in [src/themes/fonts.ts](src/themes/fonts.ts). They were chosen side by side
with the reference on `/design`:

| Role                                        | Font         | Why                                                      |
| ------------------------------------------- | ------------ | -------------------------------------------------------- |
| Script titles and the couple's names        | Ephesis      | Thin, relaxed brush-pen script, closest to the reference |
| Small caps ("Com a benção de Deus", titles) | Cormorant SC | True small caps, elegant at small sizes                  |
| Body text (message, rules, timeline)        | EB Garamond  | Sturdy serif, readable on small screens                  |
| Buttons                                     | System sans  | Clean labels like the reference, nothing to download     |

Numbers use lining figures everywhere; the serif fonts default to old-style figures.

### Components and icons

[src/components/ui/](src/components/ui/) holds the invitation building blocks: `SectionTitle`
(script word over a small-caps subtitle), `PillButton` (link or button; external links open in a
new tab without a referrer), `Monogram`, `DottedNameLine` (the guest's name), `DateLine` (Luanda
time with a machine-readable `<time>`), `InfoBox`, `QuoteBox`, `CornerDecorations` and
`SerpentineTimeline` (rows of 3, rows of 2 below 340 px; the list stays in chronological order for
screen readers).

Icons ([src/components/icons/](src/components/icons/)) are Tabler icons plus five custom line icons
(wedding dress, bride and groom, bouquet, dancing couple, wedding rings), rendered as plain SVG on
the server. Client Components import the Tabler icons they need directly instead of `Icon`, which
would bundle the whole set.
**Icon keys are stored in the database** (timeline items, guest rules): add keys freely, never
rename one.

### Artwork

The files in `public/themes/praia-rosa/` are **placeholders** in the positions and style of the
reference, drawn by `npm run themes:placeholders`. Licensed artwork replaces them file for file:

| File                     | Pixels    | Where                                               | Requirements                                                             |
| ------------------------ | --------- | --------------------------------------------------- | ------------------------------------------------------------------------ |
| `background.webp`        | 1080×1920 | Paper texture behind every section                  | Opaque. Repeats vertically at full width: top and bottom edges must join |
| `floral-corner.webp`     | 640×640   | Section corners                                     | Transparent. Drawn for the **top-left** corner; other corners mirror it  |
| `floral-corner-alt.webp` | 640×640   | A second corner arrangement                         | Same as above                                                            |
| `floral-garland.webp`    | 1080×440  | Top of the message section (mirrored at the bottom) | Transparent. Drawn for the top edge, flowers along the top-left          |
| `hero-beach.webp`        | 1080×900  | Bottom of the invitation card and Save the Date     | Transparent at the top, so the paper shows through above the scene       |

To replace a file, export the artwork as WebP (about quality 80, with alpha where transparent)
under the same name. If its size or aspect ratio changes, update `width` and `height` in
[src/themes/praia-rosa.ts](src/themes/praia-rosa.ts); the decorations' positions, widths and
offsets per section are in the same file. `npm run themes:placeholders` never overwrites an
existing file unless run with `-- --force`.

### Adding a theme

1. Create `src/themes/<id>.ts` with a `ThemeDefinition` and add it to `THEMES` in
   [src/themes/index.ts](src/themes/index.ts).
2. Declare its fonts in [src/themes/fonts.ts](src/themes/fonts.ts) (TypeScript requires an entry
   for every theme).
3. Put its artwork in `public/themes/<id>/`.
4. Run `npm test` (the contrast and artwork checks cover every theme) and review
   `/design?theme=<id>`.

### Previewing

`/design` (not available in production) shows the font candidates, the palette with contrast
ratios, every shared component on a phone-width invitation, the narrow timeline, the date formats
and all icons. For visual checks from the command line:

```bash
node scripts/screenshot.mjs http://localhost:3000/design shots "--selector=[data-theme] > section"
```

It saves one PNG per matching element, at phone size by default (`--width`, `--height`, `--scale`
and `--full` change that). `--click` (repeatable) and `--wait` interact first, e.g. to open an
invitation's envelope:

```bash
node scripts/screenshot.mjs http://localhost:3000/c/braulio-e-nanda/demo-familia-silva-001 shots \
  "--selector=main > section" "--click=button[aria-label='Abrir o convite']" --wait=3000
```

## Testing and CI

Vitest runs two projects, Playwright a third suite:

- `npm test`: unit tests next to the code (`*.test.ts`, `*.test.tsx`), including theme contrast
  checks, the invitation's read model, countdown, calendar and link builders, components and
  sections rendered to HTML with `react-dom/server`, and one test that serves real HTTP requests
  through the request hooks. No services needed.
- `npm run test:e2e`: `tests/e2e/*.spec.ts` in a phone-sized Chromium: opening the envelope, the
  reload, reduced motion, the gallery lightbox, the calendar file, the 404 page, the Save the Date
  dialog, answering and changing the RSVP form, and the WhatsApp link. Its global setup re-seeds
  the demo data and clears the rate-limit counters, so runs are repeatable (`E2E_SKIP_RESET=1`
  skips that for a server that does not use the local database and Redis). It starts `next dev` on
  port 3100, or tests a running app given in `E2E_BASE_URL`. Runs locally for
  now; CI gets it in Phase 10.
- `npm run test:integration`: `tests/integration/*.int.test.ts` against a real Postgres and Redis:
  the migrations, the demo seed (twice), guest lookup by token (including that no other guest's
  data leaks), the cache and its invalidation, the rate limiter (exact under concurrency), RSVP
  storage and the Server Action's rules, view de-duplication (with and without Redis), the
  integrity rules and the delete behaviour. It uses the `convites_test` database on the Docker
  Postgres (`TEST_DATABASE_URL`) and Redis database 15 (`TEST_REDIS_URL`, never 0), applies
  migrations with `prisma migrate deploy` and empties both before each run; it refuses a database
  whose name does not end in `_test`. If a migration was edited after the test database applied
  it, drop it: `docker compose exec postgres dropdb -U convites convites_test`.

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs on every push and pull request, with a
Postgres service container: Prisma schema validation, format check, lint, type-check, unit tests,
migrations applied to an empty database, a check that fails if the schema changed without a
migration, integration tests (with a Redis service container too), and the production build.
Playwright E2E and the deploy workflow arrive in Phase 10.
