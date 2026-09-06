-- Vocal, fichiers, stickers et invitations dans le fil.

ALTER TYPE "MessageKind" ADD VALUE IF NOT EXISTS 'FILE';
ALTER TYPE "MessageKind" ADD VALUE IF NOT EXISTS 'STICKER';
ALTER TYPE "MessageKind" ADD VALUE IF NOT EXISTS 'INVITE';

ALTER TABLE "Message" ADD COLUMN "audioUrl" TEXT;
ALTER TABLE "Message" ADD COLUMN "fileUrl" TEXT;
ALTER TABLE "Message" ADD COLUMN "fileName" TEXT;
ALTER TABLE "Message" ADD COLUMN "mimeType" TEXT;
ALTER TABLE "Message" ADD COLUMN "durationMs" INTEGER;
ALTER TABLE "Message" ADD COLUMN "inviteType" TEXT;
ALTER TABLE "Message" ADD COLUMN "inviteId" TEXT;
