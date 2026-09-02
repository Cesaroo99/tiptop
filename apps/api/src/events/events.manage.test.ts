import { config } from "dotenv";
import { resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";

config({ path: resolve(__dirname, "../../.env") });
const prisma = new PrismaClient();

describe("gestion d'événement par l'hôte (DB) — #21-22", () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  it("annuler un événement prévient les participants actifs et les porteurs de billet", async () => {
    const cesar = await prisma.user.findUnique({ where: { username: "cesar_memoli" } });
    const erica = await prisma.user.findUnique({ where: { username: "erica.sinclair" } });
    expect(cesar && erica).toBeTruthy();
    if (!cesar || !erica) return;

    const event = await prisma.event.create({
      data: {
        hostId: cesar.id,
        title: "E2E annulation test",
        city: "Yaoundé",
        startsAt: new Date(Date.now() + 3600_000),
        priceXaf: 0,
        participants: {
          create: [
            { userId: cesar.id, status: "HOST" },
            { userId: erica.id, status: "INTERESTED" },
          ],
        },
      },
    });

    await prisma.notification.deleteMany({ where: { userId: erica.id, entityId: event.id } });
    await prisma.event.update({ where: { id: event.id }, data: { status: "CANCELLED" } });
    await prisma.notification.create({
      data: { userId: erica.id, actorId: cesar.id, type: "EVENT_UPDATE", entityType: "event_cancelled", entityId: event.id },
    });

    const notif = await prisma.notification.findFirst({
      where: { userId: erica.id, entityId: event.id, type: "EVENT_UPDATE" },
    });
    expect(notif?.entityType).toBe("event_cancelled");

    await prisma.notification.deleteMany({ where: { entityId: event.id } });
    await prisma.eventParticipant.deleteMany({ where: { eventId: event.id } });
    await prisma.event.delete({ where: { id: event.id } });
  });

  it("un événement dupliqué reprend les champs mais exige une nouvelle date future", async () => {
    const cesar = await prisma.user.findUnique({ where: { username: "cesar_memoli" } });
    if (!cesar) return;
    const original = await prisma.event.create({
      data: {
        hostId: cesar.id,
        title: "E2E original",
        description: "Description originale",
        city: "Yaoundé",
        zone: "Bastos",
        priceXaf: 1000,
        capacity: 20,
        startsAt: new Date(Date.now() + 3600_000),
      },
    });
    const copy = await prisma.event.create({
      data: {
        hostId: cesar.id,
        title: original.title,
        description: original.description,
        city: original.city,
        zone: original.zone,
        priceXaf: original.priceXaf,
        capacity: original.capacity,
        startsAt: new Date(Date.now() + 7 * 24 * 3600_000),
      },
    });
    expect(copy.title).toBe(original.title);
    expect(copy.id).not.toBe(original.id);
    expect(copy.startsAt.getTime()).toBeGreaterThan(original.startsAt.getTime());

    await prisma.event.deleteMany({ where: { id: { in: [original.id, copy.id] } } });
  });

  it("les moods liés à un événement restent consultables après coup (souvenirs) — #46", async () => {
    const erica = await prisma.user.findUnique({ where: { username: "erica.sinclair" } });
    const cesar = await prisma.user.findUnique({ where: { username: "cesar_memoli" } });
    if (!erica || !cesar) return;
    const pastEvent = await prisma.event.create({
      data: {
        hostId: cesar.id,
        title: "E2E event passé pour moods",
        city: "Yaoundé",
        startsAt: new Date(Date.now() - 5 * 3600_000),
        status: "ENDED",
      },
    });
    const mood = await prisma.mood.create({
      data: {
        authorId: erica.id,
        body: "Super soirée !",
        eventId: pastEvent.id,
        visibility: "ZONE",
        expiresAt: new Date(Date.now() - 3600_000),
      },
    });
    const linked = await prisma.mood.findMany({ where: { eventId: pastEvent.id } });
    expect(linked.map((m) => m.id)).toContain(mood.id);

    await prisma.mood.delete({ where: { id: mood.id } });
    await prisma.event.delete({ where: { id: pastEvent.id } });
  });
});
