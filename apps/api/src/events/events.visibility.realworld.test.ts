import { config } from "dotenv";
import { resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaService } from "../prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { EventsService } from "./events.service";

config({ path: resolve(__dirname, "../../.env") });

describe("visibilité des personnes liées à un événement", () => {
  const prisma = new PrismaService();
  const events = new EventsService(prisma, new NotificationsService(prisma));
  let eventId = "";
  let cesarId = "";
  let ericaId = "";
  let mireilleId = "";

  beforeAll(async () => {
    await prisma.$connect();
    const cesar = await prisma.user.findUnique({ where: { username: "cesar_memoli" } });
    const erica = await prisma.user.findUnique({ where: { username: "erica.sinclair" } });
    const mireille = await prisma.user.findUnique({ where: { username: "mireille.owona" } });
    expect(cesar && erica && mireille).toBeTruthy();
    if (!cesar || !erica || !mireille) return;
    cesarId = cesar.id;
    ericaId = erica.id;
    mireilleId = mireille.id;
    const event = await prisma.event.create({
      data: {
        hostId: cesar.id,
        title: "E2E visibilité personnes",
        city: "Yaoundé",
        startsAt: new Date(Date.now() + 4 * 3600_000),
        participants: {
          create: [
            { userId: cesar.id, status: "HOST", showOnProfile: true },
            { userId: erica.id, status: "INTERESTED", showOnProfile: false },
            { userId: mireille.id, status: "RESERVED", showOnProfile: true },
          ],
        },
      },
    });
    eventId = event.id;
  });

  afterAll(async () => {
    if (eventId) {
      await prisma.eventParticipant.deleteMany({ where: { eventId } });
      await prisma.post.deleteMany({ where: { eventId } });
      await prisma.event.delete({ where: { id: eventId } }).catch(() => undefined);
    }
    await prisma.$disconnect();
  });

  it("masque les participations non acceptées, sauf pour soi et l’hôte", async () => {
    if (!eventId) return;
    const asCesar = await events.get(cesarId, eventId);
    expect(asCesar.people.map((p: { id: string }) => p.id).sort()).toEqual([cesarId, mireilleId].sort());
    expect(asCesar.people.find((p: { id: string }) => p.id === ericaId)).toBeUndefined();
    expect(asCesar.viewerShowOnProfile).toBe(true);

    const asErica = await events.get(ericaId, eventId);
    expect(asErica.people.map((p: { id: string }) => p.id).sort()).toEqual([cesarId, ericaId, mireilleId].sort());
    expect(asErica.viewerShowOnProfile).toBe(false);

    const asMireille = await events.get(mireilleId, eventId);
    expect(asMireille.people.map((p: { id: string }) => p.id).sort()).toEqual([cesarId, mireilleId].sort());
    expect(asMireille.people.find((p: { id: string }) => p.id === ericaId)).toBeUndefined();
    expect(asMireille.viewerShowOnProfile).toBe(true);
  });

  it("rendre visible une participation la montre aux autres", async () => {
    if (!eventId) return;
    await events.setShowOnProfile(ericaId, eventId, true);
    const asMireille = await events.get(mireilleId, eventId);
    expect(asMireille.people.map((p: { id: string }) => p.id).sort()).toEqual([cesarId, ericaId, mireilleId].sort());
  });
});
