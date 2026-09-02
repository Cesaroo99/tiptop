-- Expérience sociale : mood enrichi, invitations sociales, modération étendue.

ALTER TABLE "Mood" ADD COLUMN "activity" TEXT;
ALTER TABLE "Mood" ADD COLUMN "city" TEXT;
ALTER TABLE "Mood" ADD COLUMN "zone" TEXT;

ALTER TABLE "PushPreference" ADD COLUMN "invitations" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "PushPreference" ADD COLUMN "mood" BOOLEAN NOT NULL DEFAULT true;

ALTER TYPE "ReportKind" ADD VALUE IF NOT EXISTS 'MESSAGE';
ALTER TYPE "ReportKind" ADD VALUE IF NOT EXISTS 'MOOD';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'SOCIAL_INVITE';

ALTER TABLE "Report" ADD COLUMN "messageId" TEXT;
ALTER TABLE "Report" ADD COLUMN "moodId" TEXT;
ALTER TABLE "Report" ADD CONSTRAINT "Report_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Report" ADD CONSTRAINT "Report_moodId_fkey" FOREIGN KEY ("moodId") REFERENCES "Mood"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TYPE "SocialInviteContext" AS ENUM ('RESTAURANT', 'CAFE', 'ACTIVITY', 'MEETUP', 'WISH');
CREATE TYPE "SocialInviteStatus" AS ENUM ('SENT', 'ACCEPTED', 'REFUSED', 'EXPIRED', 'CANCELLED');

CREATE TABLE "SocialInvite" (
    "id" TEXT NOT NULL,
    "inviterId" TEXT NOT NULL,
    "inviteeId" TEXT NOT NULL,
    "context" "SocialInviteContext" NOT NULL,
    "label" TEXT NOT NULL DEFAULT '',
    "message" TEXT NOT NULL DEFAULT '',
    "wishId" TEXT,
    "status" "SocialInviteStatus" NOT NULL DEFAULT 'SENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SocialInvite_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SocialInvite_inviteeId_status_idx" ON "SocialInvite"("inviteeId", "status");
CREATE INDEX "SocialInvite_inviterId_createdAt_idx" ON "SocialInvite"("inviterId", "createdAt");

ALTER TABLE "SocialInvite" ADD CONSTRAINT "SocialInvite_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SocialInvite" ADD CONSTRAINT "SocialInvite_inviteeId_fkey" FOREIGN KEY ("inviteeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SocialInvite" ADD CONSTRAINT "SocialInvite_wishId_fkey" FOREIGN KEY ("wishId") REFERENCES "Wish"("id") ON DELETE SET NULL ON UPDATE CASCADE;
