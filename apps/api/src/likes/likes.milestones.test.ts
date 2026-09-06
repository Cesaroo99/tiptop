import { config } from "dotenv";
import { resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { crossedMilestones, DEFAULT_LIKE_MILESTONES } from "@tiptop/domain";

config({ path: resolve(__dirname, "../../.env") });
const prisma = new PrismaClient();

describe("paliers like-time (DB)", () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  it("n’enregistre un palier qu’une fois", async () => {
    const cesar = await prisma.user.findUnique({ where: { username: "cesar_memoli" } });
    expect(cesar).toBeTruthy();
    if (!cesar) return;
    const m = DEFAULT_LIKE_MILESTONES[0];
    await prisma.userMilestone.upsert({
      where: { userId_milestoneId: { userId: cesar.id, milestoneId: m.id } },
      create: { userId: cesar.id, milestoneId: m.id, notifiedAt: new Date() },
      update: {},
    });
    await expect(
      prisma.userMilestone.create({
        data: { userId: cesar.id, milestoneId: m.id },
      }),
    ).rejects.toMatchObject({ code: "P2002" });
    expect(crossedMilestones(3599, 3600).map((x) => x.id)).toEqual(["1h"]);
  });

  it("une unité n’a qu’une période active", async () => {
    const erica = await prisma.user.findUnique({ where: { username: "erica.sinclair" } });
    const cesar = await prisma.user.findUnique({ where: { username: "cesar_memoli" } });
    if (!erica || !cesar) return;
    const unit = await prisma.likeUnit.findFirst({ where: { ownerId: erica.id, source: "FREE" } });
    if (!unit) return;
    await prisma.likePeriod.updateMany({ where: { unitId: unit.id, endedAt: null }, data: { endedAt: new Date() } });
    await prisma.likePeriod.create({
      data: {
        unitId: unit.id,
        actorId: erica.id,
        targetType: "USER",
        targetId: cesar.id,
        beneficiaryUserId: cesar.id,
        startedAt: new Date(),
        weight: 1,
      },
    });
    await expect(
      prisma.likePeriod.create({
        data: {
          unitId: unit.id,
          actorId: erica.id,
          targetType: "USER",
          targetId: cesar.id,
          beneficiaryUserId: cesar.id,
          startedAt: new Date(),
          weight: 1,
        },
      }),
    ).rejects.toBeTruthy();
    await prisma.likePeriod.updateMany({ where: { unitId: unit.id, endedAt: null }, data: { endedAt: new Date() } });
  });
});
