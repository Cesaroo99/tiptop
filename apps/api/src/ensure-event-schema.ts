/** DDL que Prisma attend mais que des migrations ont oublié. Absents = 500 + seed mort. */
export const EVENT_SCHEMA_STATEMENTS = [
  `ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "description" TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT`,
  `ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "zone" TEXT`,
  `ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "venue" TEXT`,
  `ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "address" TEXT`,
  `ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION`,
  `ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION`,
  `ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "endsAt" TIMESTAMP(3)`,
  `ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "priceXaf" INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'XAF'`,
  `ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "capacity" INTEGER`,
  `ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "minAge" INTEGER`,
  `ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "requiresReservation" BOOLEAN NOT NULL DEFAULT false`,
  `ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "paymentRule" TEXT NOT NULL DEFAULT 'HOLD'`,
  `ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "wanted" BOOLEAN NOT NULL DEFAULT false`,
  `ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "allowGroups" BOOLEAN NOT NULL DEFAULT false`,
  `ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "recurrence" TEXT NOT NULL DEFAULT 'NONE'`,
  `ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "seriesId" TEXT`,
  `ALTER TABLE "EventParticipant" ADD COLUMN IF NOT EXISTS "showOnProfile" BOOLEAN NOT NULL DEFAULT false`,
  `DO $$ BEGIN CREATE TYPE "EventGroupRole" AS ENUM ('HOST', 'ADMIN', 'MEMBER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN CREATE TYPE "EventGroupStatus" AS ENUM ('INVITED', 'JOINED', 'DECLINED', 'LEFT'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `CREATE TABLE IF NOT EXISTS "EventGroup" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "conversationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EventGroup_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "EventGroupMember" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "EventGroupRole" NOT NULL DEFAULT 'MEMBER',
    "status" "EventGroupStatus" NOT NULL,
    "invitedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    CONSTRAINT "EventGroupMember_pkey" PRIMARY KEY ("id")
  )`,
  `ALTER TYPE "AdminAction" ADD VALUE IF NOT EXISTS 'SETTINGS_UPDATE'`,
  `ALTER TYPE "AdminAction" ADD VALUE IF NOT EXISTS 'USER_ROLE'`,
  `ALTER TYPE "AdminAction" ADD VALUE IF NOT EXISTS 'SESSION_REVOKE'`,
  `ALTER TYPE "AdminAction" ADD VALUE IF NOT EXISTS 'EVENT_APPROVE'`,
  `ALTER TYPE "AdminAction" ADD VALUE IF NOT EXISTS 'EVENT_SUSPEND'`,
  `ALTER TYPE "AdminAction" ADD VALUE IF NOT EXISTS 'EVENT_RESTORE'`,
  `ALTER TYPE "AdminAction" ADD VALUE IF NOT EXISTS 'EVENT_FEATURE'`,
  `ALTER TYPE "AdminAction" ADD VALUE IF NOT EXISTS 'FEATURE_FLAG'`,
  `ALTER TYPE "AdminAction" ADD VALUE IF NOT EXISTS 'NOTIFICATION_SEND'`,
  `ALTER TYPE "AdminAction" ADD VALUE IF NOT EXISTS 'AI_SETTINGS'`,
  `ALTER TYPE "AdminAction" ADD VALUE IF NOT EXISTS 'ORGANIZER_RESTRICT'`,
  `ALTER TYPE "AdminAction" ADD VALUE IF NOT EXISTS 'WORLD_MISSION'`,
  `ALTER TABLE "Mood" ADD COLUMN IF NOT EXISTS "hiddenAt" TIMESTAMP(3)`,
  `ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "imageUrls" JSONB`,
  `ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "featured" BOOLEAN NOT NULL DEFAULT false`,
  `ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "suspendedAt" TIMESTAMP(3)`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "salesBlocked" BOOLEAN NOT NULL DEFAULT false`,
] as const;

export async function applyEventSchemaFixes(
  exec: (sql: string) => Promise<unknown>,
  log = console,
) {
  const errors: string[] = [];
  for (const sql of EVENT_SCHEMA_STATEMENTS) {
    try {
      await exec(sql);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${sql.slice(0, 80)} → ${msg}`);
      log.error("[ensure-schema]", sql.slice(0, 80), err);
    }
  }
  return errors;
}

export async function listTableColumns(
  query: <T>(sql: string) => Promise<T>,
  table: string,
) {
  const rows = await query<Array<{ column_name: string }>>(
    `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = '${table}' ORDER BY column_name`,
  );
  return rows.map((r) => r.column_name);
}
