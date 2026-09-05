-- Lieu optionnel sur un Mood (adresse + coordonnées). Absents = l'auteur n'a
-- pas choisi d'afficher de lieu, ce n'est pas une obligation.
ALTER TABLE "Mood" ADD COLUMN "placeName" TEXT;
ALTER TABLE "Mood" ADD COLUMN "address" TEXT;
ALTER TABLE "Mood" ADD COLUMN "latitude" DOUBLE PRECISION;
ALTER TABLE "Mood" ADD COLUMN "longitude" DOUBLE PRECISION;
