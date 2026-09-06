-- AlterTable
ALTER TABLE "Mood" ADD COLUMN "soundKey" TEXT;
ALTER TABLE "Mood" ADD COLUMN "soundLabel" TEXT;

-- AlterTable
ALTER TABLE "MoodComment" ADD COLUMN "parentId" TEXT;

-- CreateIndex
CREATE INDEX "MoodComment_moodId_parentId_idx" ON "MoodComment"("moodId", "parentId");

-- AddForeignKey
ALTER TABLE "MoodComment" ADD CONSTRAINT "MoodComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "MoodComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
