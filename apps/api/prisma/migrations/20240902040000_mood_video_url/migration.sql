-- Mood en vidéo courte (flux vertical immersif, #4) — champ dédié plutôt que de
-- surcharger imageUrl, pour distinguer clairement le type de média côté client.

ALTER TABLE "Mood" ADD COLUMN "videoUrl" TEXT;
