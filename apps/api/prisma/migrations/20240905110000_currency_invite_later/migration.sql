ALTER TABLE "User" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'CAD';

CREATE TABLE "InviteLater" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InviteLater_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InviteLater_ownerId_personId_key" ON "InviteLater"("ownerId", "personId");
CREATE INDEX "InviteLater_ownerId_createdAt_idx" ON "InviteLater"("ownerId", "createdAt");

ALTER TABLE "InviteLater" ADD CONSTRAINT "InviteLater_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InviteLater" ADD CONSTRAINT "InviteLater_personId_fkey" FOREIGN KEY ("personId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
