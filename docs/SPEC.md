<!-- Original project brief, received 2026-09-23 and kept verbatim. Decisions taken since then
     (version pins, deviations required by current tooling) are recorded in CLAUDE.md and README.md. -->

# Project: Digital Wedding Invitation Platform (Angola market)

You are building a production-ready web platform for creating and sending interactive digital wedding invitations, sold as a service to couples in Angola. Each couple gets an event, adds their guests, and sends each guest a personalized link (mainly via WhatsApp). Guests open an elegant, mobile-first invitation showing their own name, and can confirm attendance (RSVP).

Work in phases (listed at the end). Before each phase, show me a short plan and wait for my approval. After each phase, make sure lint, type-check, tests, and the build all pass, then summarize what was done.

---

## 1. Tech stack

Use the **latest stable version** of every package. Before installing, check the current versions with npm and read the current official docs for anything whose setup has changed recently (especially Next.js, Prisma, Sentry, and Better Auth). Do not rely on outdated patterns from memory.

**Core**
- **Next.js** (latest, **App Router only**) with **TypeScript** (strict mode) and **React Server Components** by default. Use Client Components only where interactivity requires it.
- **Server Actions** for mutations from the dashboard and RSVP form; **Route Handlers** (`app/api/...`) for file downloads, webhooks, health checks, and anything called outside React.
- **Tailwind CSS** with theme values exposed as CSS variables.
- **Motion** (formerly Framer Motion) for animations.
- **Zod** for all validation: forms, Server Action inputs, Route Handler inputs, environment variables, and CSV rows. Share schemas between client and server.
- **React Hook Form** with the Zod resolver for forms.

**Data**
- **PostgreSQL** as the database.
- **Prisma** as the ORM, with migrations and a seed script. Follow the latest Prisma configuration conventions.
- **Redis** for: caching invitation data, rate limiting, deduplicating view tracking, and a background job queue with **BullMQ** (image processing, CSV imports).

**Auth and storage (additions the stack needs)**
- **Better Auth** with the Prisma adapter, email + password login, and roles (`couple`, `admin`).
- **S3-compatible object storage** via the AWS SDK: **MinIO** in local Docker, **Cloudflare R2 or AWS S3** in production (configurable by env vars). Uploads go directly from the browser to storage using presigned URLs.
- **sharp** for server-side image processing (resize, convert to WebP, generate multiple sizes).

**Observability**
- **Sentry** (`@sentry/nextjs`) for errors and performance monitoring on client, server, and edge runtimes, with source maps uploaded in CI and releases tagged by git commit.
- **Winston** for structured logging (details in section 9).

**Infrastructure**
- **Docker**: multi-stage Dockerfile using Next.js `standalone` output, plus Docker Compose for local development and production.
- **GitHub Actions** for CI/CD.
- Deployment target: a Linux VPS running Docker Compose behind a reverse proxy with automatic HTTPS (use **Caddy**).

**Testing**
- **Vitest** for unit and integration tests.
- **Playwright** for end-to-end tests of the critical flows.

**UI libraries** (keep dependencies minimal)
- **Embla Carousel** (or Swiper) for the photo gallery, plus a lightweight lightbox.
- **@tabler/icons-react** for line icons; custom inline SVG icons in the same stroke style only when Tabler lacks one (wedding dress, bride and groom, bouquet).
- **Papa Parse** for CSV import/export.

---

## 2. Design reference (read this before planning)

Reference screenshots are in `docs/reference/`. Study every image. The invitation must follow their structure, layout, typography style, and overall feel closely. Do NOT copy their artwork files (florals, illustrations); use placeholder assets in the same positions and style, which I will replace with licensed artwork. Ignore the "X de 14" counter and viewer buttons in the screenshots; they belong to the phone's image viewer. Feel free to come up with a design of your own as well.

Key characteristics:

- The invitation is a sequence of **full-screen "pages"**, one section per screen. Implement as vertical sections of at least `100svh`, with gentle CSS scroll-snap that never traps content taller than the screen.
- **Background:** soft watercolor paper texture (pale sky blue in the main theme).
- **Section titles** are a two-part lockup: a large **pink handwritten script** word ("Mensagem", "Galeria de fotos", "Cronograma", "Manual do") above a smaller **serif small-caps** subtitle ("DOS NOIVOS", "DO DIA", "BOM CONVIDADO"), with the script slightly overlapping.
- **Body text:** elegant serif, dark navy/near-black; many labels in small caps.
- **Accent color:** muted olive gold for buttons, icons, borders, dots.
- **Icons:** thin line-art in the accent color, one consistent style.
- **Decorations:** watercolor floral clusters (pink roses and greenery) tucked into corners, varying per page.
- **Buttons:** fully rounded pill buttons in olive gold, white text, white icon on the left ("GOOGLE MAPS" with a pin, "CONFIRMAR PRESENÇA" with a check circle).
- **Monogram:** the couple's initials as an elegant interlocking serif monogram in olive gold.

