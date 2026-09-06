/**
 * Filet Render : le client Prisma attend des colonnes Event
 * (wanted, allowGroups, address, …) même si migrate deploy
 * a été marqué appliqué sans les créer. Sans ça, /api/events
 * et le seed 500 → l’app affiche « Réseau indisponible ».
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(resolve(root, "apps/api/package.json"));
const { PrismaClient } = require("@prisma/client");

const sqlFile = resolve(root, "apps/api/prisma/ensure-schema.sql");
const statements = readFileSync(sqlFile, "utf8")
  .split(";")
  .map((s) => s.replace(/--[^\n]*/g, "").trim())
  .filter(Boolean);

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
