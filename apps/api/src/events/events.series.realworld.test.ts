import { config } from "dotenv";
import { resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { dedupeSeriesOccurrences, occurrenceCount, shiftOccurrence } from "@tiptop/domain";

config({ path: resolve(__dirname, "../../.env") });
const prisma = new PrismaClient();

describe("séries d’événements (DB)", () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  it("matérielise 8 dates hebdo et ne garde que la prochaine en découverte", async () => {
    const cesar = await prisma.user.findUnique({ where: { username: "cesar_memoli" } });
    expect(cesar).toBeTruthy();
    if (!cesar) return;

    const startsAt = new Date(Date.now() + 2 * 24 * 3600_000);
    startsAt.setHours(18, 0, 0, 0);
    const template = await prisma.event.create({
      data: {
        hostId: cesar.id,
        title: "Afterwork série test",
        city: "Yaoundé",
        zone: "Bastos",
        startsAt,
        recurrence: "WEEKLY",
        participants: { create: { userId: cesar.id, status: "HOST" } },
      },
    });
    const extra = occurrenceCount("WEEKLY") - 1;
    const created = [template];
    for (let i = 1; i <= extra; i += 1) {
      created.push(
        await prisma.event.create({
          data: {
            hostId: cesar.id,
            title: template.title,
            city: template.city,
            zone: template.zone,
            startsAt: shiftOccurrence(template.startsAt, "WEEKLY", i),
            recurrence: "WEEKLY",
            seriesId: template.id,
            participants: { create: { userId: cesar.id, status: "HOST" } },
          },
        }),
      );
    }
    expect(created).toHaveLength(8);

    const rows = await prisma.event.findMany({
      where: { OR: [{ id: template.id }, { seriesId: template.id }] },
      orderBy: { startsAt: "asc" },
    });
    expect(rows).toHaveLength(8);
    const kept = dedupeSeriesOccurrences(rows);
    expect(kept).toHaveLength(1);
    expect(kept[0]?.id).toBe(template.id);

    await prisma.event.deleteMany({ where: { OR: [{ id: template.id }, { seriesId: template.id }] } });
  });
});