**Fonts** (via `next/font/google`, only the weights used):
- Script titles and couple names: "Allura", "Parisienne" or "Great Vibes" (show me options, pick the closest)
- Small caps and monogram: "Cormorant SC" or "Cinzel"
- Body: "Cormorant Garamond" or "EB Garamond"

---

## 3. Language and locale

- All UI text in **Portuguese (Angola)**, stored in a single dictionary (`src/i18n/pt-AO.ts`) so English can be added later.
- Dates formatted like the reference: "16 • JANEIRO • 2026" and "SEXTA-FEIRA, ÀS 16H30"; times as "16h00". Timezone **Africa/Luanda** everywhere (store UTC in the database, display in Luanda time).
- Phone numbers in Angolan format (+244), validated with Zod.

---

## 4. Themes

A theme system where each theme defines colors, fonts, background texture, and **decoration slots** (floral images for each corner, configurable per section), plus the hero illustration area. Assets in `public/themes/<theme-id>/` as optimized WebP.

Two themes from the reference:
1. **"Praia Rosa"**: pale blue watercolor background, pink script titles, olive-gold accents, pink rose corner florals, watercolor beach wedding illustration at the bottom of hero pages.
2. **"Champanhe"**: warm ivory background, warm gold accents, cream roses and pampas grass, dark serif text, circular gold buttons.

Use tasteful placeholders sized and positioned where the real artwork goes, and document the required asset list with dimensions in the README. Couples can also upload their own hero illustration.

---

## 5. Guest-facing invitation

Route: `app/c/[eventSlug]/[guestToken]/page.tsx`

- Each guest has a unique, unguessable token (at least 16 URL-safe random characters, generated with a cryptographically secure function).
- The page is a **Server Component** that loads the event and guest (through the Redis cache, see section 8) and renders all static content on the server. Interactive parts (music, countdown, carousel, RSVP form, opening animation) are small Client Components.
- Use `generateMetadata` to produce Open Graph tags for **WhatsApp link previews**: title like "Convite de Casamento – Braúlio & Nanda", the date, and a preview image. Generate the preview image with `next/og` (ImageResponse) in the theme's style.
- Invalid token or inactive event: a friendly "Convite não encontrado" page (`not-found.tsx`).

### Opening screen
A closed card/envelope with a wax seal showing the monogram and "Toque para abrir". Tapping opens it with an animation and starts the background music (audio needs a user tap). A floating mute/unmute button stays visible afterwards.

### Two phases
Each event has a `phase`: `SAVE_THE_DATE` or `INVITATION`, controlled by the couple.

**Save the Date page** (match the reference): monogram; "SAVE THE DATE" in large serif caps; "Nosso casamento"; couple names in pink script with a small wedding rings icon between them; date as "15 • JANEIRO • 2026" with accent dots; pill button "CONFIRMAR PRESENÇA" with a check icon; small text "Convite oficial em breve"; hero illustration filling the bottom. In this phase guests see only this page.

### Full invitation pages (default order; the couple can hide or reorder)

1. **Invitation card** (match the reference closely): monogram; "Com a benção de Deus" (editable); parents' names in two columns (groom's parents left, bride's right, each optional, up to 2 names per side, small caps); "Têm a honra de convidar"; **the guest's display name** in bold serif caps, centered on a dotted accent-colored line with a small open circle at each end (this is the personalization, e.g. "FAMÍLIA SILVA"); "para celebrar a cerimónia de casamento dos seus filhos." (editable); couple names in large pink script; date line and weekday/time line; a thin rounded-border info box, by default "Convite válido para X pessoa(s)" using the guest's seats; hero illustration at the bottom.

2. **Contagem regressiva:** days, hours, minutes, seconds to the ceremony (computed against the server time to avoid wrong phone clocks), with the same title lockup. After the date, a thank-you message.

3. **Mensagem dos noivos** (match the reference): script "Mensagem" + "DOS NOIVOS"; the couple's message inside a rounded rectangle with a thin olive-gold border and large solid olive-gold quotation marks breaking the border at the top-left and bottom-right corners; centered serif text.

