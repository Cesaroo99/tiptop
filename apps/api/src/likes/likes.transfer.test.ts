import { config } from "dotenv";
import { resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { pickUnitForLike } from "@tiptop/domain";

config({ path: resolve(__dirname, "../../.env") });
const prisma = new PrismaClient();

describe("like transfer (DB)", () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  it("n'autorise qu'une allocation active par unité", async () => {
    const owner = await prisma.user.findUnique({ where: { username: "mbelle.junior" } });
    const erica = await prisma.user.findUnique({ where: { username: "erica.sinclair" } });
    const cesar = await prisma.user.findUnique({ where: { username: "cesar_memoli" } });
    expect(owner && erica && cesar).toBeTruthy();
    if (!owner || !erica || !cesar) return;

    await prisma.likeAllocation.updateMany({
      where: { unit: { ownerId: owner.id }, releasedAt: null },
      data: { releasedAt: new Date() },
    });

    const units = await prisma.likeUnit.findMany({
      where: { ownerId: owner.id },
      include: { allocations: { where: { releasedAt: null } } },
      orderBy: { createdAt: "asc" },
    });
    const mapped = units.map((u) => ({
      id: u.id,
      ownerId: u.ownerId,
      source: "free" as const,
      activeAllocationUserId: u.allocations[0]?.toUserId ?? null,
    }));
    const first = pickUnitForLike(mapped, cesar.id, owner.id);
    await prisma.likeAllocation.create({ data: { unitId: first.unitId, toUserId: cesar.id } });

    const units2 = await prisma.likeUnit.findMany({
      where: { ownerId: owner.id },
      include: { allocations: { where: { releasedAt: null } } },
      orderBy: { createdAt: "asc" },
    });
    const mapped2 = units2.map((u) => ({
      id: u.id,
      ownerId: u.ownerId,
      source: "free" as const,
      activeAllocationUserId: u.allocations[0]?.toUserId ?? null,
    }));
    const second = pickUnitForLike(mapped2, erica.id, owner.id);
    expect(second.fromBeneficiaryId).toBe(cesar.id);
    if (second.fromBeneficiaryId) {
      await prisma.likeAllocation.updateMany({
        where: { unitId: second.unitId, releasedAt: null },
        data: { releasedAt: new Date() },
      });
    }
    await prisma.likeAllocation.create({ data: { unitId: second.unitId, toUserId: erica.id } });

    const activeOnUnit = await prisma.likeAllocation.count({
      where: { unitId: second.unitId, releasedAt: null },
    });
    expect(activeOnUnit).toBe(1);
  });
});
