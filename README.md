# Convites Digitais

Interactive digital wedding invitations for the Angolan market. Each couple gets an event, adds
their guests, and sends every guest a personal link (mainly over WhatsApp). Guests open an elegant,
mobile-first invitation with their own name and confirm attendance.

The full product brief lives in [docs/SPEC.md](docs/SPEC.md); the design reference screenshots in
[docs/reference/](docs/reference/).

## Status

The platform is built in 11 phases (see the brief). This README grows with each phase. Phase 10
is split: the CI part is done, while the production deployment (10b) waits until there is a server
and a domain, and must be done before the first real couple uses the platform.

| Phase | Scope                                                                             | Status  |
| ----- | --------------------------------------------------------------------------------- | ------- |
| 1     | Foundation: Next.js, tooling, env validation, logging, Sentry, Docker dev, health | Done    |
| 2     | Database: Prisma schema, migrations, seed                                         | Done    |
| 3     | Design system, fonts, i18n, themes                                                | Done    |
| 4     | Invitation pages ("Praia Rosa")                                                   | Done    |
| 5     | RSVP, Redis cache, rate limiting, view tracking                                   | Done    |
| 6     | "Champanhe" theme                                                                 | Done    |
| 7     | Auth, couple dashboard, uploads, BullMQ worker                                    | Done    |
| 8     | Guest management, CSV, WhatsApp                                                   | Done    |
| 9     | Admin area and audit log                                                          | Done    |
| 10a   | CI: end-to-end tests against the production build, Dependabot                     | Done    |
| 11    | Performance, accessibility, final docs                                            | Done    |
| 10b   | Production Docker/Caddy, backups, deploy workflow with staging and rollback       | Planned |

## Stack

Next.js 16.3 (App Router, Turbopack, React 19.3) · TypeScript 6.0 (strict) · Tailwind CSS 4.3 ·
Zod 4 · Winston 3 · Sentry 11 · PostgreSQL 18 with Prisma 7.10 · Better Auth 1.7 (e-mail +
password logins, couple/admin roles) · Redis 8 (ioredis 6) · React Hook Form 7 · Tabler Icons 3 ·
Motion 13 · Embla Carousel 8 · BullMQ 6 (background jobs) · AWS SDK 3 (S3 API: MinIO, Cloudflare R2
or AWS S3) · sharp 0.35 (uploaded images, link preview images) · Vitest 5 · Playwright ·
Node.js 24 LTS.

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
npm run worker:dev                # in a second terminal: processes uploads (see "Uploads")
```

Check the stack with `curl http://localhost:3000/api/health`, then open a demo invitation (the seed
prints every link), e.g. http://localhost:3000/c/braulio-e-nanda/demo-familia-silva-001, or the
same wedding in the "Champanhe" theme:
http://localhost:3000/c/braulio-e-nanda-champanhe/demo-champanhe-silva-01.

To run the dev server and the worker in containers as well (hot reload through a bind mount):

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

| Variable                                | Required | Default                 | Purpose                                                |
| --------------------------------------- | -------- | ----------------------- | ------------------------------------------------------ |
| `DATABASE_URL`                          | yes      |                         | PostgreSQL connection string                           |
| `REDIS_URL`                             | yes      |                         | Redis connection string                                |
| `BETTER_AUTH_SECRET`                    | yes      |                         | Signs session cookies; 32+ random characters           |
| `S3_BUCKET`                             | yes      |                         | Private media bucket (no dots in the name)             |
| `S3_ACCESS_KEY_ID`                      | yes      |                         | Storage access key, limited to that bucket             |
| `S3_SECRET_ACCESS_KEY`                  | yes      |                         | Its secret                                             |
| `S3_ENDPOINT`                           | no       | AWS S3                  | S3 API address (MinIO, Cloudflare R2)                  |
| `S3_PUBLIC_ENDPOINT`                    | no       | `S3_ENDPOINT`           | Where browsers upload, when it differs (app in Docker) |
| `S3_REGION`                             | no       | `us-east-1`             | `auto` for Cloudflare R2                               |
| `S3_FORCE_PATH_STYLE`                   | no       | `false`                 | `true` for MinIO (`http://host/bucket/key` URLs)       |
| `APP_ENV`                               | no       | `development`           | `development`, `test`, `staging` or `production`       |
| `APP_URL`                               | no       | `http://localhost:3000` | Public base URL (must be https on staging/production)  |
| `APP_RELEASE`                           | no       | `dev`                   | Release identifier (git SHA in CI/Docker)              |
| `SERVICE_NAME`                          | no       | `web`                   | `web` or `worker`, added to every log line             |
| `LOG_LEVEL`                             | no       | `info`                  | `error`, `warn`, `info`, `http` or `debug`             |
| `CONTACT_WHATSAPP`                      | deployed | demo number             | Team's WhatsApp (+2449…), the landing page's contact   |
| `SENTRY_DSN`                            | no       |                         | Server-side Sentry DSN; Sentry is off when empty       |
| `SENTRY_TRACES_SAMPLE_RATE`             | no       | `0.1`                   | Fraction of requests traced (0–1)                      |
| `NEXT_PUBLIC_SENTRY_DSN`                | no       |                         | Browser Sentry DSN (inlined at build time)             |
| `NEXT_PUBLIC_APP_ENV`                   | no       | `development`           | Environment reported by the browser SDK                |
| `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE` | no       | `0.1`                   | Browser trace sample rate                              |
| `SENTRY_ORG`, `SENTRY_PROJECT`          | CI only  |                         | Source map upload target                               |
| `SENTRY_AUTH_TOKEN`                     | CI only  |                         | Enables source map upload; never needed at runtime     |
| `SEED_COUPLE_PASSWORD`                  | seed     | `noivos-demo-2027`      | Password of the demo couple login                      |
| `SEED_ADMIN_PASSWORD`                   | seed     | `admin-demo-2027`       | Password of the demo admin login                       |
| `TEST_DATABASE_URL`                     | tests    | `…:5433/convites_test`  | Integration test database (name must end in `_test`)   |
| `TEST_REDIS_URL`                        | tests    | `…:6379/15`             | Integration test Redis database (never 0; flushed)     |
| `TEST_S3_ENDPOINT`                      | tests    | `http://localhost:9000` | Integration test MinIO (bucket `convites-media-test`)  |

## Scripts

| Command                       | What it does                                                       |
| ----------------------------- | ------------------------------------------------------------------ |
| `npm run dev`                 | Development server (Turbopack)                                     |
| `npm run build`               | Production build (standalone output) + observability preload       |
| `npm start`                   | Runs the production build locally, the way the Docker image does   |
| `npm run worker`              | The background worker (uploads); `worker:dev` restarts on changes  |
| `npm run lint`                | ESLint (zero warnings allowed)                                     |
| `npm run typecheck`           | Generates route types, then `tsc --noEmit`                         |
| `npm run format`              | Prettier (also sorts Tailwind classes)                             |
| `npm test`                    | Vitest unit tests (fast, no services needed)                       |
| `npm run test:integration`    | Integration tests against Postgres (needs `docker compose up`)     |
| `npm run test:e2e`            | Playwright end-to-end tests in a phone-sized Chromium (seeded DB)  |
| `npm run lighthouse`          | Lighthouse medians of the key pages (see "Performance")            |
| `npm run check`               | Format check, lint, type-check and unit tests                      |
| `npm run db:migrate`          | Create and apply a migration after editing the schema (dev)        |
| `npm run db:deploy`           | Apply pending migrations (CI, staging, production)                 |
| `npm run db:seed`             | Load or refresh the demo data (never in production)                |
| `npm run db:reset`            | Wipe the dev database, re-apply migrations, seed (asks to confirm) |
| `npm run db:generate`         | Regenerate the Prisma client (`npm install` does it too)           |
| `npm run db:studio`           | Prisma Studio, a browser UI for the data                           |
| `npm run admin:create`        | Create or promote an admin account (see "Admin area")              |
| `npm run themes:placeholders` | Draw missing placeholder theme artwork (see "Themes → Artwork")    |
| `npm run demo:media`          | Draw missing demo photos and music in `public/demo/`               |

