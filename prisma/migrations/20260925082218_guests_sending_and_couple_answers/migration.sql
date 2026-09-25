-- AlterEnum
ALTER TYPE "rsvp_source" ADD VALUE 'COUPLE';

-- AlterTable
ALTER TABLE "event" ADD COLUMN     "inviteMessage" TEXT;

-- AlterTable
ALTER TABLE "guest" ADD COLUMN     "invitationSentAt" TIMESTAMPTZ(3);
