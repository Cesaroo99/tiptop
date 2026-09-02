import { config } from "dotenv";
import { resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { canLeaveReview, eventEndedAt, reviewOpensAt } from "@tiptop/domain";

config({ path: resolve(__dirname, "../../.env") });
const prisma = new PrismaClient();

describe("avis (DB)", () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  it("unicité un avis par personne et par sortie", async () => {
    const event = await prisma.event.findFirst({ where: { title: "Rooftop Damas (passée)" } });
    const erica = await prisma.user.findUnique({ where: { username: "erica.sinclair" } });
    expect(event && erica).toBeTruthy();
    if (!event || !erica) return;
    await expect(
      prisma.eventReview.create({
        data: { eventId: event.id, authorId: erica.id, body: "doublon" },
      }),
    ).rejects.toMatchObject({ code: "P2002" });
  });

  it("César peut laisser un avis sur la sortie passée (fenêtre ouverte)", async () => {
    const event = await prisma.event.findFirst({ where: { title: "Rooftop Damas (passée)" } });
    const cesar = await prisma.user.findUnique({ where: { username: "cesar_memoli" } });
    expect(event && cesar).toBeTruthy();
    if (!event || !cesar) return;
    const existing = await prisma.eventReview.findUnique({
      where: { eventId_authorId: { eventId: event.id, authorId: cesar.id } },
    });
    const ticket = await prisma.ticket.findFirst({
      where: { eventId: event.id, holderId: cesar.id, status: "CONSUMED" },
    });
    const opensAt = reviewOpensAt(eventEndedAt(event.startsAt, event.endsAt));
    expect(
      canLeaveReview({
        isHost: event.hostId === cesar.id,
        attended: Boolean(ticket),
        alreadyReviewed: Boolean(existing),
        eventStatus: event.status,
        opensAt,
      }),
    ).toBe("OK");
  });
});
