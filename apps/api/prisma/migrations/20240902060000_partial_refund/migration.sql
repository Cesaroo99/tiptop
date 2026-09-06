-- Remboursement partiel traçable (#32-33) : distinct du remboursement total,
-- avec le montant réellement remboursé conservé (jamais seulement le statut).

ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'PARTIALLY_REFUNDED';
ALTER TABLE "Payment" ADD COLUMN "refundedAmountXaf" INTEGER;
ALTER TABLE "Payment" ADD COLUMN "refundedAt" TIMESTAMP(3);
