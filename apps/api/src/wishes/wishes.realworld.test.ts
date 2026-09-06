import { config } from "dotenv";
import { resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";

config({ path: resolve(__dirname, "../../.env") });
const prisma = new PrismaClient();

describe("envies (DB)", () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  it("crée, masque, propose et refuse sans marketplace", async () => {
    const erica = await prisma.user.findUnique({ where: { username: "erica.sinclair" } });
    const cesar = await prisma.user.findUnique({ where: { username: "cesar_memoli" } });
    expect(erica && cesar).toBeTruthy();
    if (!erica || !cesar) return;

    const wish = await prisma.wish.create({
      data: {
        ownerId: erica.id,
        title: "E2E envie test",
        category: "RESTAURANT",
        visibility: "PUBLIC",
      },
    });
    const publicList = await prisma.wish.findMany({
      where: { ownerId: erica.id, visibility: "PUBLIC", title: "E2E envie test" },
    });
    expect(publicList.length).toBeGreaterThan(0);

    await prisma.wish.update({ where: { id: wish.id }, data: { visibility: "PRIVATE" } });
    const hidden = await prisma.wish.findMany({
      where: { ownerId: erica.id, visibility: "PUBLIC", title: "E2E envie test" },
    });
    expect(hidden.length).toBe(0);

    const offer = await prisma.wishOffer.create({
      data: { wishId: wish.id, fromUserId: cesar.id, message: "Je t’invite.", status: "SENT" },
    });
    expect(offer.status).toBe("SENT");
    const refused = await prisma.wishOffer.update({
      where: { id: offer.id },
      data: { status: "REFUSED" },
    });
    expect(refused.status).toBe("REFUSED");

    await prisma.wishOffer.delete({ where: { id: offer.id } });
    await prisma.wish.delete({ where: { id: wish.id } });
  });
});
