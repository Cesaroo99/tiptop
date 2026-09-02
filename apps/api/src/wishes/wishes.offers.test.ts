import { config } from "dotenv";
import { resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";

config({ path: resolve(__dirname, "../../.env") });
const prisma = new PrismaClient();

describe("mes propositions d’envies (DB)", () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  it("sépare les offres reçues (sur mes envies) des offres envoyées (à d’autres)", async () => {
    const erica = await prisma.user.findUnique({ where: { username: "erica.sinclair" } });
    const cesar = await prisma.user.findUnique({ where: { username: "cesar_memoli" } });
    expect(erica && cesar).toBeTruthy();
    if (!erica || !cesar) return;

    const wish = await prisma.wish.create({
      data: { ownerId: erica.id, title: "E2E offre test", category: "GIFT", visibility: "PUBLIC" },
    });
    const offer = await prisma.wishOffer.create({
      data: { wishId: wish.id, fromUserId: cesar.id, message: "Avec plaisir", status: "SENT" },
    });

    const received = await prisma.wishOffer.findMany({ where: { wish: { ownerId: erica.id } } });
    const sent = await prisma.wishOffer.findMany({ where: { fromUserId: cesar.id } });
    expect(received.some((o) => o.id === offer.id)).toBe(true);
    expect(sent.some((o) => o.id === offer.id)).toBe(true);
    // Erica ne doit pas voir l’offre dans "sent" (elle ne l’a pas envoyée).
    const ericaSent = await prisma.wishOffer.findMany({ where: { fromUserId: erica.id } });
    expect(ericaSent.some((o) => o.id === offer.id)).toBe(false);

    await prisma.wishOffer.delete({ where: { id: offer.id } });
    await prisma.wish.delete({ where: { id: wish.id } });
  });
});
