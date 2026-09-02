-- Tag "Avec X" sur un Mood (#4-6, #43) : relie le mood à une personne réellement
-- présente, renforce la passerelle contenu social → monde réel.

ALTER TABLE "Mood" ADD COLUMN "companionId" TEXT;
ALTER TABLE "Mood" ADD CONSTRAINT "Mood_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
