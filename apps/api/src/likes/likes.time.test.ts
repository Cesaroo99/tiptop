import { config } from "dotenv";
import { resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { formatLikeDuration, sumLikeSeconds } from "@tiptop/domain";

config({ path: resolve(__dirname, "../../.env") });
const prisma = new PrismaClient();

describe("like time (DB)", () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  it("Alice 40 min + César 10 min = 50 min sur une publication", async () => {
    const cesar = await prisma.user.findUnique({ where: { username: "cesar_memoli" } });
    const erica = await prisma.user.findUnique({ where: { username: "erica.sinclair" } });
    expect(cesar && erica).toBeTruthy();
    if (!cesar || !erica) return;
    const post = await prisma.post.findFirst({ where: { authorId: cesar.id } });
    expect(post).toBeTruthy();
    if (!post) return;

    const aliceUnit = await prisma.likeUnit.findFirst({ where: { ownerId: erica.id, source: "FREE" } });
    const cesarUnit = await prisma.likeUnit.findFirst({ where: { ownerId: cesar.id, source: "FREE" } });
    expect(aliceUnit && cesarUnit).toBeTruthy();
    if (!aliceUnit || !cesarUnit) return;

    await prisma.likePeriod.deleteMany({ where: { targetType: "POST", targetId: post.id } });

    const t0 = new Date("2026-09-01T10:00:00Z");
    const t40 = new Date("2026-09-01T10:40:00Z");
    const t30 = new Date("2026-09-01T10:30:00Z");

    await prisma.likePeriod.createMany({
      data: [
        {
          unitId: aliceUnit.id,
          actorId: erica.id,
          targetType: "POST",
          targetId: post.id,
          beneficiaryUserId: cesar.id,
          startedAt: t0,
          endedAt: t40,
          weight: 1,
        },
        {
          unitId: cesarUnit.id,
          actorId: cesar.id,
          targetType: "POST",
          targetId: post.id,
          beneficiaryUserId: cesar.id,
          startedAt: t30,
          endedAt: t40,
          weight: 1,
        },
      ],
    });

    const periods = await prisma.likePeriod.findMany({ where: { targetType: "POST", targetId: post.id } });
    const sum = sumLikeSeconds(
      periods.map((p) => ({ startedAt: p.startedAt, endedAt: p.endedAt, weight: p.weight })),
      t40,
    );
    expect(sum.totalSeconds).toBe(50 * 60);
    expect(formatLikeDuration(sum.totalSeconds, "fr")).toBe("50 min");

    await prisma.likePeriod.updateMany({
      where: { unitId: cesarUnit.id, targetId: post.id, endedAt: t40 },
      data: { endedAt: t40 },
    });
    const afterTransfer = await prisma.likePeriod.findMany({
      where: { targetType: "POST", targetId: post.id },
    });
    const kept = sumLikeSeconds(
      afterTransfer.map((p) => ({ startedAt: p.startedAt, endedAt: p.endedAt, weight: p.weight })),
      new Date("2026-09-01T11:00:00Z"),
    );
    expect(kept.historicalSeconds).toBe(50 * 60);

    await prisma.likePeriod.deleteMany({ where: { targetType: "POST", targetId: post.id } });
  });

  it("un like actif continue (startedAt dans le passé)", async () => {
    const cesar = await prisma.user.findUnique({ where: { username: "cesar_memoli" } });
    const erica = await prisma.user.findUnique({ where: { username: "erica.sinclair" } });
    if (!cesar || !erica) return;
    const unit = await prisma.likeUnit.findFirst({ where: { ownerId: erica.id, source: "FREE" } });
    if (!unit) return;
    await prisma.likePeriod.updateMany({ where: { unitId: unit.id, endedAt: null }, data: { endedAt: new Date() } });
    const started = new Date(Date.now() - 15 * 60_000);
    const row = await prisma.likePeriod.create({
      data: {
        unitId: unit.id,
        actorId: erica.id,
        targetType: "USER",
        targetId: cesar.id,
        beneficiaryUserId: cesar.id,
        startedAt: started,
        endedAt: null,
        weight: 1,
      },
    });
    const seconds = sumLikeSeconds([{ startedAt: row.startedAt, endedAt: null }], new Date()).totalSeconds;
    expect(seconds).toBeGreaterThanOrEqual(14 * 60);
    expect(seconds).toBeLessThan(17 * 60);
    await prisma.likePeriod.delete({ where: { id: row.id } });
  });
});
