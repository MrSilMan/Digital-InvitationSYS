-- DropIndex
DROP INDEX "guest_eventId_idx";

-- AlterTable
ALTER TABLE "event" ALTER COLUMN "groomParents" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "brideParents" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "dressCodeColors" SET DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "rsvp" ALTER COLUMN "companionNames" SET DEFAULT ARRAY[]::TEXT[];

-- Integrity rules the Prisma schema cannot express (hand-written). The app validates the same
-- rules with Zod first; these make invalid data impossible even for scripts and manual SQL.

-- Better Auth admin plugin roles used by the platform.
ALTER TABLE "user" ADD CONSTRAINT "user_role_check"
  CHECK ("role" IS NULL OR "role" IN ('couple', 'admin'));

-- Lowercase URL segment: letters, digits and single hyphens (e.g. "braulio-e-nanda").
ALTER TABLE "event" ADD CONSTRAINT "event_slug_check"
  CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
ALTER TABLE "event" ADD CONSTRAINT "event_guest_limit_check" CHECK ("guestLimit" >= 1);
ALTER TABLE "event" ADD CONSTRAINT "event_parents_check"
  CHECK (cardinality("groomParents") <= 2 AND cardinality("brideParents") <= 2);
ALTER TABLE "event" ADD CONSTRAINT "event_ends_after_start_check"
  CHECK ("endsAt" IS NULL OR "endsAt" > "startsAt");

-- Unguessable personal links: at least 16 URL-safe characters.
ALTER TABLE "guest" ADD CONSTRAINT "guest_token_check" CHECK ("token" ~ '^[A-Za-z0-9_-]{16,}$');
ALTER TABLE "guest" ADD CONSTRAINT "guest_seats_check" CHECK ("seatsAllowed" >= 1);

ALTER TABLE "rsvp" ADD CONSTRAINT "rsvp_people_count_check"
  CHECK ("peopleCount" IS NULL OR "peopleCount" >= 0);
