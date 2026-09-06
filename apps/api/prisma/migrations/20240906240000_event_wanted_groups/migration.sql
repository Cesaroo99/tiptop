-- Colonnes Event ajoutées au schema.prisma sans migration : Prisma SELECT * 500 en prod.
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "wanted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "allowGroups" BOOLEAN NOT NULL DEFAULT false;
