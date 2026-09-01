import { config } from "dotenv";
import { resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { getLikePack, likeCreditAllowed } from "@tiptop/domain";

config({ path: resolve(__dirname, "../../.env") });
const prisma = new PrismaClient();

describe("like wallet (DB)", () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  it("n’ajoute pas d’unités si le paiement échoue", async () => {
    const cesar = await prisma.user.findUnique({ where: { username: "cesar_memoli" } });
    expect(cesar).toBeTruthy();
    if (!cesar) return;
    const pack = getLikePack("p1");
    const before = await prisma.likeUnit.count({ where: { ownerId: cesar.id } });
    const purchase = await prisma.likePurchase.create({
      data: {
        userId: cesar.id,
        packCode: pack.code,
        units: pack.units,
        amountXaf: pack.amountXaf,
        payment: {
          create: {
            kind: "LIKE_PACK",
            userId: cesar.id,
            provider: "CARD",
            status: "FAILED",
            amountXaf: pack.amountXaf,
            idempotencyKey: `test_fail_${Date.now()}`,
          },
        },
      },
      include: { payment: true },
    });
    const gate = likeCreditAllowed(purchase.payment!.status, false);
    expect(gate.ok).toBe(false);
    const after = await prisma.likeUnit.count({ where: { ownerId: cesar.id } });
    expect(after).toBe(before);
    await prisma.payment.deleteMany({ where: { likePurchaseId: purchase.id } });
    await prisma.likePurchase.delete({ where: { id: purchase.id } });
  });

  it("crédite exactement une fois un pack payé", async () => {
    const cesar = await prisma.user.findUnique({ where: { username: "cesar_memoli" } });
    expect(cesar).toBeTruthy();
    if (!cesar) return;
    const pack = getLikePack("p5");
    const purchase = await prisma.likePurchase.create({
      data: {
        userId: cesar.id,
        packCode: pack.code,
        units: pack.units,
        amountXaf: pack.amountXaf,
        payment: {
          create: {
            kind: "LIKE_PACK",
            userId: cesar.id,
            provider: "ORANGE_MONEY",
            status: "SUCCEEDED",
            amountXaf: pack.amountXaf,
            idempotencyKey: `test_ok_${Date.now()}`,
          },
        },
      },
    });
    await prisma.likeUnit.createMany({
      data: Array.from({ length: pack.units }, () => ({
        ownerId: cesar.id,
        source: "PURCHASED" as const,
        purchaseId: purchase.id,
      })),
    });
    await prisma.likeTransaction.create({
      data: {
        userId: cesar.id,
        kind: "PURCHASE",
        delta: pack.units,
        purchaseId: purchase.id,
      },
    });
    await expect(
      prisma.likeTransaction.create({
        data: {
          userId: cesar.id,
          kind: "PURCHASE",
          delta: pack.units,
          purchaseId: purchase.id,
        },
      }),
    ).rejects.toMatchObject({ code: "P2002" });
    const units = await prisma.likeUnit.count({ where: { purchaseId: purchase.id } });
    expect(units).toBe(5);
    await prisma.likeUnit.deleteMany({ where: { purchaseId: purchase.id } });
    await prisma.likeTransaction.deleteMany({ where: { purchaseId: purchase.id } });
    await prisma.payment.deleteMany({ where: { likePurchaseId: purchase.id } });
    await prisma.likePurchase.delete({ where: { id: purchase.id } });
  });
});
