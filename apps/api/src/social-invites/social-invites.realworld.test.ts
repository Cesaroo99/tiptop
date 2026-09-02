import { config } from "dotenv";
import { resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { canRespondSocialInvite, canSendSocialInvite } from "@tiptop/domain";

config({ path: resolve(__dirname, "../../.env") });
const prisma = new PrismaClient();

describe("invitation sociale (DB)", () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  it("crée, refuse une double invitation en attente, accepte et ouvre une conversation", async () => {
    const cesar = await prisma.user.findUnique({ where: { username: "cesar_memoli" } });
    const erica = await prisma.user.findUnique({ where: { username: "erica.sinclair" } });
    expect(cesar && erica).toBeTruthy();
    if (!cesar || !erica) return;

    await prisma.socialInvite.deleteMany({ where: { inviterId: cesar.id, inviteeId: erica.id } });

    const invite = await prisma.socialInvite.create({
      data: {
        inviterId: cesar.id,
        inviteeId: erica.id,
        context: "RESTAURANT",
        label: "Sushi House",
        expiresAt: new Date(Date.now() + 72 * 3600_000),
      },
    });
    expect(invite.status).toBe("SENT");

    const pending = await prisma.socialInvite.findFirst({
      where: { inviterId: cesar.id, inviteeId: erica.id, status: "SENT" },
    });
    const gate = canSendSocialInvite({ sentTodayCount: 1, hasPendingToSameInvitee: Boolean(pending) });
    expect(gate).toBe("ALREADY_PENDING");

    const respond = canRespondSocialInvite({
      status: invite.status,
      expiresAt: invite.expiresAt,
      inviteeId: invite.inviteeId,
      actorId: erica.id,
    });
    expect(respond).toBe("OK");

    await prisma.socialInvite.update({
      where: { id: invite.id },
      data: { status: "ACCEPTED", respondedAt: new Date() },
    });
    const updated = await prisma.socialInvite.findUnique({ where: { id: invite.id } });
    expect(updated?.status).toBe("ACCEPTED");

    await prisma.socialInvite.delete({ where: { id: invite.id } });
  });

  it("une invitation liée à une envie reste traçable jusqu’à la suppression de l’envie (SetNull)", async () => {
    const erica = await prisma.user.findUnique({ where: { username: "erica.sinclair" } });
    const cesar = await prisma.user.findUnique({ where: { username: "cesar_memoli" } });
    if (!erica || !cesar) return;
    const wish = await prisma.wish.create({
      data: { ownerId: erica.id, title: "E2E karting", category: "SPORT", visibility: "PUBLIC" },
    });
    const invite = await prisma.socialInvite.create({
      data: {
        inviterId: cesar.id,
        inviteeId: erica.id,
        context: "WISH",
        label: wish.title,
        wishId: wish.id,
        expiresAt: new Date(Date.now() + 72 * 3600_000),
      },
    });
    await prisma.wish.delete({ where: { id: wish.id } });
    const after = await prisma.socialInvite.findUnique({ where: { id: invite.id } });
    expect(after?.wishId).toBeNull();
    await prisma.socialInvite.delete({ where: { id: invite.id } });
  });
});
