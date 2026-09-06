-- AlterTable
ALTER TABLE "Event" ADD COLUMN "recurrence" TEXT NOT NULL DEFAULT 'NONE';
ALTER TABLE "Event" ADD COLUMN "seriesId" TEXT;

-- CreateIndex
CREATE INDEX "Event_seriesId_startsAt_idx" ON "Event"("seriesId", "startsAt");

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;
