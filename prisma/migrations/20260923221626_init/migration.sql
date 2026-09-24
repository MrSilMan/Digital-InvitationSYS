-- CreateEnum
CREATE TYPE "event_phase" AS ENUM ('SAVE_THE_DATE', 'INVITATION');

-- CreateEnum
CREATE TYPE "rsvp_mode" AS ENUM ('WHATSAPP', 'FORM', 'BOTH');

-- CreateEnum
CREATE TYPE "rsvp_source" AS ENUM ('FORM', 'WHATSAPP_CLICK');

-- CreateEnum
CREATE TYPE "whatsapp_target" AS ENUM ('GROOM', 'BRIDE');

-- CreateEnum
CREATE TYPE "media_type" AS ENUM ('HERO', 'GALLERY', 'MUSIC', 'LOGO');

-- CreateEnum
CREATE TYPE "media_status" AS ENUM ('PENDING', 'READY', 'FAILED');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "role" TEXT DEFAULT 'couple',
    "banned" BOOLEAN DEFAULT false,
    "banReason" TEXT,
    "banExpires" TIMESTAMPTZ(3),

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,
    "impersonatedBy" TEXT,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMPTZ(3),
    "refreshTokenExpiresAt" TIMESTAMPTZ(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event" (
    "id" UUID NOT NULL,
    "ownerId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "phase" "event_phase" NOT NULL DEFAULT 'SAVE_THE_DATE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "guestLimit" INTEGER NOT NULL DEFAULT 150,
    "themeId" TEXT NOT NULL DEFAULT 'praia-rosa',
    "themeOverrides" JSONB,
    "monogram" TEXT,
    "groomName" TEXT NOT NULL,
    "brideName" TEXT NOT NULL,
    "groomParents" TEXT[],
    "brideParents" TEXT[],
    "startsAt" TIMESTAMPTZ(3) NOT NULL,
    "endsAt" TIMESTAMPTZ(3),
    "introLine" TEXT,
    "invitationLine" TEXT,
    "celebrationLine" TEXT,
    "infoBoxText" TEXT,
    "coupleMessage" TEXT,
    "dressCodeText" TEXT,
    "dressCodeColors" TEXT[],
    "giftText" TEXT,
    "giftIban" TEXT,
    "giftAccountHolder" TEXT,
    "rsvpMode" "rsvp_mode" NOT NULL DEFAULT 'BOTH',
    "rsvpDeadline" TIMESTAMPTZ(3),
    "groomWhatsapp" TEXT,
    "brideWhatsapp" TEXT,
    "sectionConfig" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_location" (
    "id" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "heading" TEXT NOT NULL,
    "venueName" TEXT NOT NULL,
    "description" TEXT,
    "startsAt" TIMESTAMPTZ(3) NOT NULL,
    "address" TEXT,
    "mapsUrl" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "event_location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timeline_item" (
    "id" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "startsAt" TIMESTAMPTZ(3),
    "icon" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "timeline_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guest_rule" (
    "id" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "text" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "guest_rule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media" (
    "id" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "type" "media_type" NOT NULL,
    "status" "media_status" NOT NULL DEFAULT 'PENDING',
    "originalKey" TEXT NOT NULL,
    "variants" JSONB,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "altText" TEXT,
    "error" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guest" (
    "id" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "phone" TEXT,
    "seatsAllowed" INTEGER NOT NULL DEFAULT 1,
    "groupTag" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "guest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rsvp" (
    "id" UUID NOT NULL,
    "guestId" UUID NOT NULL,
    "attending" BOOLEAN,
    "peopleCount" INTEGER,
    "companionNames" TEXT[],
    "message" TEXT,
    "source" "rsvp_source" NOT NULL,
    "whatsappIntentAt" TIMESTAMPTZ(3),
    "whatsappIntentTarget" "whatsapp_target",
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "rsvp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invitation_view" (
    "id" UUID NOT NULL,
    "guestId" UUID NOT NULL,
    "openedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invitation_view_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" UUID NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "event_slug_key" ON "event"("slug");

-- CreateIndex
CREATE INDEX "event_ownerId_idx" ON "event"("ownerId");

-- CreateIndex
CREATE INDEX "event_location_eventId_position_idx" ON "event_location"("eventId", "position");

-- CreateIndex
CREATE INDEX "timeline_item_eventId_position_idx" ON "timeline_item"("eventId", "position");

-- CreateIndex
CREATE INDEX "guest_rule_eventId_position_idx" ON "guest_rule"("eventId", "position");

-- CreateIndex
CREATE INDEX "media_eventId_type_position_idx" ON "media"("eventId", "type", "position");

-- CreateIndex
CREATE UNIQUE INDEX "guest_token_key" ON "guest"("token");

-- CreateIndex
CREATE INDEX "guest_eventId_idx" ON "guest"("eventId");

-- CreateIndex
CREATE INDEX "guest_eventId_groupTag_idx" ON "guest"("eventId", "groupTag");

-- CreateIndex
CREATE UNIQUE INDEX "rsvp_guestId_key" ON "rsvp"("guestId");

-- CreateIndex
CREATE INDEX "invitation_view_guestId_openedAt_idx" ON "invitation_view"("guestId", "openedAt");

-- CreateIndex
CREATE INDEX "audit_log_createdAt_idx" ON "audit_log"("createdAt");

-- CreateIndex
CREATE INDEX "audit_log_actorId_createdAt_idx" ON "audit_log"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_log_targetType_targetId_idx" ON "audit_log"("targetType", "targetId");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_location" ADD CONSTRAINT "event_location_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_item" ADD CONSTRAINT "timeline_item_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_rule" ADD CONSTRAINT "guest_rule_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest" ADD CONSTRAINT "guest_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rsvp" ADD CONSTRAINT "rsvp_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "guest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitation_view" ADD CONSTRAINT "invitation_view_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "guest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
