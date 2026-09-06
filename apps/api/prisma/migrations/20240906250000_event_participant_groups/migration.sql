-- Colonnes / tables ajoutées au schema.prisma sans migration.
ALTER TABLE "EventParticipant" ADD COLUMN IF NOT EXISTS "showOnProfile" BOOLEAN NOT NULL DEFAULT false;

DO $$ BEGIN CREATE TYPE "EventGroupRole" AS ENUM ('HOST', 'ADMIN', 'MEMBER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "EventGroupStatus" AS ENUM ('INVITED', 'JOINED', 'DECLINED', 'LEFT'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "EventGroup" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "conversationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EventGroup_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "EventGroupMember" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "EventGroupRole" NOT NULL DEFAULT 'MEMBER',
    "status" "EventGroupStatus" NOT NULL,
    "invitedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    CONSTRAINT "EventGroupMember_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "EventGroup_conversationId_key" ON "EventGroup"("conversationId");
CREATE INDEX IF NOT EXISTS "EventGroup_eventId_idx" ON "EventGroup"("eventId");
CREATE UNIQUE INDEX IF NOT EXISTS "EventGroupMember_groupId_userId_key" ON "EventGroupMember"("groupId", "userId");
CREATE INDEX IF NOT EXISTS "EventGroupMember_userId_status_idx" ON "EventGroupMember"("userId", "status");