4. **Galeria de fotos** (match the reference): line camera icon; script "Galeria de fotos"; subtitle "Confira os nossos pequenos momentos"; a **coverflow-style carousel** with the active photo large in the center and smaller neighbors partly visible on each side, white borders and soft shadows. Swipeable; tap opens a full-screen lightbox. Up to 12 photos, served with `next/image` at responsive sizes.

5. **Cronograma do dia** (match the reference):
   - Script "Cronograma" + "DO DIA".
   - For each location: a small-caps accent heading ("AS CERIMÓNIAS", "COPO-D'ÁGUA"), a small-caps sentence with the venue in bold ("Terão lugar na **Praia do Bispo**, às 16h00."), and a pill "GOOGLE MAPS" button opening the venue in Google Maps, plus a small Waze link.
   - Below, a **serpentine timeline**: items in rows of 3, left-to-right on the first row, a curved connector down the right side, right-to-left on the second row, a curved connector down the left, and so on. Each item: line icon above a dot on the line, then label and time below ("Chegada dos convidados – 13h00", "Chegada dos noivos", "Corte do bolo", "Abertura do buffet", "Sessão de fotos", "Abertura da pista", "Entrega do bouquet"). Draw the line and curves as SVG computed from the item count so any number works. Below 340px width, use rows of 2.

6. **Dress code** (optional): same visual language, optional color swatches.

7. **Manual do bom convidado** (match the reference): script "Manual do" + "BOM CONVIDADO"; a 2-column grid of rules, each a large line icon above short two-line serif text. Defaults (editable, removable, reorderable, custom ones allowed): "Contamos com a sua presença!", "Seja pontual!", "Convidado não convida!", "Comemore a nossa união!", "Branco é a cor da noiva!", "Faça muitas fotos e Stories!", "É obrigatório dançar muito!", "Sorria e seja muito feliz!".

8. **Lista de presentes** (optional): gift list text and/or IBAN with a "Copiar IBAN" button.

