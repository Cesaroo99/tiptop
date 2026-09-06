import { config } from "dotenv";
import { resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaService } from "../prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { LikesService } from "../likes/likes.service";
import { BookingService } from "./booking.service";

config({ path: resolve(__dirname, "../../.env") });

describe("gestion organisateur — liste et validation", () => {
  const prisma = new PrismaService();
  const notifications = new NotificationsService(prisma);
  const booking = new BookingService(prisma, notifications, new LikesService(prisma, notifications));
  let eventId = "";
  let cesarId = "";
  let ericaId = "";
  let ticketId = "";

  beforeAll(async () => {
    await prisma.$connect();
    const cesar = await prisma.user.findUnique({ where: { username: "cesar_memoli" } });
    const erica = await prisma.user.findUnique({ where: { username: "erica.sinclair" } });
    expect(cesar && erica).toBeTruthy();
    if (!cesar || !erica) return;
    cesarId = cesar.id;
    ericaId = erica.id;
    const event = await prisma.event.create({
      data: {
        hostId: cesar.id,
        title: "E2E host manage",
        city: "Yaoundé",
        startsAt: new Date(Date.now() + 20 * 60_000),
        priceXaf: 0,
        requiresReservation: true,
        participants: {
          create: [
            { userId: cesar.id, status: "HOST" },
            { userId: erica.id, status: "CONFIRMED", showOnProfile: false },
          ],
        },
      },
    });
    eventId = event.id;
    const reservation = await prisma.reservation.create({
      data: {
        eventId: event.id,
        bookerId: erica.id,
        status: "CONFIRMED",
        seats: 1,
        amountXaf: 0,
        tickets: { create: [{ eventId: event.id, holderId: erica.id, status: "CONFIRMED" }] },
      },
      include: { tickets: true },
    });
    ticketId = reservation.tickets[0]!.id;
  });

  afterAll(async () => {
    if (eventId) {
      await prisma.ticket.deleteMany({ where: { eventId } });
      await prisma.reservation.deleteMany({ where: { eventId } });
      await prisma.eventParticipant.deleteMany({ where: { eventId } });
      await prisma.event.delete({ where: { id: eventId } }).catch(() => undefined);
    }
    await prisma.$disconnect();
  });

  it("l’hôte voit tout le monde, même masqué du profil public", async () => {
    if (!eventId) return;
    const data = await booking.hostTickets(cesarId, eventId);
    expect(data.people.map((p) => p.id)).toContain(ericaId);
    expect(data.people.find((p) => p.id === ericaId)?.paid).toBe(true);
    expect(data.people.find((p) => p.id === cesarId)).toBeUndefined();
    expect(data.counts.reserved).toBe(1);
  });

  it("refuse le scan à un participant", async () => {
    if (!eventId || !ticketId) return;
    await expect(booking.consume(ericaId, ticketId)).rejects.toMatchObject({
      response: { code: "NOT_HOST" },
    });
    await expect(booking.scan(ericaId, "fake-token", eventId)).rejects.toBeTruthy();
  });

  it("consomme le ticket et le place en validé", async () => {
    if (!eventId || !ticketId) return;
    const res = await booking.consume(cesarId, ticketId);
    expect(res.ok).toBe(true);
    expect(res.holder?.firstName).toBeTruthy();
    const data = await booking.hostTickets(cesarId, eventId);
    const erica = data.people.find((p) => p.id === ericaId);
    expect(erica?.ticketStatus).toBe("CONSUMED");
    expect(erica?.status).toBe("PRESENT");
    expect(data.counts.validated).toBe(1);
  });
});
