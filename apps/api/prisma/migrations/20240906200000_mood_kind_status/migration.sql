-- CreateEnum
CREATE TYPE "MoodKind" AS ENUM ('MOOD', 'STATUS');

-- AlterEnum
BEGIN;
CREATE TYPE "MoodVisibility_new" AS ENUM ('ZONE', 'FOLLOWERS', 'EVENT', 'PUBLIC');
ALTER TABLE "Mood" ALTER COLUMN "visibility" DROP DEFAULT;
ALTER TABLE "Mood" ALTER COLUMN "visibility" TYPE "MoodVisibility_new" USING ("visibility"::text::"MoodVisibility_new");
ALTER TYPE "MoodVisibility" RENAME TO "MoodVisibility_old";
ALTER TYPE "MoodVisibility_new" RENAME TO "MoodVisibility";
DROP TYPE "MoodVisibility_old";
ALTER TABLE "Mood" ALTER COLUMN "visibility" SET DEFAULT 'PUBLIC';
COMMIT;

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN "interests" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Mood" ADD COLUMN "kind" "MoodKind" NOT NULL DEFAULT 'MOOD';
ALTER TABLE "Mood" ADD COLUMN "interest" TEXT;
ALTER TABLE "Mood" ALTER COLUMN "expiresAt" DROP NOT NULL;
ALTER TABLE "Mood" ALTER COLUMN "visibility" SET DEFAULT 'PUBLIC';

-- Backfill : vidéos = moods publics pérennes ; le reste = statuts 24 h amis
UPDATE "Mood"
SET "kind" = 'MOOD',
    "visibility" = 'PUBLIC',
    "expiresAt" = NULL
WHERE "videoUrl" IS NOT NULL;

UPDATE "Mood"
SET "kind" = 'STATUS',
    "visibility" = 'FOLLOWERS'
WHERE "videoUrl" IS NULL;

-- CreateIndex
CREATE INDEX "Mood_kind_expiresAt_idx" ON "Mood"("kind", "expiresAt");