9. **Confirmar presença (RSVP)**, with a mode chosen per event:
   - `WHATSAPP`: match the reference with two large circular accent-colored WhatsApp buttons side by side: "Confirmar presença (noivo)" and "Confirmar presença (noiva)". Each opens `https://wa.me/244XXXXXXXXX` with a pre-filled message including the guest's name, e.g. "Olá! Sou [Nome] e confirmo a minha presença no casamento de [Noivo] e [Noiva]." Record each tap as a WhatsApp confirmation intent.
   - `FORM`: an in-page form (attending yes/no, number of people up to the guest's seats, companion names, message to the couple), submitted with a Server Action. Answers can be changed until the RSVP deadline.
   - `BOTH`: form first, WhatsApp buttons below.

10. **Encerramento:** a thank-you, the couple's names in script, and "Adicionar ao calendário" (an `.ics` file from a Route Handler, plus a Google Calendar link).

### Performance
Most guests will open this on low-end Android phones over mobile data. Keep client JavaScript minimal (server-render everything possible), lazy-load everything below the first page, serve WebP at appropriate sizes, preload only what the first screen needs, and respect `prefers-reduced-motion`. Target Lighthouse mobile 90+ for performance and accessibility.

---

## 6. Couple dashboard (`app/(dashboard)/painel`)

- Email + password login via Better Auth; protect routes in middleware and re-check authorization inside every Server Action (never trust the client).
- **Event editor with a live phone-frame preview** covering every field: names, parents' names, monogram initials (or uploaded logo), phase, dates, venues (paste a Google Maps link and extract coordinates), messages, timeline items, dress code, guest rules, gift info/IBAN, RSVP mode, WhatsApp numbers for groom and bride, RSVP deadline, theme, section visibility and order.
- **Media uploads** via presigned URLs: hero illustration, gallery photos, background music (MP3, max ~5MB). After upload, a BullMQ job processes images with sharp (resize, WebP, multiple sizes) and updates the database. Show processing status in the UI.
- **Guests:** add/edit/delete (display name, phone, seats, group tag); CSV import (validated row by row with Zod, processed as a BullMQ job, with an error report for invalid rows) and CSV export; per-guest "Enviar pelo WhatsApp" button with an editable pre-filled message containing the personal link, and "Copiar link".
- **Overview:** invited, opened, confirmed, declined, WhatsApp intent, pending, total people attending; filters by status and group; list of guest messages.

## 7. Super-admin (`app/(admin)/admin`)
For me as the platform owner: list all events and couples, create events and couple accounts for clients, activate/deactivate events, set each event's guest limit (plan). Only the `admin` role. Log every admin action to an audit log table.

---

## 8. Data, caching, and security

### Prisma schema (design it fully; include at least)
- `User`, `Session`, `Account` (as Better Auth requires) with `role`
- `Event` (owner, slug, phase, theme, colors, fonts, groom/bride names, parents' names, monogram, intro and invitation lines, info box text, couple message, dress code, gift info, IBAN, rsvpMode, groom/bride WhatsApp numbers, rsvpDeadline, guestLimit, sectionConfig as JSON, isActive, timestamps)
- `EventLocation` (event, heading, venueName, description, startsAt, address, latitude, longitude, order)
- `TimelineItem` (event, label, time, icon, order)
- `GuestRule` (event, text, icon, order)
- `Media` (event, type HERO | GALLERY | MUSIC | LOGO, storage keys for each size, status PENDING | READY | FAILED, order)
- `Guest` (event, token unique, displayName, phone, seatsAllowed, groupTag)
- `Rsvp` (guest unique, attending, peopleCount, companionNames, message, source FORM | WHATSAPP_CLICK, updatedAt)
- `InvitationView` (guest, openedAt)
- `AuditLog` (actor, action, target, metadata, createdAt)

Add sensible indexes (event slug, guest token, guest eventId). Include a seed script with a demo event mirroring the reference (beach ceremony at 16h00, copo-d'água at a salão de festas at 20h00, full timeline, the 8 default rules, demo guests, a demo couple login, and an admin login).

### Redis
- **Cache** the invitation read model (event + locations + timeline + rules + media) by slug, and guest lookups by token, with a TTL. Invalidate the cache whenever the couple edits anything.
- **Rate limiting** (sliding window) on: RSVP submissions per token and IP, login attempts, invitation page requests per IP, and upload URL requests.
- **View tracking:** record an `InvitationView` at most once per guest per hour (deduplicate with a Redis key).
- **BullMQ** queues for image processing and CSV import, with a separate worker process (its own entry point and its own Docker service), retries with backoff, and failed-job logging to Winston and Sentry.
- The app must degrade gracefully if Redis is temporarily down: skip the cache and read from Postgres, and log a warning.

### Security
- Every Server Action and Route Handler validates input with Zod and checks authorization (couples only touch their own events; admins everything).
- Enforce seat limits, the RSVP deadline, the event's guest limit, and inactive events on the server.
- Guest pages expose only the data needed for that single guest; never leak other guests' names or the full guest list.
- Security headers (Content-Security-Policy, HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) configured in `next.config`.
- Validate upload file types and sizes both when issuing presigned URLs and when processing.
- **Environment variables** validated at startup with a Zod schema in `src/env.ts`; the app fails fast with a clear message if any are missing. Provide `.env.example`. Never commit secrets.

---

## 9. Logging (Winston)

- A single logger module (`src/lib/logger.ts`), used only in the Node.js runtime (not in Edge code or Client Components).
- **Structured JSON** logs in production (to stdout, which Docker collects), readable colorized logs in development.
- Levels: `error`, `warn`, `info`, `http`, `debug`; level set by env var.
- Every log line includes: timestamp, level, service name (`web` or `worker`), environment, release version, and a **request ID**. Generate a request ID in middleware, pass it via a header, and propagate it with AsyncLocalStorage so all logs from one request share it. Attach the same ID to Sentry events.
- Log: incoming requests (method, path, status, duration), Server Action outcomes, RSVP submissions, auth events (login success/failure), admin actions, job start/success/failure, cache hits/misses at debug level, and all caught errors.
- **Redact** sensitive data automatically: passwords, tokens, session cookies, phone numbers, IBANs, and guest tokens in URLs (mask them).
- Errors logged at `error` level are also reported to Sentry, without double-reporting errors Sentry already captured.

## 10. Sentry

- Set up with the current official Next.js setup for client, server, and edge (instrumentation files).
- Capture errors in Server Components, Server Actions, Route Handlers, and the BullMQ worker.
- Performance tracing with a configurable sample rate (low in production).
- Tag events with release (git commit SHA), environment, and request ID; attach user ID and role for logged-in couples only.
- **Privacy:** do not send guest names, phone numbers, IBANs, or tokens. Scrub them in `beforeSend`, and disable default PII collection.
- Upload source maps during the CI build; do not expose them publicly.
- Custom error pages (`error.tsx`, `global-error.tsx`) in Portuguese that report to Sentry.

---

## 11. Docker

- **Dockerfile** (multi-stage): dependencies, build (Next.js `standalone` output), and a minimal runtime image running as a non-root user, with a `HEALTHCHECK` against `/api/health`.
- Separate runnable targets or commands for the **web** app and the **worker**.
- **`docker-compose.yml`** for local development: web (with hot reload), worker, PostgreSQL, Redis, MinIO (with a bucket created automatically), and optionally Mailpit for testing emails.
- **`docker-compose.prod.yml`**: web, worker, PostgreSQL, Redis, and Caddy (automatic HTTPS). Named volumes for Postgres and Redis data, restart policies, resource limits, and health checks with `depends_on` conditions.
- Database migrations run with `prisma migrate deploy` as a separate one-off step before the new app version starts, never automatically inside every app container start.
- `/api/health` checks the database and Redis and returns status and version.
- Include a simple documented backup script for PostgreSQL (daily `pg_dump`, compressed, with retention).

## 12. CI/CD (GitHub Actions)

- **`ci.yml`** on every pull request and push: install with caching, lint, type-check, Prisma schema validation, unit/integration tests (Vitest) against Postgres and Redis service containers, Next.js build, and Playwright E2E tests against the built app. Upload the Playwright report on failure.
- **`deploy.yml`**:
  - On push to `develop`: build the Docker images, tag with the commit SHA, push to GitHub Container Registry, upload Sentry source maps and create a Sentry release, then deploy to **staging**.
  - On push to `main`: same, deploying to **production**, protected by a GitHub Environment requiring manual approval.
  - Deploy over SSH to the VPS: pull the new images, run migrations, restart services with Docker Compose, check `/api/health`, and **roll back** to the previous image tag automatically if the health check fails.
- All secrets (SSH key, database URL, Sentry auth token, storage keys) come from GitHub Secrets / Environments. Document every required secret in the README.
- Add Dependabot for npm, Docker, and GitHub Actions updates.

---

## 13. Project structure and quality

- Suggested layout:
  - `app/` routes with route groups: `(public)`, `(dashboard)`, `(admin)`, `c/[eventSlug]/[guestToken]`, `api/`
  - `src/features/invitation/` (one component per invitation page/section), `src/features/dashboard/`, `src/features/admin/`, `src/features/auth/`
  - `src/components/ui/` shared components: `SectionTitle` (script + small caps lockup), `PillButton`, `Monogram`, `CornerDecorations`, `QuoteBox`, `DottedNameLine`, `SerpentineTimeline`
  - `src/server/` data access, services, cache, rate limiting, storage, queues (server-only code, marked with `server-only`)
  - `src/lib/` logger, Sentry helpers, utilities; `src/themes/`; `src/i18n/`
  - `worker/` BullMQ worker entry point
  - `prisma/` schema, migrations, seed
- Loading, empty, and error states everywhere (`loading.tsx`, `error.tsx`, skeletons).
- Accessibility: labels on inputs, good contrast, keyboard navigation, focus states.
- Tests for: token generation and lookup, seat limit and deadline rules, RSVP flow, rate limiting, date/time formatting in Africa/Luanda, the serpentine timeline layout math, CSV validation, and log redaction. E2E: guest opens invitation and submits RSVP; couple logs in, edits event, adds a guest, sees the RSVP.
- **README.md**: architecture overview, local setup with Docker Compose, env vars, running migrations and seed, running tests, deploying, required GitHub secrets, required theme assets with dimensions, adding a new theme, and backups.
- **CLAUDE.md** with project conventions and commands for future sessions.

---

## 14. Phases

1. **Foundation:** Next.js + TypeScript + Tailwind, ESLint/Prettier, env validation, Winston logger with request IDs, Sentry, Docker Compose for local dev (Postgres, Redis, MinIO), `/api/health`, and a basic CI workflow (lint, type-check, build).
2. **Database:** full Prisma schema, migrations, seed data.
3. **Design system:** fonts, i18n, theme system, shared components rendered on an internal preview page.
4. **Invitation pages** with the demo event in the "Praia Rosa" theme: opening screen, Save the Date, all invitation sections, Open Graph metadata and preview image. Compare against the reference screenshots and refine until it matches closely.
5. **RSVP** in all three modes, Redis caching, rate limiting, view tracking.
6. **"Champanhe" theme.**
7. **Auth and couple dashboard:** Better Auth, event editor with live preview, storage with presigned uploads, BullMQ worker with sharp processing.
8. **Guest management:** CRUD, CSV import/export via the queue, WhatsApp sending, overview.
9. **Admin area** with audit log.
10. **Production:** production Dockerfile and Compose with Caddy, backups, full CI with tests and E2E, deploy workflow with staging, production approval, and rollback.
11. **Polish:** Lighthouse mobile 90+, accessibility review, remaining tests, final README.

Start with Phase 1. Show me your plan first.
