-- CreateEnum
CREATE TYPE "guest_import_status" AS ENUM ('PENDING', 'DONE', 'FAILED');

-- CreateTable
CREATE TABLE "guest_import" (
    "id" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "createdById" TEXT,
    "status" "guest_import_status" NOT NULL DEFAULT 'PENDING',
    "fileName" TEXT NOT NULL,
    "content" TEXT,
    "totalRows" INTEGER,
    "importedCount" INTEGER,
    "duplicateCount" INTEGER,
    "failure" TEXT,
    "report" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMPTZ(3),

    CONSTRAINT "guest_import_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "guest_import_eventId_createdAt_idx" ON "guest_import"("eventId", "createdAt");

-- CreateIndex
CREATE INDEX "guest_import_status_createdAt_idx" ON "guest_import"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "guest_import" ADD CONSTRAINT "guest_import_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_import" ADD CONSTRAINT "guest_import_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Integrity rules the Prisma schema cannot express (hand-written).
ALTER TABLE "guest_import" ADD CONSTRAINT "guest_import_counts_check" CHECK (
  ("totalRows" IS NULL OR "totalRows" >= 0) AND
  ("importedCount" IS NULL OR "importedCount" >= 0) AND
  ("duplicateCount" IS NULL OR "duplicateCount" >= 0)
);
-- The file is kept only while the import waits.
ALTER TABLE "guest_import" ADD CONSTRAINT "guest_import_content_check"
  CHECK ("status" = 'PENDING' OR "content" IS NULL);
