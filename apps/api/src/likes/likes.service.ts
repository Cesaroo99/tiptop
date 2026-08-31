import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
} from "@nestjs/common";
import {
  getLikePack,
  likeCreditAllowed,
  LIKE_PACKS,
  mockCharge,
  needsLikePurchase,
  pickUnitForLike,
  type PaymentProviderKind,
} from "@tiptop/domain";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma.service";
import { NotificationsService } from "../notifications/notifications.service";

type LockedUnit = {
  id: string;
  ownerId: string;
  source: string;
  toUserId: string | null;
};

const personSelect = { id: true, firstName: true, lastName: true, username: true } as const;

@Injectable()
export class LikesService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(NotificationsService) private readonly notifications: NotificationsService,
  ) {}

  packs() {
    return { items: [...LIKE_PACKS] };
  }

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
          select: personSelect,
        })
      : null;
    return {
      alreadyLiked: already,
      availableUnits: free,
      totalUnits: units.length,
      needsPurchase: needsLikePurchase(units.length),
      wouldTransferFrom: fromUser,
    };
  }

  async like(ownerId: string, toUserId: string, confirmTransfer: boolean) {
    if (ownerId === toUserId) throw new BadRequestException({ code: "LIKE_SELF" });
    const target = await this.prisma.user.findUnique({ where: { id: toUserId } });
    if (!target) throw new BadRequestException({ code: "USER_NOT_FOUND" });

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "LikeUnit" WHERE "ownerId" = ${ownerId} FOR UPDATE`;
      const units = await this.lockUnits(tx, ownerId);
      if (needsLikePurchase(units.length)) {
        throw new BadRequestException({ code: "LIKE_NO_UNITS" });
      }
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
        if (code === "LIKE_NO_UNITS") throw new BadRequestException({ code });
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
        await tx.likeTransaction.create({
          data: {
            userId: ownerId,
            kind: "RELEASE",
            unitId: plan.unitId,
            toUserId: plan.fromBeneficiaryId,
          },
        });
      }
      await tx.likeAllocation.create({
        data: { unitId: plan.unitId, toUserId },
      });
      await tx.likeTransaction.create({
        data: {
          userId: ownerId,
          kind: "ALLOCATE",
          unitId: plan.unitId,
          toUserId,
        },
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
      const active = await tx.likeAllocation.findMany({
        where: { releasedAt: null, toUserId, unit: { ownerId } },
        select: { unitId: true },
      });
      await tx.likeAllocation.updateMany({
        where: {
          releasedAt: null,
          toUserId,
          unit: { ownerId },
        },
        data: { releasedAt: new Date() },
      });
      if (active.length) {
        await tx.likeTransaction.createMany({
          data: active.map((row) => ({
            userId: ownerId,
            kind: "RELEASE" as const,
            unitId: row.unitId,
            toUserId,
          })),
        });
      }
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

  async wallet(ownerId: string) {
    const units = await this.prisma.likeUnit.findMany({
      where: { ownerId },
      include: {
        allocations: {
          where: { releasedAt: null },
          include: { toUser: { select: personSelect } },
        },
      },
      orderBy: { createdAt: "asc" },
    });
    const history = await this.prisma.likeTransaction.findMany({
      where: { userId: ownerId },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        toUser: { select: personSelect },
        purchase: { select: { packCode: true, units: true, amountXaf: true } },
      },
    });
    const purchases = await this.prisma.likePurchase.findMany({
      where: { userId: ownerId },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { payment: { select: { id: true, status: true, provider: true, amountXaf: true } } },
    });
    const available = units.filter((u) => u.allocations.length === 0).length;
    return {
      available,
      total: units.length,
      packs: [...LIKE_PACKS],
      allocations: units
        .filter((u) => u.allocations[0])
        .map((u) => ({
          unitId: u.id,
          source: u.source,
          toUser: u.allocations[0]!.toUser,
        })),
      history: history.map((h) => ({
        id: h.id,
        kind: h.kind,
        delta: h.delta,
        createdAt: h.createdAt.toISOString(),
        toUser: h.toUser,
        packCode: h.purchase?.packCode ?? null,
        units: h.purchase?.units ?? h.delta,
      })),
      purchases: purchases.map((p) => ({
        id: p.id,
        packCode: p.packCode,
        units: p.units,
        amountXaf: p.amountXaf,
        createdAt: p.createdAt.toISOString(),
        paymentStatus: p.payment?.status ?? null,
        provider: p.payment?.provider ?? null,
      })),
    };
  }

  async purchase(
    userId: string,
    input: { packCode: string; provider: PaymentProviderKind; fail?: boolean; idempotencyKey: string },
  ) {
    let pack;
    try {
      pack = getLikePack(input.packCode);
    } catch {
      throw new BadRequestException({ code: "LIKE_PACK_INVALID" });
    }

    const existing = await this.prisma.payment.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
      include: { likePurchase: true },
    });
    if (existing) {
      if (existing.kind !== "LIKE_PACK" || existing.userId !== userId) {
        throw new ConflictException({ code: "IDEMPOTENCY_KIND_MISMATCH" });
      }
      return this.mapPurchase(existing);
    }

    const charge = mockCharge({ provider: input.provider, fail: input.fail });

    try {
      const payment = await this.prisma.$transaction(async (tx) => {
        const purchase = await tx.likePurchase.create({
          data: {
            userId,
            packCode: pack.code,
            units: pack.units,
            amountXaf: pack.amountXaf,
          },
        });
        const row = await tx.payment.create({
          data: {
            kind: "LIKE_PACK",
            userId,
            likePurchaseId: purchase.id,
            provider: input.provider,
            status: charge.status === "SUCCEEDED" ? "SUCCEEDED" : "FAILED",
            amountXaf: pack.amountXaf,
            idempotencyKey: input.idempotencyKey,
            providerRef: `mock_${input.provider}_${Date.now()}`,
          },
          include: { likePurchase: true },
        });
        if (row.status === "SUCCEEDED" && row.likePurchase) {
          await this.creditPurchase(tx, userId, row.likePurchase);
        }
        return row;
      });

      if (payment.status === "SUCCEEDED" && payment.likePurchaseId) {
        await this.notifications.create({
          userId,
          type: "PAYMENT",
          entityType: "like_purchase",
          entityId: payment.likePurchaseId,
        });
      }
      return this.mapPurchase(payment);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        const dup = await this.prisma.payment.findUnique({
          where: { idempotencyKey: input.idempotencyKey },
          include: { likePurchase: true },
        });
        if (dup) return this.mapPurchase(dup);
      }
      throw e;
    }
  }

  /** Crédit idempotent après webhook SUCCEEDED (ledger likes ≠ ledger XAF). */
  async fulfillPaidPurchase(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { likePurchase: true },
    });
    if (!payment || payment.kind !== "LIKE_PACK" || !payment.likePurchase) {
      return { ok: false, code: "NOT_LIKE_PACK" };
    }
    const already = await this.prisma.likeTransaction.findFirst({
      where: { purchaseId: payment.likePurchase.id, kind: "PURCHASE" },
    });
    const gate = likeCreditAllowed(payment.status, Boolean(already));
    if (!gate.ok) return { ok: false, code: gate.reason, duplicate: already != null };
    await this.prisma.$transaction(async (tx) => {
      await this.creditPurchase(tx, payment.userId, payment.likePurchase!);
    });
    return { ok: true, duplicate: false };
  }

  private async creditPurchase(
    tx: Prisma.TransactionClient,
    userId: string,
    purchase: { id: string; units: number },
  ) {
    const already = await tx.likeTransaction.findFirst({
      where: { purchaseId: purchase.id, kind: "PURCHASE" },
    });
    const gate = likeCreditAllowed("SUCCEEDED", Boolean(already));
    if (!gate.ok) return;
    await tx.likeUnit.createMany({
      data: Array.from({ length: purchase.units }, () => ({
        ownerId: userId,
        source: "PURCHASED" as const,
        purchaseId: purchase.id,
      })),
    });
    await tx.likeTransaction.create({
      data: {
        userId,
        kind: "PURCHASE",
        delta: purchase.units,
        purchaseId: purchase.id,
      },
    });
  }

  private mapPurchase(payment: {
    id: string;
    status: string;
    provider: string;
    amountXaf: number;
    likePurchase: { id: string; packCode: string; units: number; amountXaf: number } | null;
  }) {
    return {
      paymentId: payment.id,
      paymentStatus: payment.status,
      provider: payment.provider,
      amountXaf: payment.amountXaf,
      credited: payment.status === "SUCCEEDED",
      purchase: payment.likePurchase
        ? {
            id: payment.likePurchase.id,
            packCode: payment.likePurchase.packCode,
            units: payment.likePurchase.units,
            amountXaf: payment.likePurchase.amountXaf,
          }
        : null,
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
    tx: Prisma.TransactionClient,
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
