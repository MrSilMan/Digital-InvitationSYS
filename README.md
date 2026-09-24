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
| 4     | Invitation pages ("Praia Rosa")                                                   | Planned |
| 5     | RSVP, Redis cache, rate limiting, view tracking                                   | Planned |
| 6     | "Champanhe" theme                                                                 | Planned |
| 7     | Auth, couple dashboard, uploads, BullMQ worker                                    | Planned |
| 8     | Guest management, CSV, WhatsApp                                                   | Planned |
| 9     | Admin area and audit log                                                          | Planned |
| 10    | Production Docker/Caddy, backups, full CI/CD with staging and rollback            | Planned |
| 11    | Performance, accessibility, final docs                                            | Planned |

## Stack

Next.js 16.3 (App Router, Turbopack, React 19.3) · TypeScript 6.0 (strict) · Tailwind CSS 4.3 ·
Zod 4 · Winston 3 · Sentry 11 · PostgreSQL 18 with Prisma 7.10 · Better Auth 1.7 (tables and
password hashing so far) · Redis 8 (ioredis 6) · Tabler Icons 3 · Vitest 5 · Node.js 24 LTS.
Tooling: sharp (placeholder artwork), Playwright (screenshots; end-to-end tests later).
Coming in later phases: BullMQ, Motion.

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

Check the stack with `curl http://localhost:3000/api/health`.

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
| `npm run check`               | Format check, lint, type-check and unit tests                      |
| `npm run db:migrate`          | Create and apply a migration after editing the schema (dev)        |
| `npm run db:deploy`           | Apply pending migrations (CI, staging, production)                 |
| `npm run db:seed`             | Load or refresh the demo data (never in production)                |
| `npm run db:reset`            | Wipe the dev database, re-apply migrations, seed (asks to confirm) |
| `npm run db:generate`         | Regenerate the Prisma client (`npm install` does it too)           |
| `npm run db:studio`           | Prisma Studio, a browser UI for the data                           |
| `npm run themes:placeholders` | Draw missing placeholder theme artwork (see "Themes")              |

## Architecture

```
app/                    Routes (App Router): (public), api/health; dashboard, admin and c/[eventSlug]/[guestToken] in later phases
app/(internal)/design/  Design preview page (/design; 404 in production)
proxy.ts                Next.js 16 proxy (formerly middleware): request ID + nonce-based Content-Security-Policy
instrumentation.ts      Server startup: environment check, request hooks, Sentry (server/edge), onRequestError
instrumentation-client.ts  Sentry browser SDK
sentry.*.config.ts      Sentry server/edge initialization
scripts/preload.ts      Runs before the production server (see "Request IDs")
scripts/                Also: placeholder artwork generator, screenshot helper (see "Themes")
prisma/                 Schema, migrations, demo seed (prisma/seed/)
prisma.config.ts        Prisma 7 configuration (database URL, seed command)
public/themes/<id>/     Theme artwork (placeholders until the licensed artwork replaces them)
src/env.ts              Zod-validated server environment; src/env.public.ts for browser values
src/i18n/               pt-AO.ts: every user-facing string (Portuguese, Angola); date and plural formatting
src/components/         Shared UI: invitation building blocks (ui/), icons, the theme root
src/features/           Feature code by area (design-preview/ so far)
src/themes/             Theme definitions (plain data), fonts, colour overrides, contrast maths
src/lib/                Logger, redaction, request context, Sentry privacy, CSP, guest tokens, validation
src/server/             Server-only code: Prisma client, Redis client, health checks
src/generated/prisma    Generated Prisma client (not committed)
tests/unit/             Tests for root-level files (the rest live next to the code as *.test.ts)
tests/integration/      Tests against a real Postgres (*.int.test.ts)
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
the 8 default guest rules and 10 guests covering every RSVP state. The seed prints every guest's
invitation link. Logins (usable from Phase 7):

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

## Themes

An invitation's look is its **theme** (`Event.themeId`) plus the couple's colour **overrides**
(`Event.themeOverrides`). "Praia Rosa" is available now; "Champanhe" arrives in Phase 6.

- **A theme is plain data** ([src/themes/praia-rosa.ts](src/themes/praia-rosa.ts)): colours, font
  variables, artwork files with their sizes, decorations per section, the hero illustration and the
  button shape. It imports no React or `next/font` code, so server code and tests can use it.
- **`ThemeRoot`** ([src/components/theme/theme-root.tsx](src/components/theme/theme-root.tsx))
  applies a theme: it sets the `--theme-*` CSS variables, attaches the fonts and the paper texture,
  and makes the invitation a size container.
- **Tailwind tokens** in [app/globals.css](app/globals.css) read those variables. Components use
  `text-script`, `bg-accent`, `text-ink`, `text-muted`, `font-script`, `font-caps`, `font-body`…
  and never hard-code theme colours, so overrides need no component changes.
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

Icons ([src/components/icons/](src/components/icons/)) are Tabler icons plus four custom line icons
(wedding dress, bride and groom, bouquet, dancing couple), rendered as plain SVG on the server.
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
and `--full` change that).

## Testing and CI

Vitest runs two projects:

- `npm test`: unit tests next to the code (`*.test.ts`, `*.test.tsx`), including theme contrast
  checks, shared components rendered to HTML with `react-dom/server`, and one test that serves real
  HTTP requests through the request hooks. No services needed.
- `npm run test:integration`: `tests/integration/*.int.test.ts` against a real Postgres: the
  migrations, the demo seed (twice), guest lookup by token, the integrity rules and the delete
  behaviour. It uses the `convites_test` database on the Docker Postgres (`TEST_DATABASE_URL` to
  change it), applies migrations with `prisma migrate deploy` and empties it before each run; it
  refuses any database whose name does not end in `_test`. If a migration was edited after the test
  database applied it, drop it: `docker compose exec postgres dropdb -U convites convites_test`.

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs on every push and pull request, with a
Postgres service container: Prisma schema validation, format check, lint, type-check, unit tests,
migrations applied to an empty database, a check that fails if the schema changed without a
migration, integration tests, and the production build. Redis, Playwright E2E and the deploy
workflow arrive in Phase 10.
