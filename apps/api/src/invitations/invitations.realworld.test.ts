import { config } from "dotenv";
import { resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { evaluateInvite, isCurrentlyAvailable } from "@tiptop/domain";

config({ path: resolve(__dirname, "../../.env") });
const prisma = new PrismaClient();

describe("monde réel (DB)", () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  it("ne liste que les personnes encore disponibles", async () => {
    const erica = await prisma.user.findUnique({
      where: { username: "erica.sinclair" },
      include: { profile: true },
    });
    expect(erica?.profile).toBeTruthy();
    if (!erica?.profile) return;
    expect(
      isCurrentlyAvailable({
        availability: erica.profile.availability,
        availabilityUntil: erica.profile.availabilityUntil,
      }),
    ).toBe(true);
  });

  it("interdit une auto-invitation", async () => {
    const cesar = await prisma.user.findUnique({ where: { username: "cesar_memoli" } });
    const event = await prisma.event.findFirst({ where: { title: "Afterwork Bastos" } });
    expect(cesar && event).toBeTruthy();
    if (!cesar || !event) return;
    expect(
      evaluateInvite({
        inviterId: cesar.id,
        inviteeId: cesar.id,
        startsAt: event.startsAt,
        status: event.status,
        capacity: event.capacity,
        taken: 1,
        minAge: event.minAge,
        inviteeBirthDate: new Date("1994-03-12"),
        alreadyParticipating: false,
        priceXaf: event.priceXaf,
        payer: "FREE",
      }),
    ).toBe("INVITE_SELF");
    expect(
      evaluateInvite({
        inviterId: cesar.id,
        inviteeId: "erica",
        startsAt: event.startsAt,
        status: event.status,
        capacity: event.capacity,
        taken: 1,
        minAge: event.minAge,
        inviteeBirthDate: new Date("1996-07-22"),
        alreadyParticipating: false,
        priceXaf: event.priceXaf,
        payer: "HOST",
      }),
    ).toBe("OK");
  });
});
