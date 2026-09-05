-- CreateEnum
CREATE TYPE "OfferKind" AS ENUM ('PRODUCT', 'SERVICE');

-- CreateEnum
CREATE TYPE "OfferSellerKind" AS ENUM ('PERSON', 'SHOP', 'BUSINESS');

-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('ACTIVE', 'HIDDEN');

-- CreateTable
CREATE TABLE "Offer" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "kind" "OfferKind" NOT NULL,
    "sellerKind" "OfferSellerKind" NOT NULL DEFAULT 'PERSON',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "shopName" TEXT,
    "priceXaf" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'XAF',
    "city" TEXT NOT NULL,
    "zone" TEXT,
    "placeName" TEXT,
    "address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "imageUrl" TEXT,
    "status" "OfferStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Offer_city_status_idx" ON "Offer"("city", "status");

-- CreateIndex
CREATE INDEX "Offer_kind_status_idx" ON "Offer"("kind", "status");

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
