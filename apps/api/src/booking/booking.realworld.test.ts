import { config } from "dotenv";
import { resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { applyWebhook } from "@tiptop/domain";

config({ path: resolve(__dirname, "../../.env") });
const prisma = new PrismaClient();

describe("booking (DB)", () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  it("interdit une deuxième réservation self active", async () => {
    const cesar = await prisma.user.findUnique({ where: { username: "cesar_memoli" } });
    const event = await prisma.event.findFirst({ where: { title: "Afterwork Bastos" } });
    expect(cesar && event).toBeTruthy();
    if (!cesar || !event) return;

    const existing = await prisma.reservation.findFirst({
      where: {
        eventId: event.id,
        bookerId: cesar.id,
        invitationId: null,
        status: { in: ["DRAFT", "AWAITING_PAYMENT", "CONFIRMED"] },
      },
    });

    const payload = {
      eventId: event.id,
      bookerId: cesar.id,
      status: "AWAITING_PAYMENT" as const,
      seats: 1,
      amountXaf: 2500,
    };

    if (existing) {
      await expect(prisma.reservation.create({ data: payload })).rejects.toMatchObject({ code: "P2002" });
      return;
    }

    const created = await prisma.reservation.create({ data: payload });
    try {
      await expect(prisma.reservation.create({ data: payload })).rejects.toMatchObject({ code: "P2002" });
    } finally {
      await prisma.reservation.delete({ where: { id: created.id } });
    }
  });

  it("ignore un webhook déjà terminal", () => {
    expect(applyWebhook("SUCCEEDED", "FAILED")).toEqual({ applied: false, status: "SUCCEEDED" });
    expect(applyWebhook("PENDING", "SUCCEEDED")).toEqual({ applied: true, status: "SUCCEEDED" });
    expect(applyWebhook("FAILED", "SUCCEEDED")).toEqual({ applied: false, status: "FAILED" });
  });

  it("ne consomme un ticket qu’une fois (UPDATE atomique)", async () => {
    const cesar = await prisma.user.findUnique({ where: { username: "cesar_memoli" } });
    const event = await prisma.event.findFirst({ where: { title: "Soirée Black & White" } });
    expect(cesar && event).toBeTruthy();
    if (!cesar || !event) return;

    const reservation = await prisma.reservation.create({
      data: {
        eventId: event.id,
        bookerId: cesar.id,
        status: "CONFIRMED",
        seats: 1,
        amountXaf: 0,
        tickets: {
          create: { eventId: event.id, holderId: cesar.id, status: "CONFIRMED" },
        },
      },
      include: { tickets: true },
    });
    const ticketId = reservation.tickets[0]!.id;

    try {
      const first = await prisma.$queryRaw<Array<{ id: string }>>`
        UPDATE "Ticket"
        SET status = 'CONSUMED'::"TicketStatus", "consumedAt" = NOW()
        WHERE id = ${ticketId} AND status = 'CONFIRMED'::"TicketStatus" AND "consumedAt" IS NULL
        RETURNING id
      `;
      const second = await prisma.$queryRaw<Array<{ id: string }>>`
        UPDATE "Ticket"
        SET status = 'CONSUMED'::"TicketStatus", "consumedAt" = NOW()
        WHERE id = ${ticketId} AND status = 'CONFIRMED'::"TicketStatus" AND "consumedAt" IS NULL
        RETURNING id
      `;
      expect(first).toHaveLength(1);
      expect(second).toHaveLength(0);
    } finally {
      await prisma.reservation.delete({ where: { id: reservation.id } });
    }
  });
});