## Architecture

```
app/                    Routes (App Router): (public) = landing page (/), theme demos (/demonstracao/<tema>) and
                        /entrar (login); (dashboard)/painel, (admin)/admin, api/health
app/c/[eventSlug]/[guestToken]/  Guest invitation, its WhatsApp preview image and calendar file
app/previsualizar/[eventId]/  The editor's live preview (the invitation with unsaved changes)
app/m/[...key]/         Processed uploads, streamed from the private bucket (/m/…)
worker/                 The background worker's entry point (BullMQ; npm run worker)
app/(internal)/design/  Design preview page (/design; 404 in production)
assets/fonts/           Theme fonts as WOFF files for the generated preview image (OFL)
proxy.ts                Next.js 16 proxy (formerly middleware): request ID + nonce-based Content-Security-Policy
instrumentation.ts      Server startup: environment check, request hooks, Sentry (server/edge), onRequestError
instrumentation-client.ts  Sentry browser SDK
sentry.*.config.ts      Sentry server/edge initialization
scripts/preload.ts      Runs before the production server (see "Request IDs")
scripts/                Also: admin:create, placeholder artwork generator, screenshot helper (see "Themes")
prisma/                 Schema, migrations, demo seed (prisma/seed/)
prisma.config.ts        Prisma 7 configuration (database URL, seed command)
public/themes/<id>/     Theme artwork (placeholders until the licensed artwork replaces them)
public/demo/            Demo event media: placeholder photos and music (npm run demo:media)
src/env.ts              Zod-validated server environment; src/env.public.ts for browser values
src/i18n/               pt-AO/: every user-facing string (Portuguese, Angola; the sections guest-page scripts
                        need are their own modules); date and plural formatting
src/components/         Shared UI: invitation building blocks (ui/), dashboard styles (dashboard/), icons, theme root
src/features/           Feature code by area: landing/ (home page, theme demos), invitation/ (guest pages),
                        auth/, account/ (A minha conta), dashboard/, admin/, design-preview/
src/themes/             Theme definitions (plain data), fonts, colour overrides, contrast maths
src/lib/                Logger, redaction, request context, Sentry privacy, CSP, guest tokens, validation,
                        guests/ (statuses and counts, list filters, the WhatsApp message), audit/ (actions),
                        admin/ (list filters), events/ (slugs)
src/server/             Server-only code: Prisma/Redis clients, auth + sessions + passwords, events (editor,
                        access), guests (list, changes, overview, CSV), invitations, media (processing,
                        dashboard), admin (access, accounts, events, lists), audit (log), queues (BullMQ),
                        storage (S3)
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
| Platform | `AuditLog`                                                     | Append-only (a trigger refuses changes); entries survive the deletion of the admin who made them                                             |

Conventions: snake_case table names; UUIDv7 keys for our tables (Better Auth generates its own
IDs); every timestamp is `timestamptz`, stored in UTC and shown in Africa/Luanda. Deleting an event
deletes everything under it; deleting a user who owns an event is refused. Migration
[20260923222022_integrity_constraints](prisma/migrations/20260923222022_integrity_constraints/migration.sql)
adds CHECK constraints the Prisma schema cannot express: at least 1 seat, guest tokens of 16+
URL-safe characters, at most 2 parents per side, valid slugs and roles. Later migrations add the
same kind of hand-written rules at the end of their SQL (guest imports, the audit log's trigger).

**Changing the schema:** edit `schema.prisma`, run `npm run db:migrate -- --name what-changed`,
review the generated SQL and commit it with the schema. Never edit a migration that has already
been applied anywhere; add a new one. CI fails if the schema changes without a migration.

**Demo data** (`npm run db:seed`): the Braúlio & Nanda wedding in the "Praia Rosa" theme on Friday
15 January 2027 (ceremony at Praia do Bispo at 16h00, copo-d'água at 20h00), the full timeline,
the 8 default guest rules, 6 placeholder gallery photos, a placeholder music loop and 10 guests
covering every RSVP state; plus the same wedding in the Save the Date phase
(`braulio-e-nanda-save-the-date`, 2 guests) and in the "Champanhe" theme, with every section
(`braulio-e-nanda-champanhe`, 2 guests). The seed prints every guest's invitation link.
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

Server, edge, browser and worker SDKs share one privacy configuration
([src/lib/sentry/options.ts](src/lib/sentry/options.ts)); the web server and the worker also share
their init options ([src/lib/sentry/server-options.ts](src/lib/sentry/server-options.ts)). Sentry 11 collects user info, cookies,
headers, bodies, query strings and local variables when `dataCollection` is left unset, so every
category is set explicitly, and events, breadcrumbs and spans pass through the same redaction as the
logs. Browser events are tunnelled through `/monitoring` on our own origin. Source maps are only
generated when `SENTRY_AUTH_TOKEN` is set (CI), uploaded, then deleted, so they are never public.
No Session Replay or feedback widget, to keep the JavaScript light on low-end phones.

The browser SDK is not part of any page's first JavaScript
([src/lib/sentry/browser.ts](src/lib/sentry/browser.ts)): it loads 3 seconds after the page has
loaded, when the browser is idle, or at once when an error happens first, and never without a DSN.
Until it runs, a small listener catches uncaught errors and a short queue keeps what the error
pages and the signed-in user tag send. Browser code reports through `browserSentry`; ESLint refuses
`@sentry/nextjs` imports outside `src/server/`. Checked once with a placeholder DSN and the tunnel
intercepted: errors from before and after the SDK loads both arrive, without guest names or tokens.

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

## Landing page

The public home page, `/` ([app/(public)/page.tsx](<app/(public)/page.tsx>)), presents the
product to couples. Code in [src/features/landing/](src/features/landing/), texts in pt-AO
`landing`.

- **No sign-up:** the team creates couples' accounts (SPEC §7). Every "Criar o nosso convite" and
  "Quero este tema" opens a WhatsApp chat with the team (`wa.me`, new tab) with a pre-filled
  message that names the theme; the number is `CONTACT_WHATSAPP` (required on staging and
  production; elsewhere an unassigned demo number). "Entrar" leads to `/entrar`, which sends
  signed-in users to their dashboard.
- **Sections:** the hero at night (gold script, falling petals, the sealed envelope and the
  invitation card on floating phones), a ribbon of highlights (hover or its checkbox stops it:
  WCAG 2.2.2), the themes (built from `THEMES`: each theme's Save the Date on its paper, its
  colours, fonts and button shape), the guest's experience (WhatsApp message → envelope → confirmed
  answer), what an invitation includes, how it works, questions, and a closing call. No prices,
  testimonials or numbers: nothing is claimed that the product does not do.
- **"Experimentem com os vossos nomes":** the names typed in the hero replace the sample couple in
  every example on the page (`couple-preview.tsx`, the only client code besides next/image and
  links). Nothing is stored or sent.
- **Examples** (`mini-screens.tsx`) are small, static versions of the invitation's screens in the
  real themes, fonts and artwork, sized in `--u` (1% of the phone screen's width) to fit a phone
  frame. They are decorative (`aria-hidden`, with a caption for screen readers).
- **Look:** the page uses the Champanhe theme's fonts (`LANDING_THEME_ID`) and sets the theme
  variables with its own ivory, rose and gold ([landing-root.tsx](src/features/landing/landing-root.tsx));
  night sections redefine them (`.night` in `landing.module.css`). Every animation stops with
  reduced motion.
- **Performance** (Lighthouse mobile median 90, accessibility 100; the guest page measured 92 the
  same day): the first screens use only the page's theme, so it loads three font files (the hero
  shows Champanhe and the theme gallery starts with it). Other themes wait below:
  `content-visibility: auto` on each theme card and on the guest's experience keeps their fonts
  and artwork from loading before the first paint. The hero's phones are not size containers
  (`--u` follows from the viewport, `.heroPhones`) and every phone has `contain: strict`, so a
  font arriving re-runs layout for that phone only. The petals' keyframes use no variables, so
  they run on the compositor. Sections with text before the questions are not deferred: axe
  scrolls to check contrast, deferred sections then change size, and it measured a stale spot.
- **Theme demos:** `/demonstracao/<theme>` renders the whole invitation with the demo wedding built
  in memory ([demo-event.ts](src/features/landing/demo-event.ts); no database), through
  `InvitationView`'s preview mode: the envelope every time, inert RSVP, WhatsApp and calendar
  buttons. Its date is always a Saturday about four months ahead, so the countdown keeps counting.
- **Link preview:** [app/(public)/opengraph-image.tsx](<app/(public)/opengraph-image.tsx>) draws the
  wordmark on the night sky (JPEG, like the invitations'); `app/(public)/layout.tsx` sets its base
  URL from `APP_URL`. It also serves the demos and the login page.

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
  loading (slow phones), and the envelope opens as soon as it is ready. While the envelope is
  closed, the invitation behind it is not rendered at all (see "Performance").
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
  style and fonts (files in [assets/fonts/](assets/fonts/)) and re-encoded as a JPEG of about
  50 KB, because WhatsApp skips large previews. It shows the event only, never the guest.
- **Performance:** everything is server-rendered, with about 160 KB of gzipped JavaScript before
  the first tap; see "Performance" below. Guest links send `Referrer-Policy: no-referrer` and
  `X-Robots-Tag: noindex`.

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
  until the deadline, read-only after it. The form needs JavaScript: its code (React Hook Form and
  the schema) loads when the form comes within about two screens, its dialog opens or the guest
  presses a key ([lazy-rsvp-form.tsx](src/features/invitation/rsvp/lazy-rsvp-form.tsx)), and its
  answer and submit buttons stay disabled until then (a choice made earlier would be undone, and a
  plain browser submission would put the answers in the URL).
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
  edits, guest changes, and turning an event on or off in the admin area). RSVPs are not cached.
- **Rate limits** ([src/server/rate-limit/](src/server/rate-limit/)): a sliding-window log in a
  sorted set, one atomic Lua script per request; subjects (IPs, tokens) are hashed in the keys.
  Without Redis the request is allowed and the failure logged.

  | Limit                           | Value          | Where                                       |
  | ------------------------------- | -------------- | ------------------------------------------- |
  | Guest pages (`/c/…`) per IP     | 300 per 5 min  | `proxy.ts` (link-preview bots exempt) → 429 |
  | RSVP form per guest link        | 10 per 10 min  | `submitRsvp`                                |
  | RSVP form per IP                | 30 per 10 min  | `submitRsvp`                                |
  | WhatsApp taps recorded per link | 20 per 10 min  | WhatsApp route (still forwards to WhatsApp) |
  | Login attempts per IP           | 20 per 15 min  | `signIn`                                    |
  | Login attempts per e-mail       | 8 per 15 min   | `signIn` (password guessing on one account) |
  | Editor saves per user           | 60 per 10 min  | `saveEvent`                                 |
  | Live-preview drafts per user    | 900 per 10 min | `savePreviewDraft` (about one a second)     |
  | Google Maps short links, user   | 30 per 10 min  | `resolveMapsLink`                           |
  | Upload URLs per user            | 60 per 10 min  | `requestUpload`                             |
  | Other media changes per user    | 300 per 10 min | Confirm, delete, reorder, describe, retry   |
  | Guest-list changes per user     | 600 per 10 min | Add, edit, delete, answers, "sent", message |
  | Guest-list CSV exports per user | 30 per 10 min  | `…/convidados/exportar` → 429               |
  | CSV imports per user            | 20 per 10 min  | `startGuestImport`                          |
  | Password changes per user       | 8 per 15 min   | `changePassword` (A minha conta)            |
  | Admin-area changes per admin    | 120 per 10 min | Every admin Server Action                   |

  The per-IP limits are generous because Angolan mobile carriers put many phones behind one IP.
  The client IP is the right-most `X-Forwarded-For` entry (set by Caddy in production).

- **Views** ([src/server/invitations/views.ts](src/server/invitations/views.ts)): one
  `InvitationView` per guest per hour, recorded with `after()` once the page has been sent; link
  preview bots do not count. A Redis key de-duplicates; without Redis, Postgres is asked for a view
  in the last hour.

**Demo media.** The demo events' gallery photos and music are placeholder files in `public/demo/`
(`npm run demo:media`), referenced by `Media` rows with `demo/…` keys that
[src/server/media/urls.ts](src/server/media/urls.ts) maps to `/demo/…`; uploads live in the bucket
(see "Uploads and the worker"). The music is a synthesized loop: use licensed music for anything
real. Re-seeding replaces the demo events' media rows, so files uploaded to them stay behind in the
local bucket.

## Couple dashboard

Couples sign in at `/entrar` and find their events at `/painel`. Each event has three pages under
one menu: **Resumo** (`/painel/eventos/<id>`), **Convidados** (`…/convidados`) and **Editar
convite** (`…/editar`). Admins can open every event here too (their changes to a couple's event are
recorded in the audit log). Accounts are created in the admin area: there is no sign-up. **A minha
conta** (`/painel/conta`) shows the couple's name and e-mail and changes the password (the current
one first; at least 10 characters; the other sessions end, this one stays); admins are sent to
their own page in the admin area, `/admin/conta`, where they can also change their name and e-mail.

The dashboard's header is the landing page's night blue with the gold wordmark (like the login
page and the admin area), around light pages in stone tones and the system font. The event list
shows each invitation as a card in its theme's colours, with how far away the wedding is.

- **Logins** ([src/server/auth/auth.ts](src/server/auth/auth.ts)): Better Auth with e-mail + password,
  database sessions for 30 days (refreshed daily) and the admin plugin's roles (`couple`, `admin`).
  The login form calls our Server Action ([src/features/auth/actions.ts](src/features/auth/actions.ts)),
  which validates the input, applies the login rate limits and logs the outcome with a hash of the
  e-mail address, never the address. Better Auth's own HTTP handler is not mounted (its rate
  limiter only covers HTTP calls, and in memory); `disabledPaths` keeps sign-in and sign-up off if
  it is mounted later. Session cookies are named `convites.session_token`.
- **Access**: `proxy.ts` sends visitors without a session cookie from `/painel`, `/previsualizar`
  and `/admin` to `/entrar?voltar=…` (only paths inside those areas are accepted as `voltar`;
  without one, couples land on `/painel` and admins on `/admin`). That
  is only an optimistic check: every page, Server Action and Route Handler asks
  [src/server/auth/session.ts](src/server/auth/session.ts) and
  [src/server/events/access.ts](src/server/events/access.ts). A couple reaches only its own events;
  someone else's event and a missing one both answer "not found". Log lines and Sentry events of
  signed-in requests carry the user ID and role (never the e-mail or name).
- **Editor** (`/painel/eventos/<id>/editar`): every field of the invitation in tabs: phase, theme, colours
  (with WCAG warnings), sections (visibility and order), the couple and their parents, the card's
  texts, date and venues, timeline, message, dress code, guest rules, gifts and RSVP settings.
  One Zod schema ([src/lib/validation/event-editor.ts](src/lib/validation/event-editor.ts)) checks
  the form in the browser and again in `saveEvent`. Couples type Luanda dates and times (stored as
  UTC; times before 06:00 belong to the night after the wedding day) and Portuguese placeholders
  (`{pessoas}`, `{local}`, `{hora}`, stored as `{seats}`, `{venue}`, `{time}`). Saving replaces
  the event and its lists in one transaction and refreshes the guests' cached copy.
- **Live preview**: the real invitation page in an iframe (`/previsualizar/<id>`, a phone frame
  beside the form, full screen on phones), for a sample guest, with RSVP, WhatsApp and calendar
  buttons inert. About 0.7 s after typing stops, the form's values go to Redis as a draft (2 hours,
  per user and event) and the preview renders them. **Guests see nothing until "Guardar
  alterações"**; drafts never reach the database. Without Redis, the preview shows the saved version
  and says so.
- **Google Maps links**: coordinates (for the Waze button) are read from the pasted link in the
  browser. Short share links (`maps.app.goo.gl`) are followed on the server
  ([src/server/maps/resolve-short-link.ts](src/server/maps/resolve-short-link.ts)), only over https
  and only to Google hosts, at most 5 redirects.
- **Multimédia** tab: the hero illustration, the logo (replaces the monogram), up to 12 gallery
  photos (order, optional descriptions) and the music, with upload progress and processing status.
  The exception to "Guardar": files are saved as they are uploaded and reach guests once processed
  (see below); the preview refreshes when they do. With unsaved changes, leaving the editor (the
  event menu, "Os meus convites", closing the tab) asks first.

### Guests and WhatsApp

- **Guest list** (`/painel/eventos/<id>/convidados`): add, edit and delete guests (name shown on the
  invitation, phone, seats 1–20, group). One Zod schema
  ([src/lib/validation/guest.ts](src/lib/validation/guest.ts)) checks the form, the Server Actions
  ([src/features/dashboard/guests/actions.ts](src/features/dashboard/guests/actions.ts)) and CSV rows.
  Phones: Angolan mobiles as usual, or numbers abroad typed with their country code (`+351…`,
  `00351…`); stored as E.164. A group typed differently ("amigos") takes the spelling in use.
- **Guest limit**: adding a guest locks the event's row (`SELECT … FOR UPDATE`) while counting, so
  simultaneous adds can never pass `Event.guestLimit` (the plan, set by the admin). Seats can't go
  below the people a guest already confirmed.
- **Statuses** ([src/lib/guests/status.ts](src/lib/guests/status.ts), shared by the list, the
  overview and the export): Confirmado, Não vai, WhatsApp (tapped "Confirmar presença" but nothing
  recorded), and without an answer Abriu / Ainda não abriu. "Enviado" is separate
  (`Guest.invitationSentAt`).
- **Filters** (answer, invitation sent/opened, group, name or phone search) live in the URL
  (`?resposta=confirmados&convite=por-enviar&grupo=Amigos&q=silva`) and run in the browser: the list
  is bounded by the guest limit. The overview's cards link to filtered lists.
- **Sending**: "Enviar" opens the message with the guest's personal link, editable for that guest,
  and "Abrir o WhatsApp" opens `wa.me/<phone>?text=…` (without a phone, WhatsApp asks for the
  contact) and marks the guest as sent. The text for everyone is "Mensagem de envio"
  (`Event.inviteMessage`, placeholders `{convidado}`, `{noivos}`, `{data}`, `{link}`; null = the
  suggested text for the phase; the link is added at the end if the text drops it). Links are built
  from `APP_URL`.
- **Details**: the guest's answer, companions and message; an answer received by WhatsApp or phone
  can be recorded (`Rsvp.source = COUPLE`; a later answer in the invitation replaces it). "Gerar novo
  link" gives the guest a new token (the old link stops working at once, the guest goes back to "por
  enviar"). Every change that touches a guest page clears the guest's cache entry.
- **Resumo**: invited (of the plan), sent, opened, confirmed, declined, WhatsApp, no answer, people
  attending (of the seats given out), for every guest or one group, and the guests' messages.
- **CSV export** (`…/convidados/exportar`, the same filters as the list): `;`-separated UTF-8 with a
  byte order mark and CRLF, so Excel with Portuguese settings opens it with its accents. The first
  columns (nome, telefone, lugares, grupo) are the import's. Cells starting like a formula (`=`, `+`,
  `-`, `@`, tab, CR) get a leading apostrophe; guests write some of these cells. Phones are written
  as text a spreadsheet keeps (`923 456 789`, `00 351912345678`).
- **CSV import** ("Importar lista (CSV)", [src/server/guests/](src/server/guests/)):
  - The file (up to 512 KB and 2,000 rows) goes to the `startGuestImport` Server Action, is decoded
    (UTF-8, or Windows-1252 when it is not valid UTF-8: Excel's plain "CSV" on Windows) and stored
    as text in a PENDING `GuestImport`, then queued on the `guests` queue. When Redis is down the
    action imports it at once (a small file, the same code). The dialog asks for news every 1.5 s.
  - Columns are found by their header, in any order, case or accents (`nome`, `telefone`/
    `telemóvel`, `lugares`/`pessoas`, `grupo`, and English names); only `nome` is required, an
    empty `lugares` counts 1. The delimiter (`;`, `,` or tab) is read from the header line. Our
    export's first columns import as they are.
  - Every row goes through the guest schema. Valid rows are added in one transaction; rows already
    on the list or earlier in the file (same name ignoring case/accents/spaces, and same phone) are
    skipped, so importing a file again is safe. If the new guests do not fit in the guest limit,
    nothing is imported. The report lists the rows not imported (row numbers as a spreadsheet shows
    them), and "Descarregar as linhas com erros" gives them back as CSV with an `erro` column to fix
    and import again. A blank template: `/painel/modelo-convidados.csv`.
  - The file holds names and phones: it is deleted (`content` null, a CHECK constraint) once the
    import finishes, and an event keeps only its last 5 imports (with their reports).

## Admin area

The platform owner's area, `/admin` ([app/(admin)/admin/](<app/(admin)/admin/>)), for the `admin`
role only: couples get the same "not found" as a missing page, signed-out visitors the login page.
Every page calls `requireAdmin()` and every Server Action `authorizeAdminAction()`
([src/server/admin/access.ts](src/server/admin/access.ts)), which also applies the rate limit.

**Look.** The area's frame ([src/features/admin/admin-shell.tsx](src/features/admin/admin-shell.tsx))
takes the landing page's night blue and gold (the `night`, `gold`, `ivory`, `mist` colours in
[app/globals.css](app/globals.css), the wordmark in the landing's script font), so it is never
mistaken for a couple's dashboard: a sidebar on wide screens, a top bar with the sections on phones.
The pages keep the dashboard's stone tones and system font. Lists are compact rows (the whole row
opens the event or account) under status tabs that show how many match the search; event and
account pages put the details on the left and the controls on the right. Deactivating an event,
suspending an account and issuing a new password ask first in a dialog, with the focus on
"Cancelar"; deleting asks the admin to type the event's address or the account's e-mail.

- **Eventos** (`/admin`): the platform at a glance (active events, weddings in the next 30 days,
  guests, couple accounts), then every event, newest first, with how far away its wedding is;
  search (couple, address, account) and status in the URL (`?q=silva&estado=desativados&pagina=2`).
  An event's page (`/admin/eventos/<id>`) shows its account, date, address, theme, guests and
  confirmed people, links to it in the dashboard, and has three controls:
  - **Ativar / Desativar**: an inactive event answers "Convite não encontrado" to its guests at once
    (the cached copy is dropped); the couple still sees and edits it.
  - **Limite de convidados** (the plan, 1–2,000): never below the guests already added, counted
    with the event row locked, exactly like adding a guest.
  - **Eliminar evento**: for good, once the admin types the event's address. The event goes with
    its guests, their answers and views, its places, programme, rules, imports and media, in one
    transaction with its audit entry (the event row is locked first, so nothing is added
    meanwhile); then its files are removed from storage (through the queue), its cached pages and
    its preview drafts. Sent links answer "Convite não encontrado"; the address becomes free again.
- **Novo evento** (`/admin/eventos/novo`): for an existing couple account or a new one, created in
  the same transaction; the names, date and ceremony time (Luanda), theme, guest limit, and the
  address of the guest links, suggested from the names (`Braúlio` + `Nanda` → `braulio-e-nanda`; a
  taken one gets a free suggestion such as `braulio-e-nanda-2`). The address never changes
  afterwards: sent links contain it. The event starts in Save the Date with the default guest rules
  and sections, and with RSVPs by form (no WhatsApp numbers needed yet); the couple does the rest.
- **Contas** (`/admin/contas`): every account with its role, events and status. Admins create
  couple accounts, change a name or e-mail (the login follows the e-mail), issue a new temporary
  password (the old one stops working and every session ends) and suspend or reactivate an account
  (sessions end at once, the login says "conta suspensa"; its events stay as they are). **Eliminar
  conta** deletes an account for good, once the admin types its e-mail: its events first, one by
  one as above (the dialog lists them; the database never lets a user's deletion take events on
  its own), then the account with its login and sessions. Audit entries the account wrote stay,
  without their author. Nobody resets, suspends or deletes their own account, and one active admin
  always remains.
- **Temporary passwords** are generated (12 characters without look-alikes, e.g. `k7mq-9xrt-2hpd`,
  about 59 bits), shown once with "Copiar" and a ready-made message for WhatsApp, and never stored
  in clear or logged. Couples then pick their own in "A minha conta".
- **How accounts are written**: straight to the database, the way Better Auth writes them (a user,
  a `credential` account with the scrypt hash, the admin plugin's `banned` flag with the sessions
  deleted), so each change and its audit entry share one transaction
  ([src/server/admin/](src/server/admin/)). Better Auth is configured with the same password
  functions ([src/server/auth/passwords.ts](src/server/auth/passwords.ts)); the integration tests
  sign in through Better Auth after every change.

### Audit log

**Registo de atividade** (`/admin/registo`, "Atividade" in the menu) lists what admins changed,
newest first and grouped by day (Luanda), by action and by event or account (each event and account
page shows its latest entries too).

- **What is recorded** ([src/lib/audit/actions.ts](src/lib/audit/actions.ts)): every change made in
  the admin area, and every change an admin makes in a couple's dashboard (editor saves, the
  sending message, media, guests, answers, imports, and downloads of guest data). Couples' own
  changes are not recorded, nor an admin's changes to an event they own.
- **What an entry holds**: who, when, the action, the event or account, and metadata checked with
  Zod ([src/lib/validation/audit.ts](src/lib/validation/audit.ts)): the target's name at the time,
  before/after values, plain facts (IDs, counts). Never guest names, phones, passwords or tokens.
- **Always together**: admin-area services write the change and its entry in one transaction
  (`auditedTransaction`, [src/server/audit/audit-log.ts](src/server/audit/audit-log.ts)).
  Dashboard services own their transactions, so their entries are written right after the change
  (`auditDashboardChange`); a failure to record is logged and reported to Sentry.
- **Append-only**: a trigger (migration `20260925100339_audit_log_append_only`) refuses every UPDATE
  and DELETE, except the `actorId → NULL` that deleting a user makes. Each committed entry is also
  logged as "Admin action" (IDs only).

### The first admin

The seed only makes demo logins. On a real server, create the first admin (or promote an existing
account) from the command line:

```bash
npm run admin:create -- --email=ana@exemplo.ao --name="Ana Silva"
npm run admin:create -- --email=ana@exemplo.ao --new-password   # a new password for an account
```

It prints a temporary password once (sign in, then change it in "A minha conta"), reactivates a
suspended account, and records the change in the audit log as "Linha de comandos". It reads
`DATABASE_URL` from the environment or the `.env` files.

## Uploads and the worker

- **Storage** ([src/server/storage/s3.ts](src/server/storage/s3.ts)): any S3-compatible service
  through the AWS SDK: MinIO locally, Cloudflare R2 or AWS S3 in production. The bucket stays
  private. Uploads land under `originals/<event>/<media>.<ext>` and are never served (they may carry
  the phone's GPS position); the worker writes what pages show under `media/<event>/<media>/`. Each
  upload gets a new media ID, so a key's content never changes.
- **Upload** ([src/features/dashboard/media/](src/features/dashboard/media/)): the browser asks
  `requestUpload` for a URL (session, owner, rate limit, type, size, the 12-photo limit), `PUT`s the
  file straight to storage with a 5-minute presigned URL whose signature covers the content type
  and the exact size, then calls `confirmUpload`, which checks the file is there and queues it. A
  new hero, logo or song replaces the current one only once it is ready.
- **Limits:** JPEG, PNG or WebP up to 15 MB (logo 5 MB), MP3 up to 5 MB, 12 gallery photos;
  checked in the browser, when the URL is issued, by the signature, and again by the worker.
- **Worker** ([worker/index.ts](worker/index.ts), `npm run worker`): BullMQ 6 on Redis, two queues
  with a BullMQ worker each, so an import never waits behind image processing: `media`
  ([src/server/queues/media-queue.ts](src/server/queues/media-queue.ts)), 2 jobs at a time, 5
  attempts with exponential backoff (10 s, 20 s, 40 s…), and `guests`
  ([src/server/queues/guest-queue.ts](src/server/queues/guest-queue.ts), CSV imports), 2 at a time,
  3 attempts (5 s, 10 s). A request ID per job in the logs (`service: worker`), Sentry with the
  web app's privacy settings. Stops gracefully on SIGTERM. The web app only adds jobs, through
  [src/server/queues/producer.ts](src/server/queues/producer.ts) (fail fast when Redis is down).
  - `import-guests` ([src/server/guests/import.ts](src/server/guests/import.ts)): see "CSV import";
    idempotent (the import is claimed inside the transaction that adds its guests). After the last
    attempt it is marked failed; `sweep-imports` (every 5 minutes) queues imports still waiting
    after 2 minutes again and gives up those older than a day.
  - `process-media` ([src/server/media/processing.ts](src/server/media/processing.ts)): images are
    turned upright (EXIF orientation), stripped of all metadata (GPS, camera, date), converted to
    sRGB and written as WebP (first frame of an animation) at these widths, never enlarged:

    | Type    | Widths         | Notes                                     |
    | ------- | -------------- | ----------------------------------------- |
    | Gallery | 480, 960, 1600 | Carousel on phones, full-screen lightbox  |
    | Hero    | 540, 1080      | Full width of the card; transparency kept |
    | Logo    | 240, 480       | Transparency kept                         |

    Images over about 70 megapixels are refused before decoding, and very tall ones are capped at
    3200 pixels high. Music must be real MP3 audio (several consecutive Layer III frames); its ID3
    tags (cover art, comments) are dropped. The media then turns READY, replaces the previous hero,
    logo or song, and the guests' cached page is cleared.

  - `delete-files`: removes the files of deleted or replaced media (the original and the media's
    `media/…/` folder).
  - `sweep-media`, every 5 minutes: queues uploads whose job never ran (Redis was down when the
    upload completed) and removes uploads whose file never arrived, after an hour.

  A file we cannot use (not an image, not an MP3, too many pixels) fails at once with a reason the
  dashboard explains; it is logged as a warning, not sent to Sentry. Other errors are retried; after
  the last attempt the media shows "Não foi possível preparar o ficheiro" with a retry button, and
  the error goes to the logs and Sentry.

- **Delivery** ([app/m/[...key]/route.ts](app/m/[...key]/route.ts)): `/m/<event>/<media>/w960.webp`
  streams `media/…` from the bucket (never `originals/…`), cached for a year (`immutable`), with byte
  ranges so music plays and seeks on iPhones. Pages get the widest file and the list of widths;
  [MediaImage](src/features/invitation/media-image.tsx) builds the `srcset` from them, so the server
  never re-encodes an upload. Theme art and demo photos still go through the Next.js optimizer.
- **Security:** presigned URLs are the only way in, short-lived and for one file. The CSP's
  `connect-src` allows the storage origin ([src/lib/media/upload-origin.ts](src/lib/media/upload-origin.ts))
  on every page, since the dashboard is reached by client-side navigation from `/entrar`. `/m/…`
  responses carry `nosniff` and a sandboxing CSP of their own.

**Locally:** `docker compose up -d` creates the `convites-media` bucket. Run `npm run worker:dev`
next to `npm run dev`; without a worker, uploads stay "A preparar…" (and are processed once it
starts). `docker compose --profile app up` runs both in containers; there the app reaches MinIO at
`minio:9000` and browsers at `localhost:9000` (`S3_PUBLIC_ENDPOINT`).

**Production storage (R2 or S3):** a private bucket without dots in its name, an access key
limited to it, and the `S3_*` variables (R2: `S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com`,
`S3_REGION=auto`). Browsers upload straight to the bucket, so it needs a CORS rule (MinIO allows
every origin by default):

```json
[
  {
    "AllowedOrigins": ["https://<the app's domain>"],
    "AllowedMethods": ["PUT"],
    "AllowedHeaders": ["content-type"],
    "MaxAgeSeconds": 3600
  }
]
```

The worker runs the TypeScript source with `tsx` for now; Phase 10b builds its production image.

## Themes

An invitation's look is its **theme** (`Event.themeId`) plus the couple's colour **overrides**
(`Event.themeOverrides`). Four themes exist (the couple picks one in the editor's first tab):

| Theme                                  | Look                                                                                                                                                      | Demo link                                              |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| **Praia Rosa** (`praia-rosa`, default) | Pale-blue watercolour paper, pink script, olive-gold accents, pink rose corners, a beach wedding on the hero pages, pill buttons                          | `/c/braulio-e-nanda/demo-familia-silva-001`            |
| **Champanhe** (`champanhe`)            | Warm ivory paper, antique-gold script and accents, dark serif text, cream roses with pampas grass, a floral moon-gate arch, round gold buttons            | `/c/braulio-e-nanda-champanhe/demo-champanhe-silva-01` |
| **Jardim** (`jardim`)                  | Pale sage paper, forest-green script, olive-green accents, white roses with baby's breath, eucalyptus and olive sprigs, a garden pergola, pill buttons    | `/demonstracao/jardim`                                 |
| **Imbondeiro** (`imbondeiro`)          | Warm sand paper, terracotta script, rust accents, dark brown text, king proteas with dried palm fans and savanna grass, a baobab at sunset, round buttons | `/demonstracao/imbondeiro`                             |

Jardim and Imbondeiro have no seeded event: their demos (`/demonstracao/<id>`, no database) show
every section.

- **A theme is plain data** (e.g. [src/themes/praia-rosa.ts](src/themes/praia-rosa.ts),
  [src/themes/champanhe.ts](src/themes/champanhe.ts)): colours, the envelope and wax seal colours,
  font variables, artwork files with their sizes, decorations per section, the hero illustration
  and the button shape. It imports no React or `next/font` code, so server code and tests can use
  it.
- **`ThemeRoot`** ([src/components/theme/theme-root.tsx](src/components/theme/theme-root.tsx))
  applies a theme: it sets the `--theme-*` CSS variables, attaches the fonts and the paper texture,
  and makes the invitation a size container.
- **Tailwind tokens** in [app/globals.css](app/globals.css) read those variables. Components use
  `text-script`, `bg-accent`, `text-ink`, `text-muted`, `font-script`, `font-caps`, `font-body`…
  and never hard-code theme colours, so overrides need no component changes. Plain CSS (CSS
  modules, `@utility`) must read `var(--theme-accent)` and friends directly: `--color-*` and
  `--font-*` are resolved on `:root`, above the theme, and would always give the fallbacks.
- **Container units:** invitation text is sized in `cqi` (a share of the invitation's own width),
  not `vw`, so it scales the same on a phone and on `/design`. The envelope is the exception: it
  is fixed to the viewport, so its text uses `--panel-cqi`, the same share computed from the
  viewport, without a size container (see "Performance").
- **Button shape** (`buttonShape`): the main actions ("Confirmar presença" on the Save the Date,
  "Google Maps", "Adicionar ao calendário") are pills in Praia Rosa and circles in Champanhe. The
  WhatsApp RSVP buttons are always round; buttons inside a form or box ("Enviar resposta",
  "Copiar IBAN") are always pills.
- **Overrides** ([src/themes/overrides.ts](src/themes/overrides.ts)): `#RRGGBB` values for
  background, ink, script and accent only; anything else discards the overrides as a whole.
