-- CreateEnum
CREATE TYPE "PaymentKind" AS ENUM ('RESERVATION', 'LIKE_PACK');

-- CreateEnum
CREATE TYPE "LikeTransactionKind" AS ENUM ('PURCHASE', 'ALLOCATE', 'RELEASE');

-- AlterTable Payment: ledger XAF générique (résa + packs likes)
ALTER TABLE "Payment" ADD COLUMN "kind" "PaymentKind" NOT NULL DEFAULT 'RESERVATION';
ALTER TABLE "Payment" ADD COLUMN "userId" TEXT;
ALTER TABLE "Payment" ADD COLUMN "likePurchaseId" TEXT;

UPDATE "Payment" AS p
SET "userId" = r."bookerId"
FROM "Reservation" AS r
WHERE p."reservationId" = r."id";

DELETE FROM "Payment" WHERE "userId" IS NULL;

ALTER TABLE "Payment" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "Payment" ALTER COLUMN "reservationId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "LikePurchase" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "packCode" TEXT NOT NULL,
    "units" INTEGER NOT NULL,
    "amountXaf" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LikePurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LikeTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "LikeTransactionKind" NOT NULL,
    "delta" INTEGER NOT NULL DEFAULT 0,
    "unitId" TEXT,
    "toUserId" TEXT,
    "purchaseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LikeTransaction_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "LikeUnit" ADD COLUMN "purchaseId" TEXT;

-- CreateIndex
CREATE INDEX "LikePurchase_userId_createdAt_idx" ON "LikePurchase"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "LikeTransaction_userId_createdAt_idx" ON "LikeTransaction"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "like_tx_one_purchase" ON "LikeTransaction"("purchaseId") WHERE "kind" = 'PURCHASE' AND "purchaseId" IS NOT NULL;

-- CreateIndex
CREATE INDEX "LikeUnit_purchaseId_idx" ON "LikeUnit"("purchaseId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_likePurchaseId_key" ON "Payment"("likePurchaseId");

-- CreateIndex
CREATE INDEX "Payment_userId_createdAt_idx" ON "Payment"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "LikeUnit" ADD CONSTRAINT "LikeUnit_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "LikePurchase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LikePurchase" ADD CONSTRAINT "LikePurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LikeTransaction" ADD CONSTRAINT "LikeTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LikeTransaction" ADD CONSTRAINT "LikeTransaction_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "LikeUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LikeTransaction" ADD CONSTRAINT "LikeTransaction_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LikeTransaction" ADD CONSTRAINT "LikeTransaction_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "LikePurchase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_likePurchaseId_fkey" FOREIGN KEY ("likePurchaseId") REFERENCES "LikePurchase"("id") ON DELETE SET NULL ON UPDATE CASCADE;
