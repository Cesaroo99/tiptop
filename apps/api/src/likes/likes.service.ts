import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
} from "@nestjs/common";
import { pickUnitForLike } from "@tiptop/domain";
import { PrismaService } from "../prisma.service";
import { NotificationsService } from "../notifications/notifications.service";

type LockedUnit = {
  id: string;
  ownerId: string;
  source: string;
  toUserId: string | null;
};

@Injectable()
export class LikesService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(NotificationsService) private readonly notifications: NotificationsService,
  ) {}

  async preview(ownerId: string, toUserId: string) {
    if (ownerId === toUserId) throw new BadRequestException({ code: "LIKE_SELF" });
    const units = await this.loadUnits(ownerId);
    const already = units.some((u) => u.toUserId === toUserId);
    const free = units.filter((u) => u.toUserId === null).length;
    let wouldTransferFrom: string | null = null;
    try {
      const plan = pickUnitForLike(
        units.map((u) => ({
          id: u.id,
          ownerId: u.ownerId,
          source: "free",
          activeAllocationUserId: u.toUserId,
        })),
        toUserId,
        ownerId,
      );
      wouldTransferFrom = plan.fromBeneficiaryId;
    } catch {
      /* already or no units */
    }
    const fromUser = wouldTransferFrom
      ? await this.prisma.user.findUnique({
          where: { id: wouldTransferFrom },
          select: { id: true, firstName: true, lastName: true, username: true },
        })
      : null;
    return { alreadyLiked: already, availableUnits: free, wouldTransferFrom: fromUser };
  }

  async like(ownerId: string, toUserId: string, confirmTransfer: boolean) {
    if (ownerId === toUserId) throw new BadRequestException({ code: "LIKE_SELF" });
    const target = await this.prisma.user.findUnique({ where: { id: toUserId } });
    if (!target) throw new BadRequestException({ code: "USER_NOT_FOUND" });

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "LikeUnit" WHERE "ownerId" = ${ownerId} FOR UPDATE`;
      const units = await this.lockUnits(tx, ownerId);
      const mapped = units.map((u) => ({
        id: u.id,
        ownerId: u.ownerId,
        source: "free" as const,
        activeAllocationUserId: u.toUserId,
      }));
      let plan;
      try {
        plan = pickUnitForLike(mapped, toUserId, ownerId);
      } catch (e) {
        const code = e instanceof Error ? e.message : "LIKE_ERROR";
        if (code === "LIKE_ALREADY_ON_TARGET") throw new ConflictException({ code });
        throw new BadRequestException({ code });
      }
      if (plan.fromBeneficiaryId && !confirmTransfer) {
        throw new ConflictException({
          code: "LIKE_TRANSFER_REQUIRED",
          fromUserId: plan.fromBeneficiaryId,
        });
      }
      if (plan.fromBeneficiaryId) {
        await tx.likeAllocation.updateMany({
          where: { unitId: plan.unitId, releasedAt: null },
          data: { releasedAt: new Date() },
        });
      }
      await tx.likeAllocation.create({
        data: { unitId: plan.unitId, toUserId },
      });
      return plan;
    });

    await this.notifications.create({
      userId: toUserId,
      actorId: ownerId,
      type: "LIKE",
      entityType: "user",
      entityId: toUserId,
    });
    return { ok: true, transferredFrom: result.fromBeneficiaryId };
  }

  async unlike(ownerId: string, toUserId: string) {
    await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "LikeUnit" WHERE "ownerId" = ${ownerId} FOR UPDATE`;
      await tx.likeAllocation.updateMany({
        where: {
          releasedAt: null,
          toUserId,
          unit: { ownerId },
        },
        data: { releasedAt: new Date() },
      });
    });
    return { ok: true };
  }

  async statsFor(userId: string) {
    const now = Date.now();
    const hourAgo = new Date(now - 3600_000);
    const dayAgo = new Date(now - 86400_000);
    const monthAgo = new Date(now - 30 * 86400_000);
    const [active, hour, day, month] = await Promise.all([
      this.prisma.likeAllocation.count({ where: { toUserId: userId, releasedAt: null } }),
      this.prisma.likeAllocation.count({
        where: { toUserId: userId, allocatedAt: { gte: hourAgo } },
      }),
      this.prisma.likeAllocation.count({
        where: { toUserId: userId, allocatedAt: { gte: dayAgo } },
      }),
      this.prisma.likeAllocation.count({
        where: { toUserId: userId, allocatedAt: { gte: monthAgo } },
      }),
    ]);
    return { active, perHour: hour, perDay: day, perMonth: month };
  }

  async mine(ownerId: string) {
    const units = await this.loadUnits(ownerId);
    return {
      available: units.filter((u) => !u.toUserId).length,
      total: units.length,
      allocations: units
        .filter((u) => u.toUserId)
        .map((u) => ({ unitId: u.id, toUserId: u.toUserId })),
    };
  }

  private async loadUnits(ownerId: string): Promise<LockedUnit[]> {
    const units = await this.prisma.likeUnit.findMany({
      where: { ownerId },
      include: { allocations: { where: { releasedAt: null } } },
      orderBy: { createdAt: "asc" },
    });
    return units.map((u) => ({
      id: u.id,
      ownerId: u.ownerId,
      source: u.source,
      toUserId: u.allocations[0]?.toUserId ?? null,
    }));
  }

  private async lockUnits(
    tx: PrismaService,
    ownerId: string,
  ): Promise<LockedUnit[]> {
    const units = await tx.likeUnit.findMany({
      where: { ownerId },
      include: { allocations: { where: { releasedAt: null } } },
      orderBy: { createdAt: "asc" },
    });
    return units.map((u) => ({
      id: u.id,
      ownerId: u.ownerId,
      source: u.source,
      toUserId: u.allocations[0]?.toUserId ?? null,
    }));
  }
}