- **Contrast:** unit tests check every theme against WCAG AA: body text 4.5:1, script (large text
  only) 3:1, button labels 4.5:1, buttons, icons and lines 3:1. That is why the Praia Rosa pink and
  olive are a touch deeper than in the reference, and why Champanhe uses antique gold: pale
  champagne gold fails on ivory.

### Fonts

Self-hosted with `next/font` (the guest's phone never contacts Google; only the weights in use are
downloaded), declared in [src/themes/fonts.ts](src/themes/fonts.ts). Each theme has its own script
font and a small-caps font (Jardim shares Praia Rosa's). They were chosen side by side on `/design`
(Praia Rosa's against the reference):

| Theme      | Script titles and the couple's names                              | Small caps ("Com a benção de Deus"…)                      |
| ---------- | ----------------------------------------------------------------- | --------------------------------------------------------- |
| Praia Rosa | Ephesis: thin, relaxed brush-pen script, closest to the reference | Cormorant SC: true small caps, elegant at small sizes     |
| Champanhe  | Great Vibes: formal calligraphy, like gold-foil stationery        | Cinzel: engraved Roman capitals, lower case as small caps |
| Jardim     | Allura: light, flowing script                                     | Cormorant SC                                              |
| Imbondeiro | Carattere: warm calligraphy with strong strokes                   | Alegreya SC: sturdy calligraphic small caps               |

Every theme sets body text (message, rules, timeline) in EB Garamond, a sturdy serif readable on
small screens, and button labels in the system sans (clean labels like the reference, nothing to
download).

- **Preloading:** none. Next.js preloads every font a route imports, whatever the page's theme,
  so preloaded theme fonts would reach every guest; and the envelope, the first screen, uses only
  the theme's script and caps fonts, which load as soon as it needs them (a preloaded body font
  competed with its florals). `display: swap` shows a fallback sized like the font until then. A
  new theme's fonts need `preload: false` too, and the envelope's text must stay in those two.
- **Size adjustment:** the invitation's caps sizes were set for Cormorant SC. Cinzel runs about 20%
  larger, so Champanhe sets `fonts.capsSizeAdjust` (CSS `font-size-adjust`, which the `font-caps`
  class applies to the web font and its fallback alike) and its lines break like Praia Rosa's.
  Always set the caps font with the `font-caps` class, never with `font-family` in plain CSS.
  Alegreya SC's lines are as long as Cormorant SC's (measured: +2%), so Imbondeiro needs none.
  Script sizes were set for Ephesis, and `fonts.scriptSizeAdjust` (applied by `font-script`) does
  the same for the script font: Jardim draws Allura (+6% wider) at 95%, so the couple's names on
  the closing page stay on one line. Great Vibes (+4%) and Carattere (−3%) need none. Keep the
  adjustment small: Parisienne (+22%) and Alex Brush (+11%) were rejected rather than shrunk.
- **Figures:** numbers use lining figures everywhere; the serif fonts default to old-style ones.
- **Preview image:** `next/og` cannot use `next/font`: the WhatsApp preview reads each theme's font
  files from [assets/fonts/](assets/fonts/) (`OG_FONTS` in
  [og-image.tsx](src/features/invitation/og/og-image.tsx)).

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

The files in `public/themes/<theme>/` are **placeholders**, in the positions and style of the
reference (Praia Rosa), of the brief (Champanhe) or of their own concept (Jardim, Imbondeiro), drawn
by `npm run themes:placeholders` ([scripts/theme-placeholders/](scripts/theme-placeholders/)).
Licensed artwork replaces them file for file. Every theme uses the same slots:

| File                     | Pixels    | Where                                                   | Requirements                                                             |
| ------------------------ | --------- | ------------------------------------------------------- | ------------------------------------------------------------------------ |
| `background.webp`        | 1080×1920 | Paper texture behind every section                      | Opaque. Repeats vertically at full width: top and bottom edges must join |
| `floral-corner.webp`     | 640×640   | Section corners                                         | Transparent. Drawn for the **top-left** corner; other corners mirror it  |
| `floral-corner-alt.webp` | 640×640   | A second corner arrangement                             | Same as above                                                            |
| `floral-garland.webp`    | 1080×440  | Top edge of some sections (mirrored at the bottom)      | Transparent. Drawn for the top edge, flowers along the top-left          |
| `hero-<scene>.webp`      | 1080×900  | Bottom of the invitation card and Save the Date (below) | Transparent at the top, so the paper shows through above the scene       |

The hero scenes: `hero-beach.webp` (Praia Rosa, a beach wedding), `hero-arch.webp` (Champanhe, a
floral moon-gate arch), `hero-pergola.webp` (Jardim, a garden pergola) and `hero-baobab.webp`
(Imbondeiro, a baobab against a low sun).

Which decorations each section shows, where and how big, is set in the theme's file
(`src/themes/<id>.ts`).

To replace a file, export the artwork as WebP (about quality 80, with alpha where transparent)
under the same name. If its size or aspect ratio changes, update `width` and `height` in the theme's
file (a unit test compares them with the files). Keep soft, half-transparent edges to what the art
needs: the image optimizer keeps the alpha channel lossless, so feathery transparency costs guests
far more bytes than detail in the colours. At a phone's 828 px, the Champanhe hero placeholder
(pampas plumes) is about 75 KB; Praia Rosa's is about 20 KB. Jardim's pergola weighs about as much
as Champanhe's arch and Imbondeiro's baobab about two thirds of it; Jardim's corners (many small
leaves, baby's breath) are about 20% heavier than Champanhe's. Fine detail everywhere costs bytes
too: each baby's breath spray is a pale cloud with the flowers inside it, not loose dots.

`npm run themes:placeholders` only draws missing files; `-- --theme=<id>` limits it to one theme,
and `-- --theme=<id> --force` redraws that theme's files. Never force a theme whose real artwork is
in (`--force` without `--theme` is refused).

### Adding a theme

1. Create `src/themes/<id>.ts` with a `ThemeDefinition` and add it to `THEMES` in
   [src/themes/index.ts](src/themes/index.ts).
2. Declare its script and caps fonts in [src/themes/fonts.ts](src/themes/fonts.ts) with
   `preload: false`, and add their Latin and Latin Extended `.woff` files from Fontsource, with the
   licence, to [assets/fonts/](assets/fonts/) and to `OG_FONTS` in
   [og-image.tsx](src/features/invitation/og/og-image.tsx). TypeScript requires an entry for every
   theme in both places. If the caps font runs larger than Cormorant SC, set
   `fonts.capsSizeAdjust`.
3. Put its artwork in `public/themes/<id>/`: licensed files, or placeholders drawn by a module in
   [scripts/theme-placeholders/](scripts/theme-placeholders/), registered in
   `scripts/generate-theme-placeholders.ts`.
4. Write its landing page text (a tagline and a description) in pt-AO `landing.themes.items`, and
   its dress code colours for the demo in
   [src/features/landing/demo-event.ts](src/features/landing/demo-event.ts) (TypeScript asks for
   both). The theme then appears on the landing page with its demo at `/demonstracao/<id>`.
5. Run `npm test` (contrast, artwork files, fonts and the preview image are checked for every
   theme), then review `/design?theme=<id>`, `/demonstracao/<id>` and the landing page.

### Previewing

`/design` (not available in production) has a theme switcher (`/design?theme=<id>`) and shows the
font candidates on the theme's paper, the palette with contrast ratios, every shared component on a
phone-width invitation, the narrow timeline, the date formats and all icons. Its components use
fixed sample sizes: judge line breaks on a guest page. For visual checks from the command line:

```bash
node scripts/screenshot.mjs http://localhost:3000/design shots "--selector=[data-theme] > section"
```

It saves one PNG per matching element, at phone size by default (`--width`, `--height`, `--scale`
and `--full` change that). `--click` (repeatable) and `--wait` interact first, e.g. to open an
invitation's envelope:

```bash
node scripts/screenshot.mjs http://localhost:3000/c/braulio-e-nanda/demo-familia-silva-001 shots \
  "--selector=main > section" "--click=[data-opening-envelope]" --wait=3000
```

## Performance

Guests open their invitation on low-end Android phones over mobile data, so the guest pages have a
budget. Lighthouse 13.5, mobile profile (simulated slow 4G, 4x slower CPU), production build,
median of 5 runs, measured locally on 2026-09-25:

| Page                   | Performance | Accessibility | LCP   | TBT    | Before Phase 11 |
| ---------------------- | ----------- | ------------- | ----- | ------ | --------------- |
| Invitation, Praia Rosa | 92          | 100           | 3.2 s | 71 ms  | 79              |
| Invitation, Champanhe  | 91          | 100           | 3.3 s | 74 ms  | 81              |
| Save the Date          | 93          | 100           | 3.0 s | 81 ms  | 87              |
| Login                  | 93          | 100           | 2.9 s | 152 ms | 92              |

The landing page, measured on 2026-09-26 (when the Praia Rosa invitation measured 92 again):
performance 90, accessibility 100, LCP 3.5 s; the theme demos 89–92 (see "Landing page").

With a Sentry DSN set (the browser SDK then loads 3 s after the page), the two invitations scored
91–92. SEO shows 60 on guest links by design: they are `noindex`. These are lab numbers from one
machine; check a real phone on mobile data after the first deploy.

Measure it yourself: `npm run build && npm start`, then `npm run lighthouse` (every key page, 3
runs, medians; `--runs=5`, `--page=/entrar`, `--base=http://localhost:3100`, `--min=90`; reports
in `.lighthouse/`). Single runs vary by 5 points or more: compare medians.

What keeps the first screen fast (about 160 KB of gzipped JavaScript, down from about 290 KB):

- **Nothing behind the envelope renders** until the guest taps it (`content-visibility: hidden` on
  the invitation): no layout, and no fonts or pictures downloaded for it. The first section's
  pictures are lazy behind the envelope and load while it opens. Only the envelope's florals, the
  largest paint, are fetched with high priority; no font is preloaded (the envelope needs only
  the theme's script and caps fonts).
- **Late JavaScript:** the Sentry browser SDK (see "Sentry"), the RSVP form's code (see "RSVP")
  and the gallery carousel, which starts only near the screen (starting it measures the page,
  which forced a layout of everything). Code that reaches guest pages never imports the pt-AO
  dictionary: the bundler would ship all of it ([src/i18n/pt-AO/index.ts](src/i18n/pt-AO/index.ts)).
- **Short tasks:** each section is its own Suspense boundary, so React hydrates the page section
  by section. The envelope's text is sized from the viewport rather than a size container:
  container queries made every web font that arrived re-run layout, four times slower there.
- **Images:** AVIF for theme artwork, phone-first widths (from 360 px), uploads from their own
  WebP ladders.
- **Tried and rejected:** `experimental.inlineCss` (Next.js also copies the CSS into the page
  data: about 45 KB more per page).

[tests/e2e/performance.spec.ts](tests/e2e/performance.spec.ts) guards these facts on the build,
not the scores: at most 180 KB of JavaScript before the first tap, no Sentry SDK, dictionary or
form library in it, the florals at high priority, and nothing behind the envelope rendered or
downloaded until it opens.

## Accessibility

- **Automated:** [tests/e2e/accessibility.spec.ts](tests/e2e/accessibility.spec.ts) runs axe-core
  (WCAG 2.2 A and AA rules) on every main page and state: the envelope and the open invitation with
  its RSVP form, every theme (Champanhe on its seeded invitation, the others on their demos), the
  lightbox, the Save the Date and its RSVP dialog, the not-found page, the landing page (also with
  an answer open), the login; the couple's events, overview, guest list with its add (also with errors),
  import and send dialogs, every editor tab and the account page; the admin lists, forms, audit
  log, an event and an account. Every scan must be clean. Lighthouse scores 100 on the key pages.
- **Keyboard**, tested in the same spec: the envelope is the first stop and opens with Enter,
  focus moving to the invitation's heading; Tab reaches the RSVP form; the lightbox and dialogs
  keep focus inside, close with Escape and give focus back; the dashboard's skip link moves focus
  to the content; the editor's tabs follow the ARIA tabs pattern (arrows, Home, End); form dialogs
  open on their first field (`data-autofocus`). Every focused control shows a focus ring (checked
  by walking the pages with the keyboard).
- **Fixed in Phase 11:** the envelope button's name now contains its visible text (WCAG 2.5.3);
  the dashboard's secondary text is `stone-600` (`stone-500` was below 4.5:1 on the page
  background).
- **Already in place:** `lang="pt-AO"`, reduced motion, theme colours checked for contrast by unit
  tests, labels and error messages tied to their fields, live regions for status messages, and
  the invitation inert behind the envelope.
- **Still to do by hand before launch:** a pass with a real screen reader (TalkBack on Android,
  VoiceOver on iPhone).

## Testing and CI

Vitest runs two projects, Playwright a third suite:

- `npm test`: unit tests next to the code (`*.test.ts`, `*.test.tsx`), including every theme's
  contrast, artwork files and link preview image, the invitation's read model, countdown, calendar
  and link builders, components and sections rendered to HTML with `react-dom/server` (in both
  themes where they differ, and in the dashboard's preview mode), the editor schema (fields,
  Luanda times, IBANs, the live preview's lenient reading), Google Maps links and the short-link
  resolver, safe return paths, upload rules, image sizes and storage keys, the MP3 check, image
  processing (EXIF rotation and GPS removal, transparency, broken and oversized files), the image
  loader, guest phones (Angolan and abroad), the guest schema, statuses and overview counts, list
  filters, the WhatsApp message, the CSV export (formula escaping) and CSV reading (encodings,
  delimiters, header names, row numbers, row checks, duplicates, the template and error files),
  event slugs, the admin forms and list filters, new passwords, temporary passwords and hashing,
  audit actions and metadata, the audit list rendered to HTML, and one test that serves real HTTP
  requests through the request hooks. No services needed.
- `npm run test:e2e`: `tests/e2e/*.spec.ts` in a phone-sized Chromium: opening the envelope, the
  reload, reduced motion, the gallery lightbox, the calendar file, the 404 page, the Champanhe
  invitation and its preview image, the Save the Date dialog, answering and changing the RSVP
  form, the WhatsApp link, the login redirect, a couple editing the invitation with the live
  preview (guests see the change only once saved), a gallery photo going from the browser to
  MinIO, through the worker, to the guest page, and removed again, and a couple adding a guest,
  sending the link by WhatsApp, the guest answering, and the answer in the list and the
  overview, and a CSV import through the worker with a row in error; an admin creating an event
  with a new couple account, deactivating it and finding it in the audit log, then the couple
  signing in with the temporary password and choosing their own; couples never reaching `/admin`;
  the accessibility checks and keyboard paths (see "Accessibility"); and the performance budget of
  a guest's first screen (production build only, skipped on `next dev`). Its global setup re-seeds the demo data and clears the rate-limit counters, so runs are
  repeatable (`E2E_SKIP_RESET=1` skips that for a server that does not use the local database and
  Redis). It starts `next dev` on port 3100 and a worker, with 4 browsers at most (one dev server
  compiling on demand falls behind with more), or tests a running app given in `E2E_BASE_URL`.
  With `E2E_BUILD=1` it starts the production build instead (`npm start`, so run `npm run build`
  first), the way CI runs it; that is also much faster than `next dev`:

  ```bash
  npm run build
  E2E_BUILD=1 npm run test:e2e          # PowerShell: $env:E2E_BUILD=1; npm run test:e2e
  ```

  Tests that open the same event's editor as the same couple run one after the other: opening the
  editor clears that couple's preview draft. Tests of the RSVP form scroll to it first
  (`scrollToRsvp` in [tests/e2e/helpers.ts](tests/e2e/helpers.ts)) and wait for its buttons to be
  enabled: its code loads as the guest nears it.

- `npm run test:integration`: `tests/integration/*.int.test.ts` against a real Postgres and Redis:
  the migrations, the demo seed (twice), guest lookup by token (including that no other guest's
  data leaks), the cache and its invalidation, the rate limiter (exact under concurrency), RSVP
  storage and the Server Action's rules, view de-duplication (with and without Redis), the
  integrity rules and the delete behaviour, and the dashboard: login (redirect, wrong password,
  per-e-mail limit, sign-out), who may edit an event, saving and its cache refresh, a round trip
  through the editor, and per-user preview drafts; the guest list: adding (with the guest limit
  under simultaneous adds), editing with the cache refresh, seats against confirmed people,
  answers recorded by the couple, "sent" marks, new links, deletion, the sending message, the CSV
  export route and the overview's counts; CSV imports: queued and run by the worker's code,
  re-run without effect, the same file again, over the guest limit, Windows-1252, refusals, the
  error and template downloads, the "last 5" rule and the sweep; the admin area: couples refused
  by every action, accounts created, changed, reset and suspended (each checked by signing in
  through Better Auth), events created with or without a new account (all or nothing), the slug
  suggestion, deactivation through the cache, the guest limit, the last-admin rule, admin changes
  in a couple's dashboard recorded without guest data, the append-only log, "A minha conta" and
  `npm run admin:create`; and uploads: presigned URLs (type and size
  enforced), processing, the guest read model, `/m/…` with byte ranges, the limits and access
  rules, replacing the hero, MP3s, deletion of files and the sweep, against MinIO (bucket
  `convites-media-test`, created by the tests; `TEST_S3_ENDPOINT`). It uses the `convites_test`
  database on the Docker Postgres (`TEST_DATABASE_URL`) and Redis database 15 (`TEST_REDIS_URL`,
  never 0), applies
  migrations with `prisma migrate deploy` and empties both before each run; it refuses a database
  whose name does not end in `_test`. If a migration was edited after the test database applied
  it, drop it: `docker compose exec postgres dropdb -U convites convites_test`.

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs on every push and pull request, in two
parallel jobs:

- **Checks and tests** (Postgres and Redis service containers, a MinIO container): Prisma schema
  validation, format check, lint, type-check, unit tests, migrations applied to an empty database,
  a check that fails if the schema changed without a migration, integration tests, and the
  production build.
- **End-to-end tests**: the production build with its own Postgres, Redis and MinIO (bucket
  `convites-media`), migrations applied, then `npm run test:e2e` with `E2E_BUILD=1` (the global
  setup seeds the demo data). A failed test is retried once; on failure the HTML report and the
  traces are uploaded as the `playwright-report` artifact (download and unzip it, then
  `npx playwright show-report playwright-report`). The Chromium headless shell is cached per
  Playwright version.

MinIO is started by a small local action ([.github/actions/start-minio](.github/actions/start-minio/action.yml)),
because a service container cannot take its `server /data` command. Actions are pinned to commit
SHAs. The deploy workflow comes with Phase 10b.

[Dependabot](.github/dependabot.yml) opens grouped pull requests every Monday for npm packages and
GitHub Actions. Packages that must move together (Next.js, React, Prisma, Sentry, AWS SDK,
Tailwind, Vitest) share one pull request, the other minor and patch updates another one; majors
come one by one. New releases wait 5 days first (supply-chain safety). The version pins above are
ignore rules there: change both together. Security alerts and security updates are switched on in
the repository settings (Code security), not in this file.

## Deployment

Not built yet. Phase 10b adds the production Docker images and Compose file with Caddy (automatic
HTTPS), daily PostgreSQL backups, and the deploy workflow (staging from `develop`, production from
`main` after approval, automatic rollback when `/api/health` fails), with every GitHub secret it
needs documented here. It waits until there is a server and a domain, and must be done before the
first real couple uses the platform. Until then, `npm run build && npm start` runs the production
build the way the image will (see "Running the production build locally").
