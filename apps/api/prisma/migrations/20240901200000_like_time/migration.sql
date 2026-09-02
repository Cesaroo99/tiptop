-- Like time: périodes, paliers, envies.

CREATE TYPE "LikeTargetType" AS ENUM ('USER', 'POST', 'COMMENT', 'MOOD', 'WISH');
CREATE TYPE "WishCategory" AS ENUM ('EVENT', 'PRODUCT', 'RESTAURANT', 'ACTIVITY', 'TRAVEL', 'EXPERIENCE', 'GIFT', 'SERVICE', 'PLACE', 'SPORT', 'LEISURE', 'OTHER');
CREATE TYPE "WishVisibility" AS ENUM ('PUBLIC', 'FOLLOWERS', 'PRIVATE');
CREATE TYPE "WishPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');
CREATE TYPE "WishOfferStatus" AS ENUM ('SENT', 'PENDING', 'ACCEPTED', 'REFUSED', 'AWAITING_PAYMENT', 'PAID', 'DELIVERED', 'DONE', 'CANCELLED');

ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'WISH_OFFER';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'LIKE_MILESTONE';

CREATE TABLE "LikePeriod" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "targetType" "LikeTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "beneficiaryUserId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "weight" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "LikePeriod_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LikePeriod_targetType_targetId_endedAt_idx" ON "LikePeriod"("targetType", "targetId", "endedAt");
CREATE INDEX "LikePeriod_beneficiaryUserId_endedAt_idx" ON "LikePeriod"("beneficiaryUserId", "endedAt");
CREATE INDEX "LikePeriod_actorId_endedAt_idx" ON "LikePeriod"("actorId", "endedAt");
CREATE INDEX "LikePeriod_unitId_endedAt_idx" ON "LikePeriod"("unitId", "endedAt");
CREATE UNIQUE INDEX "like_period_one_active" ON "LikePeriod"("unitId") WHERE "endedAt" IS NULL;

ALTER TABLE "LikePeriod" ADD CONSTRAINT "LikePeriod_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "LikeUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LikePeriod" ADD CONSTRAINT "LikePeriod_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LikePeriod" ADD CONSTRAINT "LikePeriod_beneficiaryUserId_fkey" FOREIGN KEY ("beneficiaryUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "UserMilestone" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "milestoneId" TEXT NOT NULL,
    "achievedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notifiedAt" TIMESTAMP(3),
    CONSTRAINT "UserMilestone_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "UserMilestone_userId_milestoneId_key" ON "UserMilestone"("userId", "milestoneId");
CREATE INDEX "UserMilestone_userId_idx" ON "UserMilestone"("userId");
ALTER TABLE "UserMilestone" ADD CONSTRAINT "UserMilestone_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "UserLikeStats" (
    "userId" TEXT NOT NULL,
    "closedSeconds" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UserLikeStats_pkey" PRIMARY KEY ("userId")
);
ALTER TABLE "UserLikeStats" ADD CONSTRAINT "UserLikeStats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "Wish" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "WishCategory" NOT NULL DEFAULT 'OTHER',
    "description" TEXT NOT NULL DEFAULT '',
    "imageUrl" TEXT,
    "url" TEXT,
    "estimatedPriceXaf" INTEGER,
    "city" TEXT,
    "zone" TEXT,
    "desiredAt" TIMESTAMP(3),
    "eventId" TEXT,
    "priority" "WishPriority" NOT NULL DEFAULT 'MEDIUM',
    "visibility" "WishVisibility" NOT NULL DEFAULT 'PUBLIC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Wish_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Wish_ownerId_createdAt_idx" ON "Wish"("ownerId", "createdAt");
ALTER TABLE "Wish" ADD CONSTRAINT "Wish_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "WishOffer" (
    "id" TEXT NOT NULL,
    "wishId" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "message" TEXT NOT NULL DEFAULT '',
    "status" "WishOfferStatus" NOT NULL DEFAULT 'SENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WishOffer_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "WishOffer_wishId_createdAt_idx" ON "WishOffer"("wishId", "createdAt");
CREATE INDEX "WishOffer_fromUserId_idx" ON "WishOffer"("fromUserId");
ALTER TABLE "WishOffer" ADD CONSTRAINT "WishOffer_wishId_fkey" FOREIGN KEY ("wishId") REFERENCES "Wish"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WishOffer" ADD CONSTRAINT "WishOffer_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Historique : chaque allocation existante devient une période USER.
INSERT INTO "LikePeriod" ("id", "unitId", "actorId", "targetType", "targetId", "beneficiaryUserId", "startedAt", "endedAt", "weight")
SELECT
  'lp_' || a."id",
  a."unitId",
  u."ownerId",
  'USER',
  a."toUserId",
  a."toUserId",
  a."allocatedAt",
  a."releasedAt",
  1
FROM "LikeAllocation" a
JOIN "LikeUnit" u ON u."id" = a."unitId";
