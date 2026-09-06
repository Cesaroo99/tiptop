/**
 * Filet de sécurité Render : le client Prisma attend Event.address/lat/lng
 * même si migrate deploy a été marqué appliqué sans les colonnes.
 * Sans ça, /api/events et /api/feed répondent 500 et l’app affiche
 * « Réseau indisponible ».
 */
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(resolve(root, "apps/api/package.json"));
const { PrismaClient } = require("@prisma/client");

const statements = [
  `ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "address" TEXT`,
  `ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION`,
  `ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION`,
];

const prisma = new PrismaClient();

try {
  for (const sql of statements) {
    await prisma.$executeRawUnsafe(sql);
    console.log("[ensure-schema]", sql);
  }
  const cols = await prisma.$queryRawUnsafe(
    `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Event' ORDER BY column_name`,
  );
  console.log(
    "[ensure-schema] Event columns:",
    cols.map((c) => c.column_name).join(", "),
  );
} finally {
  await prisma.$disconnect();
}
