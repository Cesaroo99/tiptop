import { config } from "dotenv";
import { resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { refundAllowed } from "@tiptop/domain";

config({ path: resolve(__dirname, "../../.env") });
const prisma = new PrismaClient();

describe("admin (DB)", () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  it("masque un post puis le restaure", async () => {
    const post = await prisma.post.findFirst({ where: { hiddenAt: null } });
    expect(post).toBeTruthy();
    if (!post) return;
    await prisma.post.update({ where: { id: post.id }, data: { hiddenAt: new Date() } });
    const hidden = await prisma.post.findFirst({ where: { id: post.id, hiddenAt: null } });
    expect(hidden).toBeNull();
    await prisma.post.update({ where: { id: post.id }, data: { hiddenAt: null } });
  });

  it("n’autorise un remboursement que sur un paiement réussi", async () => {
    const cesar = await prisma.user.findUnique({ where: { username: "cesar_memoli" } });
    expect(cesar).toBeTruthy();
    if (!cesar) return;
    const payment = await prisma.payment.create({
      data: {
        kind: "LIKE_PACK",
        userId: cesar.id,
        provider: "CARD",
        status: "FAILED",
        amountXaf: 500,
        idempotencyKey: `admin_refund_fail_${Date.now()}`,
      },
    });
    expect(() => refundAllowed(payment.status)).toThrow("PAYMENT_NOT_REFUNDABLE");
    await prisma.payment.update({ where: { id: payment.id }, data: { status: "SUCCEEDED" } });
    refundAllowed("SUCCEEDED");
    await prisma.payment.update({ where: { id: payment.id }, data: { status: "REFUNDED" } });
    const row = await prisma.payment.findUnique({ where: { id: payment.id } });
    expect(row?.status).toBe("REFUNDED");
    await prisma.payment.delete({ where: { id: payment.id } });
  });
});
