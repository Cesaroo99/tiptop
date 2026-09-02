import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
} from "@nestjs/common";
import {
  likeProduction,
  LIKE_PACKS,
  getLikePack,
  likeCreditAllowed,
  mockCharge,
  type PaymentProviderKind,
  CERTIFIED_LIKE_WEIGHT,
  crossedMilestones,
  formatLikeDuration,
  highestMilestone,
  parseMilestones,
  periodDurationSeconds,
  pickUnitForTarget,
  sumLikeSeconds,
  targetKey,
  type LikeTargetType as DomainTarget,
} from "@tiptop/domain";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma.service";
import { NotificationsService } from "../notifications/notifications.service";

type LockedUnit = {
  id: string;
  ownerId: string;
  source: string;
  toUserId: string | null;
  activeTargetKey: string | null;
};

const personSelect = {
  id: true,
  firstName: true,
  lastName: true,
  username: true,
  profile: { select: { avatarUrl: true } },
} as const;

type PersonRow = {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  profile?: { avatarUrl: string | null } | null;
};

function mapPerson(u: PersonRow) {
  return {
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    username: u.username,
    avatarUrl: u.profile?.avatarUrl ?? null,
  };
}

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
    await this.ensurePersonalUnit(ownerId);
    const units = await this.loadUnits(ownerId);
    const key = targetKey("user", toUserId);
    const already = units.some((u) => u.activeTargetKey === key);
    const placed = units.find((u) => this.isPersonal(u) && u.toUserId);
    let fromTargetKey: string | null = null;
    try {
      const plan = pickUnitForTarget(
        units.map((u) => ({ id: u.id, ownerId: u.ownerId, activeTargetKey: u.activeTargetKey })),
        key,
        ownerId,
      );
      fromTargetKey = plan.fromTargetKey;
    } catch {
      /* already or no units */
    }
    const fromUserId = fromTargetKey?.startsWith("user:") ? fromTargetKey.slice(5) : null;
    const fromUser = fromUserId
      ? await this.prisma.user.findUnique({
          where: { id: fromUserId },
          select: personSelect,
        })
      : null;
    const placedUser = placed?.toUserId
      ? await this.prisma.user.findUnique({
          where: { id: placed.toUserId },
          select: personSelect,
        })
      : null;
    const free = units.filter((u) => !u.activeTargetKey).length;
    return {
      alreadyLiked: already,
      availableUnits: free,
      totalUnits: units.length,
      needsPurchase: units.length === 0,
      wouldTransferFrom: fromUser ? mapPerson(fromUser) : null,
      fromTargetKey,
      placedOn: placedUser ? mapPerson(placedUser) : null,
    };
  }

  async like(ownerId: string, toUserId: string, confirmTransfer: boolean) {
    if (ownerId === toUserId) throw new BadRequestException({ code: "LIKE_SELF" });
    const target = await this.prisma.user.findUnique({ where: { id: toUserId } });
    if (!target) throw new BadRequestException({ code: "USER_NOT_FOUND" });

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "LikeUnit" WHERE "ownerId" = ${ownerId} FOR UPDATE`;
      await this.ensurePersonalUnitTx(tx, ownerId);
      const units = await this.lockUnits(tx, ownerId);
      let plan;
      try {
        plan = pickUnitForTarget(
          units.map((u) => ({ id: u.id, ownerId: u.ownerId, activeTargetKey: u.activeTargetKey })),
          targetKey("user", toUserId),
          ownerId,
        );
      } catch (e) {
        const code = e instanceof Error ? e.message : "LIKE_ERROR";
        if (code === "LIKE_ALREADY_ON_TARGET") throw new ConflictException({ code });
        if (code === "LIKE_NO_UNITS") throw new BadRequestException({ code });
        throw new BadRequestException({ code });
      }
      if (plan.fromTargetKey && !confirmTransfer) {
        throw new ConflictException({
          code: "LIKE_TRANSFER_REQUIRED",
          fromTargetKey: plan.fromTargetKey,
          fromUserId: plan.fromTargetKey.startsWith("user:") ? plan.fromTargetKey.slice(5) : null,
        });
      }
      const now = new Date();
      if (plan.fromTargetKey) {
        const prevUser = plan.fromTargetKey.startsWith("user:") ? plan.fromTargetKey.slice(5) : null;
        await tx.likeAllocation.updateMany({
          where: { unitId: plan.unitId, releasedAt: null },
          data: { releasedAt: now },
        });
        await this.closePeriodsTx(tx, plan.unitId, now);
        if (prevUser) {
          await tx.likeTransaction.create({
            data: {
              userId: ownerId,
              kind: "RELEASE",
              unitId: plan.unitId,
              toUserId: prevUser,
            },
          });
        }
      }
      await tx.likeAllocation.create({
        data: { unitId: plan.unitId, toUserId },
      });
      await this.closePeriodsTx(tx, plan.unitId, now);
      await tx.likePeriod.create({
        data: {
          unitId: plan.unitId,
          actorId: ownerId,
          targetType: "USER",
          targetId: toUserId,
          beneficiaryUserId: toUserId,
          startedAt: now,
          weight: CERTIFIED_LIKE_WEIGHT,
        },
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
    const unlocked = await this.syncMilestones(toUserId);
    return { ok: true, transferredFrom: result.fromTargetKey, unlocked };
  }

  async unlike(ownerId: string, toUserId: string) {
    await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "LikeUnit" WHERE "ownerId" = ${ownerId} FOR UPDATE`;
      const now = new Date();
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
        data: { releasedAt: now },
      });
      for (const row of active) {
        await this.closePeriodsTx(tx, row.unitId, now);
      }
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
    const [activeRows, hour, day, month, placed, likeTime] = await Promise.all([
      this.prisma.likeAllocation.findMany({
        where: { toUserId: userId, releasedAt: null },
        include: {
          unit: { include: { owner: { select: personSelect } } },
        },
        orderBy: { allocatedAt: "desc" },
      }),
      this.prisma.likeAllocation.count({
        where: { toUserId: userId, allocatedAt: { gte: hourAgo } },
      }),
      this.prisma.likeAllocation.count({
        where: { toUserId: userId, allocatedAt: { gte: dayAgo } },
      }),
      this.prisma.likeAllocation.count({
        where: { toUserId: userId, allocatedAt: { gte: monthAgo } },
      }),
      this.prisma.likeAllocation.findFirst({
        where: { releasedAt: null, unit: { ownerId: userId, source: { in: ["FREE", "CERTIFIED_BONUS"] } } },
        include: { toUser: { select: personSelect } },
        orderBy: { allocatedAt: "desc" },
      }),
      this.timeForUser(userId),
    ]);
    const production = likeProduction({
      active: activeRows.length,
      perHour: hour,
      perDay: day,
      perMonth: month,
    });
    return {
      ...production,
      receivedFrom: activeRows.map((row) => ({
        ...mapPerson(row.unit.owner),
        allocatedAt: row.allocatedAt.toISOString(),
      })),
      placedOn: placed?.toUser ? mapPerson(placed.toUser) : null,
      likeTime,
    };
  }

  async mine(ownerId: string) {
    await this.ensurePersonalUnit(ownerId);
    const units = await this.loadUnits(ownerId);
    const stats = await this.statsFor(ownerId);
    const free = units.filter((u) => !u.activeTargetKey).length;
    return {
      available: free,
      total: units.length,
      placedOn: stats.placedOn,
      receivedFrom: stats.receivedFrom,
      likeTime: stats.likeTime,
      production: {
        active: stats.active,
        perHour: stats.perHour,
        perDay: stats.perDay,
        perMonth: stats.perMonth,
        ratio: stats.ratio,
      },
      allocations: units
        .filter((u) => u.activeTargetKey)
        .map((u) => ({ unitId: u.id, toUserId: u.toUserId, targetKey: u.activeTargetKey })),
    };
  }

  async wallet(ownerId: string) {
    await this.ensurePersonalUnit(ownerId);
    const stats = await this.statsFor(ownerId);
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
    const units = await this.loadUnits(ownerId);
    const free = units.filter((u) => !u.activeTargetKey).length;
    return {
      available: free,
      total: units.length,
      packs: [...LIKE_PACKS],
      placedOn: stats.placedOn,
      receivedFrom: stats.receivedFrom,
      likeTime: stats.likeTime,
      production: {
        active: stats.active,
        perHour: stats.perHour,
        perDay: stats.perDay,
        perMonth: stats.perMonth,
        ratio: stats.ratio,
      },
      allocations: stats.placedOn
        ? [{ unitId: "personal", source: "FREE", toUser: stats.placedOn }]
        : [],
      history: history.map((h) => ({
        id: h.id,
        kind: h.kind,
        delta: h.delta,
        createdAt: h.createdAt.toISOString(),
        toUser: h.toUser ? mapPerson(h.toUser) : null,
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

  private isPersonal(u: LockedUnit) {
    return u.source === "FREE" || u.source === "CERTIFIED_BONUS";
  }

  private async ensurePersonalUnit(ownerId: string) {
    const free = await this.prisma.likeUnit.findFirst({
      where: { ownerId, source: "FREE" },
    });
    if (free) return;
    await this.prisma.likeUnit.create({ data: { ownerId, source: "FREE" } });
  }

  private async ensurePersonalUnitTx(tx: Prisma.TransactionClient, ownerId: string) {
    const free = await tx.likeUnit.findFirst({
      where: { ownerId, source: "FREE" },
    });
    if (free) return;
    await tx.likeUnit.create({ data: { ownerId, source: "FREE" } });
  }

  private async loadUnits(ownerId: string): Promise<LockedUnit[]> {
    const units = await this.prisma.likeUnit.findMany({
      where: { ownerId },
      include: {
        allocations: { where: { releasedAt: null } },
        periods: { where: { endedAt: null } },
      },
      orderBy: { createdAt: "asc" },
    });
    return units.map((u) => this.mapLocked(u));
  }

  private async lockUnits(
    tx: Prisma.TransactionClient,
    ownerId: string,
  ): Promise<LockedUnit[]> {
    const units = await tx.likeUnit.findMany({
      where: { ownerId },
      include: {
        allocations: { where: { releasedAt: null } },
        periods: { where: { endedAt: null } },
      },
      orderBy: { createdAt: "asc" },
    });
    return units.map((u) => this.mapLocked(u));
  }

  private mapLocked(u: {
    id: string;
    ownerId: string;
    source: string;
    allocations: Array<{ toUserId: string }>;
    periods?: Array<{ targetType: string; targetId: string }>;
  }): LockedUnit {
    const period = u.periods?.[0];
    const toUserId =
      u.allocations[0]?.toUserId ?? (period?.targetType === "USER" ? period.targetId : null);
    const activeTargetKey = period
      ? targetKey(period.targetType.toLowerCase() as DomainTarget, period.targetId)
      : toUserId
        ? targetKey("user", toUserId)
        : null;
    return { id: u.id, ownerId: u.ownerId, source: u.source, toUserId, activeTargetKey };
  }

  private async closePeriodsTx(tx: Prisma.TransactionClient, unitId: string, now: Date) {
    const open = await tx.likePeriod.findMany({ where: { unitId, endedAt: null } });
    if (!open.length) return;
    await tx.likePeriod.updateMany({ where: { unitId, endedAt: null }, data: { endedAt: now } });
    for (const p of open) {
      const extra = periodDurationSeconds(
        { startedAt: p.startedAt, endedAt: now, weight: p.weight },
        now,
      );
      await tx.userLikeStats.upsert({
        where: { userId: p.beneficiaryUserId },
        create: { userId: p.beneficiaryUserId, closedSeconds: extra },
        update: { closedSeconds: { increment: extra } },
      });
    }
  }

  async timeForUser(userId: string, locale: "fr" | "en" = "fr") {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 86400_000);
    const periods = await this.prisma.likePeriod.findMany({
      where: { beneficiaryUserId: userId },
    });
    const sum = sumLikeSeconds(
      periods.map((p) => ({ startedAt: p.startedAt, endedAt: p.endedAt, weight: p.weight })),
      now,
    );
    const week = sumLikeSeconds(
      periods
        .filter((p) => p.startedAt >= weekAgo || !p.endedAt)
        .map((p) => ({
          startedAt: p.startedAt < weekAgo ? weekAgo : p.startedAt,
          endedAt: p.endedAt,
          weight: p.weight,
        })),
      now,
    );
    const milestones = await this.milestoneDefs();
    const last = highestMilestone(sum.totalSeconds, milestones);
    const lastRow = last
      ? await this.prisma.userMilestone.findUnique({
          where: { userId_milestoneId: { userId, milestoneId: last.id } },
        })
      : null;
    return {
      totalSeconds: sum.totalSeconds,
      historicalSeconds: sum.historicalSeconds,
      activeSeconds: sum.activeSeconds,
      weekSeconds: week.totalSeconds,
      label: formatLikeDuration(sum.totalSeconds, locale),
      weekLabel: formatLikeDuration(week.totalSeconds, locale),
      lastMilestone: last
        ? {
            id: last.id,
            label: formatLikeDuration(last.seconds, locale),
            achievedAt: lastRow?.achievedAt.toISOString() ?? null,
          }
        : null,
    };
  }

  async timeForTarget(type: DomainTarget, targetId: string, locale: "fr" | "en" = "fr") {
    const map = await this.snapshots("anon", type, [targetId], locale);
    const snap = map.get(targetId);
    return {
      totalSeconds: snap?.totalSeconds ?? 0,
      historicalSeconds: snap?.historicalSeconds ?? 0,
      activeSeconds: snap?.activeSeconds ?? 0,
      label: snap?.label ?? formatLikeDuration(0, locale),
      activeCount: snap?.activeCount ?? 0,
    };
  }

  async snapshots(
    viewerId: string,
    type: DomainTarget,
    ids: string[],
    locale: "fr" | "en" = "fr",
  ) {
    type Snap = {
      totalSeconds: number;
      historicalSeconds: number;
      activeSeconds: number;
      activeCount: number;
      likedByMe: boolean;
      label: string;
    };
    const map = new Map<string, Snap>();
    if (!ids.length) return map;
    const now = new Date();
    const periods = await this.prisma.likePeriod.findMany({
      where: {
        targetType: type.toUpperCase() as "USER" | "POST" | "COMMENT" | "MOOD" | "WISH",
        targetId: { in: ids },
      },
    });
    for (const id of ids) {
      const subset = periods.filter((p) => p.targetId === id);
      const sum = sumLikeSeconds(
        subset.map((p) => ({ startedAt: p.startedAt, endedAt: p.endedAt, weight: p.weight })),
        now,
      );
      map.set(id, {
        totalSeconds: sum.totalSeconds,
        historicalSeconds: sum.historicalSeconds,
        activeSeconds: sum.activeSeconds,
        activeCount: subset.filter((p) => !p.endedAt).length,
        likedByMe: subset.some((p) => !p.endedAt && p.actorId === viewerId),
        label: formatLikeDuration(sum.totalSeconds, locale),
      });
    }
    return map;
  }

  async placeOn(
    ownerId: string,
    target: { type: DomainTarget; id: string },
    confirmTransfer: boolean,
  ) {
    if (target.type === "user") {
      return this.like(ownerId, target.id, confirmTransfer);
    }
    const resolved = await this.resolveTarget(ownerId, target);
    const result = await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "LikeUnit" WHERE "ownerId" = ${ownerId} FOR UPDATE`;
      await this.ensurePersonalUnitTx(tx, ownerId);
      const units = await this.lockUnits(tx, ownerId);
      let plan;
      try {
        plan = pickUnitForTarget(
          units.map((u) => ({ id: u.id, ownerId: u.ownerId, activeTargetKey: u.activeTargetKey })),
          targetKey(target.type, target.id),
          ownerId,
        );
      } catch (e) {
        const code = e instanceof Error ? e.message : "LIKE_ERROR";
        if (code === "LIKE_ALREADY_ON_TARGET") throw new ConflictException({ code });
        if (code === "LIKE_NO_UNITS") throw new BadRequestException({ code });
        throw new BadRequestException({ code });
      }
      if (plan.fromTargetKey && !confirmTransfer) {
        throw new ConflictException({ code: "LIKE_TRANSFER_REQUIRED", fromTargetKey: plan.fromTargetKey });
      }
      const now = new Date();
      if (plan.fromTargetKey) {
        await tx.likeAllocation.updateMany({
          where: { unitId: plan.unitId, releasedAt: null },
          data: { releasedAt: now },
        });
        await this.closePeriodsTx(tx, plan.unitId, now);
      }
      await tx.likePeriod.create({
        data: {
          unitId: plan.unitId,
          actorId: ownerId,
          targetType: target.type.toUpperCase() as "POST" | "COMMENT" | "MOOD" | "WISH",
          targetId: target.id,
          beneficiaryUserId: resolved.beneficiaryUserId,
          startedAt: now,
          weight: CERTIFIED_LIKE_WEIGHT,
        },
      });
      return plan;
    });
    if (resolved.beneficiaryUserId !== ownerId) {
      await this.notifications.create({
        userId: resolved.beneficiaryUserId,
        actorId: ownerId,
        type: "LIKE",
        entityType: target.type,
        entityId: target.id,
      });
    }
    const unlocked = await this.syncMilestones(resolved.beneficiaryUserId);
    return { ok: true, transferredFrom: result.fromTargetKey, unlocked };
  }

  async retractFrom(ownerId: string, target: { type: DomainTarget; id: string }) {
    if (target.type === "user") return this.unlike(ownerId, target.id);
    await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "LikeUnit" WHERE "ownerId" = ${ownerId} FOR UPDATE`;
      const now = new Date();
      const open = await tx.likePeriod.findMany({
        where: {
          actorId: ownerId,
          endedAt: null,
          targetType: target.type.toUpperCase() as "POST" | "COMMENT" | "MOOD" | "WISH",
          targetId: target.id,
        },
      });
      for (const p of open) {
        await this.closePeriodsTx(tx, p.unitId, now);
      }
    });
    return { ok: true };
  }

  async leaderboard(scope: { city?: string; window: "all" | "week" | "month" }, locale: "fr" | "en" = "fr") {
    const now = new Date();
    const since =
      scope.window === "week"
        ? new Date(now.getTime() - 7 * 86400_000)
        : scope.window === "month"
          ? new Date(now.getTime() - 30 * 86400_000)
          : null;
    const users = await this.prisma.user.findMany({
      where: {
        status: "ACTIVE",
        profileCompleted: true,
        ...(scope.city ? { profile: { city: scope.city } } : {}),
      },
      select: { id: true, username: true, firstName: true, lastName: true, certified: true, profile: { select: { avatarUrl: true, city: true } } },
      take: 80,
    });
    const items = [];
    for (const u of users) {
      const periods = await this.prisma.likePeriod.findMany({
        where: {
          beneficiaryUserId: u.id,
          ...(since ? { OR: [{ startedAt: { gte: since } }, { endedAt: null }] } : {}),
        },
      });
      const mapped = periods.map((p) => ({
        startedAt: since && p.startedAt < since ? since : p.startedAt,
        endedAt: p.endedAt,
        weight: p.weight,
      }));
      const total = sumLikeSeconds(mapped, now).totalSeconds;
      if (total <= 0) continue;
      items.push({
        id: u.id,
        username: u.username,
        firstName: u.firstName,
        lastName: u.lastName,
        certified: u.certified,
        avatarUrl: u.profile?.avatarUrl ?? null,
        city: u.profile?.city ?? null,
        totalSeconds: total,
        label: formatLikeDuration(total, locale),
      });
    }
    items.sort((a, b) => b.totalSeconds - a.totalSeconds);
    return { items: items.slice(0, 20) };
  }

  async pendingCelebrations(userId: string, locale: "fr" | "en" = "fr") {
    await this.syncMilestones(userId);
    const rows = await this.prisma.userMilestone.findMany({
      where: { userId, notifiedAt: null },
      orderBy: { achievedAt: "asc" },
    });
    const defs = await this.milestoneDefs();
    return {
      items: rows.map((r) => {
        const def = defs.find((d) => d.id === r.milestoneId);
        return {
          id: r.milestoneId,
          achievedAt: r.achievedAt.toISOString(),
          message: locale === "en" ? def?.en ?? "" : def?.fr ?? "",
          label: def ? formatLikeDuration(def.seconds, locale) : r.milestoneId,
        };
      }),
    };
  }

  async ackMilestone(userId: string, milestoneId: string) {
    await this.prisma.userMilestone.updateMany({
      where: { userId, milestoneId, notifiedAt: null },
      data: { notifiedAt: new Date() },
    });
    return { ok: true };
  }

  async historyForUser(userId: string, locale: "fr" | "en" = "fr") {
    const periods = await this.prisma.likePeriod.findMany({
      where: { beneficiaryUserId: userId },
      orderBy: { startedAt: "desc" },
      take: 50,
      include: { actor: { select: personSelect } },
    });
    const now = new Date();
    return {
      items: periods.map((p) => ({
        id: p.id,
        targetType: p.targetType,
        targetId: p.targetId,
        startedAt: p.startedAt.toISOString(),
        endedAt: p.endedAt?.toISOString() ?? null,
        seconds: periodDurationSeconds(
          { startedAt: p.startedAt, endedAt: p.endedAt, weight: p.weight },
          now,
        ),
        label: formatLikeDuration(
          periodDurationSeconds({ startedAt: p.startedAt, endedAt: p.endedAt, weight: p.weight }, now),
          locale,
        ),
        actor: mapPerson(p.actor),
      })),
    };
  }

  private async resolveTarget(ownerId: string, target: { type: DomainTarget; id: string }) {
    if (target.type === "post") {
      const post = await this.prisma.post.findUnique({ where: { id: target.id } });
      if (!post) throw new BadRequestException({ code: "POST_NOT_FOUND" });
      return { beneficiaryUserId: post.authorId };
    }
    if (target.type === "comment") {
      const c = await this.prisma.comment.findUnique({ where: { id: target.id } });
      if (!c) throw new BadRequestException({ code: "COMMENT_NOT_FOUND" });
      return { beneficiaryUserId: c.authorId };
    }
    if (target.type === "mood") {
      const m = await this.prisma.mood.findUnique({ where: { id: target.id } });
      if (!m) throw new BadRequestException({ code: "MOOD_NOT_FOUND" });
      return { beneficiaryUserId: m.authorId };
    }
    if (target.type === "wish") {
      const w = await this.prisma.wish.findUnique({ where: { id: target.id } });
      if (!w) throw new BadRequestException({ code: "WISH_NOT_FOUND" });
      return { beneficiaryUserId: w.ownerId };
    }
    if (ownerId === target.id) throw new BadRequestException({ code: "LIKE_SELF" });
    return { beneficiaryUserId: target.id };
  }

  private async milestoneDefs() {
    const row = await this.prisma.appConfig.findUnique({ where: { key: "likeMilestones" } });
    return parseMilestones(row?.value);
  }

  private async syncMilestones(userId: string) {
    const snap = await this.timeForUser(userId);
    const defs = await this.milestoneDefs();
    const crossed = crossedMilestones(0, snap.totalSeconds, defs);
    const unlocked: string[] = [];
    for (const m of crossed) {
      try {
        await this.prisma.userMilestone.create({
          data: { userId, milestoneId: m.id },
        });
        unlocked.push(m.id);
        await this.notifications.create({
          userId,
          type: "LIKE_MILESTONE",
          entityType: "milestone",
          entityId: m.id,
        });
      } catch {
        /* unique : déjà débloqué */
      }
    }
    return unlocked;
  }
}
