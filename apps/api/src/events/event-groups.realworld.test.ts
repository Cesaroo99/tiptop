import { config } from "dotenv";
import { resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaService } from "../prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { EventGroupsService } from "./groups.service";

config({ path: resolve(__dirname, "../../.env") });

describe("groupes de participants — accept / leave / admin", () => {
  const prisma = new PrismaService();
  const groups = new EventGroupsService(prisma, new NotificationsService(prisma));
  let eventId = "";
  let groupId = "";
  let cesarId = "";
  let ericaId = "";

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
        title: "E2E groupes test",
        city: "Yaoundé",
        startsAt: new Date(Date.now() + 2 * 3600_000),
        allowGroups: true,
        participants: {
          create: [
            { userId: cesar.id, status: "HOST" },
            { userId: erica.id, status: "INTERESTED" },
          ],
        },
      },
    });
    eventId = event.id;
    const created = await groups.create(cesar.id, event.id, "Voiture A");
    groupId = created.id;
  });

  afterAll(async () => {
    if (eventId) {
      const group = await prisma.eventGroup.findFirst({ where: { eventId } });
      if (group?.conversationId) {
        await prisma.conversation.deleteMany({ where: { id: group.conversationId } });
      }
      await prisma.eventGroup.deleteMany({ where: { eventId } });
      await prisma.notification.deleteMany({ where: { entityId: eventId } });
      await prisma.eventParticipant.deleteMany({ where: { eventId } });
      await prisma.event.delete({ where: { id: eventId } }).catch(() => undefined);
    }
    await prisma.$disconnect();
  });

  it("invite, accepte, admin, quitte", async () => {
    if (!eventId) return;
    await groups.invite(cesarId, eventId, groupId, ericaId);
    const invited = await groups.list(ericaId, eventId);
    expect(invited.items[0]?.viewerStatus).toBe("INVITED");
    expect(invited.items[0]?.canRespond).toBe(true);

    const joined = await groups.accept(ericaId, eventId, groupId);
    expect(joined.viewerStatus).toBe("JOINED");
    expect(joined.canLeave).toBe(true);

    const promoted = await groups.setAdmin(cesarId, eventId, groupId, ericaId, true);
    expect(promoted.members.find((m) => m.id === ericaId)?.role).toBe("ADMIN");

    const left = await groups.leave(ericaId, eventId, groupId);
    expect(left.viewerStatus).toBe("LEFT");
    expect(left.canLeave).toBe(false);
  });

  it("le créateur ne quitte pas son groupe", async () => {
    if (!eventId) return;
    await expect(groups.leave(cesarId, eventId, groupId)).rejects.toThrow();
  });
});
