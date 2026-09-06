import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  assertNotSelf,
  canCertifyUsers,
  canRefundPayments,
  canSubmitReport,
  isValidReportReason,
  likeAnomalyFlags,
  refundAllowed,
} from "@tiptop/domain";
import type { AdminAction, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma.service";
import { NotificationsService } from "../notifications/notifications.service";

const person = { id: true, username: true, firstName: true, lastName: true, certified: true } as const;

@Injectable()
export class AdminService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(NotificationsService) private readonly notifications: NotificationsService,
  ) {}

  async overview() {
    const [users, blocked, posts, hiddenPosts, events, payments, openReports] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { status: "BLOCKED" } }),
      this.prisma.post.count({ where: { hiddenAt: null } }),
      this.prisma.post.count({ where: { hiddenAt: { not: null } } }),
      this.prisma.event.count({ where: { status: "PUBLISHED" } }),
      this.prisma.payment.count({ where: { status: "SUCCEEDED" } }),
      this.prisma.report.count({ where: { status: "OPEN" } }),
    ]);
    return { users, blocked, posts, hiddenPosts, events, payments, openReports };
  }

  async users(q: string) {
    const query = q.trim();
    const where: Prisma.UserWhereInput = query
      ? {
          OR: [
            { username: { contains: query, mode: "insensitive" } },
            { firstName: { contains: query, mode: "insensitive" } },
            { lastName: { contains: query, mode: "insensitive" } },
            { phoneE164: { contains: query } },
          ],
        }
      : {};
    const items = await this.prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        phoneE164: true,
        certified: true,
        role: true,
        status: true,
        createdAt: true,
        profile: { select: { city: true, zone: true } },
      },
    });
    return { items };
  }

  async patchUser(
    actor: { id: string; role: string },
    userId: string,
    input: { certified?: boolean; status?: "ACTIVE" | "BLOCKED" },
  ) {
    const target = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!target) throw new NotFoundException({ code: "USER_NOT_FOUND" });

    if (input.status === "BLOCKED") {
      assertNotSelfSafe(actor.id, userId);
      await this.prisma.user.update({ where: { id: userId }, data: { status: "BLOCKED" } });
      await this.prisma.session.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await this.audit(actor.id, "USER_BLOCK", "user", userId);
    }
    if (input.status === "ACTIVE" && target.status === "BLOCKED") {
      await this.prisma.user.update({ where: { id: userId }, data: { status: "ACTIVE" } });
      await this.audit(actor.id, "USER_UNBLOCK", "user", userId);
    }
    if (typeof input.certified === "boolean") {
      if (!canCertifyUsers(actor.role)) throw new ForbiddenException({ code: "ADMIN_ONLY" });
      await this.prisma.user.update({ where: { id: userId }, data: { certified: input.certified } });
      await this.audit(actor.id, input.certified ? "USER_CERTIFY" : "USER_UNCERTIFY", "user", userId);
    }
    return this.users("");
  }

  async posts() {
    const items = await this.prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { author: { select: person } },
    });
    return {
      items: items.map((p) => ({
        id: p.id,
        body: p.body,
        imageUrl: p.imageUrl,
        hidden: Boolean(p.hiddenAt),
        createdAt: p.createdAt.toISOString(),
        author: p.author,
      })),
    };
  }

  async hidePost(actorId: string, postId: string, hide: boolean) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException({ code: "POST_NOT_FOUND" });
    await this.prisma.post.update({
      where: { id: postId },
      data: { hiddenAt: hide ? new Date() : null },
    });
    await this.audit(actorId, hide ? "POST_HIDE" : "POST_UNHIDE", "post", postId);
    return { ok: true, hidden: hide };
  }

  async events() {
    const items = await this.prisma.event.findMany({
      orderBy: { startsAt: "desc" },
      take: 50,
      include: { host: { select: person } },
    });
    return {
      items: items.map((e) => ({
        id: e.id,
        title: e.title,
        city: e.city,
        startsAt: e.startsAt.toISOString(),
        status: e.status,
        host: e.host,
      })),
    };
  }

  async cancelEvent(actorId: string, eventId: string) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException({ code: "EVENT_NOT_FOUND" });
    if (event.status === "CANCELLED") throw new BadRequestException({ code: "EVENT_ALREADY_CANCELLED" });
    await this.prisma.event.update({ where: { id: eventId }, data: { status: "CANCELLED" } });
    await this.audit(actorId, "EVENT_CANCEL", "event", eventId);
    await this.notifyEventParticipants(eventId, actorId, "event_cancelled");
    return { ok: true };
  }

  /** Prévient les participants concernés — utilisé par l'annulation admin (#13, #32). */
  private async notifyEventParticipants(eventId: string, actorId: string, entityType: string) {
    const [participants, ticketHolders] = await Promise.all([
      this.prisma.eventParticipant.findMany({
        where: { eventId, status: { not: "CANCELLED" } },
        select: { userId: true },
      }),
      this.prisma.ticket.findMany({
        where: { eventId, status: { in: ["CONFIRMED", "AWAITING_PAYMENT"] } },
        select: { holderId: true },
      }),
    ]);
    const userIds = new Set<string>([
      ...participants.map((p) => p.userId),
      ...ticketHolders.map((t) => t.holderId),
    ]);
    await Promise.all(
      [...userIds].map((userId) =>
        this.notifications.create({ userId, actorId, type: "EVENT_UPDATE", entityType, entityId: eventId }),
      ),
    );
  }

  async payments() {
    const items = await this.prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        user: { select: person },
        likePurchase: { select: { packCode: true, units: true } },
        reservation: { select: { id: true, eventId: true } },
      },
    });
    return {
      items: items.map((p) => ({
        id: p.id,
        kind: p.kind,
        status: p.status,
        amountXaf: p.amountXaf,
        refundedAmountXaf: p.refundedAmountXaf,
        provider: p.provider,
        createdAt: p.createdAt.toISOString(),
        user: p.user,
        packCode: p.likePurchase?.packCode ?? null,
        reservationId: p.reservation?.id ?? null,
      })),
    };
  }

  /** Remboursement total ou partiel (#32-33), toujours traçable : le montant réellement
   * remboursé est conservé séparément du montant original, jamais seulement le statut. */
  async refund(actor: { id: string; role: string }, paymentId: string, amountXaf?: number) {
    if (!canRefundPayments(actor.role)) throw new ForbiddenException({ code: "ADMIN_ONLY" });
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException({ code: "PAYMENT_NOT_FOUND" });
    try {
      refundAllowed(payment.status);
    } catch (e) {
      throw new BadRequestException({ code: e instanceof Error ? e.message : "PAYMENT_NOT_REFUNDABLE" });
    }
    const requested = amountXaf != null ? Math.round(amountXaf) : payment.amountXaf;
    if (requested <= 0 || requested > payment.amountXaf) {
      throw new BadRequestException({ code: "REFUND_AMOUNT_INVALID" });
    }
    const partial = requested < payment.amountXaf;
    await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: partial ? "PARTIALLY_REFUNDED" : "REFUNDED",
        refundedAmountXaf: requested,
        refundedAt: new Date(),
      },
    });
    await this.audit(actor.id, "PAYMENT_REFUND", "payment", paymentId, {
      likesKept: payment.kind === "LIKE_PACK",
      amountXaf: requested,
      partial,
    });
    await this.notifications.create({
      userId: payment.userId,
      actorId: actor.id,
      type: "PAYMENT",
      entityType: partial ? "refund_partial" : "refund",
      entityId: paymentId,
    });
    return { ok: true, likesKept: payment.kind === "LIKE_PACK", partial, refundedAmountXaf: requested };
  }

  async likeAnomalies() {
    const hourAgo = new Date(Date.now() - 3600_000);
    const owners = await this.prisma.likeUnit.groupBy({
      by: ["ownerId"],
      _count: { _all: true },
    });
    const items: Array<{
      user: { id: string; username: string; firstName: string; lastName: string; certified: boolean };
      flags: string[];
      totalUnits: number;
      purchasedUnits: number;
      allocatedActive: number;
      allocationsLastHour: number;
    }> = [];
    for (const row of owners) {
      const [purchasedUnits, allocatedActive, allocationsLastHour, user] = await Promise.all([
        this.prisma.likeUnit.count({ where: { ownerId: row.ownerId, source: "PURCHASED" } }),
        this.prisma.likeAllocation.count({
          where: { releasedAt: null, unit: { ownerId: row.ownerId } },
        }),
        this.prisma.likeAllocation.count({
          where: { allocatedAt: { gte: hourAgo }, unit: { ownerId: row.ownerId } },
        }),
        this.prisma.user.findUnique({ where: { id: row.ownerId }, select: person }),
      ]);
      if (!user) continue;
      const flags = likeAnomalyFlags({
        allocationsLastHour,
        totalUnits: row._count._all,
        purchasedUnits,
        allocatedActive,
      });
      if (!flags.length) continue;
      items.push({
        user,
        flags,
        totalUnits: row._count._all,
        purchasedUnits,
        allocatedActive,
        allocationsLastHour,
      });
    }
    return { items };
  }

  async reports() {
    const items = await this.prisma.report.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        reporter: { select: person },
        targetUser: { select: person },
        post: { select: { id: true, body: true } },
        event: { select: { id: true, title: true } },
      },
    });
    return { items };
  }

  async reviewReport(actorId: string, reportId: string, status: "DISMISSED" | "ACTIONED") {
    const report = await this.prisma.report.findUnique({ where: { id: reportId } });
    if (!report) throw new NotFoundException({ code: "REPORT_NOT_FOUND" });
    if (report.status !== "OPEN") throw new BadRequestException({ code: "REPORT_ALREADY_REVIEWED" });
    await this.prisma.report.update({
      where: { id: reportId },
      data: { status, reviewedById: actorId, reviewedAt: new Date() },
    });
    await this.audit(actorId, "REPORT_REVIEW", "report", reportId, { status });
    return { ok: true };
  }

  async createReport(
    reporterId: string,
    input: {
      kind: "USER" | "POST" | "EVENT" | "MESSAGE" | "MOOD";
      reason: string;
      body?: string;
      targetUserId?: string;
      postId?: string;
      eventId?: string;
      messageId?: string;
      moodId?: string;
    },
  ) {
    if (!isValidReportReason(input.reason)) throw new BadRequestException({ code: "REPORT_REASON_INVALID" });
    const sentTodayCount = await this.prisma.report.count({
      where: { reporterId, createdAt: { gte: new Date(Date.now() - 24 * 3600_000) } },
    });
    if (canSubmitReport(sentTodayCount) !== "OK") {
      throw new ConflictException({ code: "REPORT_RATE_LIMITED" });
    }
    if (input.kind === "USER") {
      if (!input.targetUserId) throw new BadRequestException({ code: "REPORT_TARGET_REQUIRED" });
      assertNotSelfSafe(reporterId, input.targetUserId);
    }
    if (input.kind === "POST" && !input.postId) throw new BadRequestException({ code: "REPORT_TARGET_REQUIRED" });
    if (input.kind === "EVENT" && !input.eventId) throw new BadRequestException({ code: "REPORT_TARGET_REQUIRED" });
    if (input.kind === "MESSAGE" && !input.messageId) throw new BadRequestException({ code: "REPORT_TARGET_REQUIRED" });
    if (input.kind === "MOOD" && !input.moodId) throw new BadRequestException({ code: "REPORT_TARGET_REQUIRED" });
    const row = await this.prisma.report.create({
      data: {
        reporterId,
        kind: input.kind,
        reason: input.reason,
        body: (input.body ?? "").trim().slice(0, 500),
        targetUserId: input.targetUserId ?? null,
        postId: input.postId ?? null,
        eventId: input.eventId ?? null,
        messageId: input.messageId ?? null,
        moodId: input.moodId ?? null,
      },
    });
    return { ok: true, id: row.id };
  }

  private audit(actorId: string, action: AdminAction, entityType: string, entityId: string, meta?: Prisma.InputJsonValue) {
    return this.prisma.adminAudit.create({
      data: { actorId, action, entityType, entityId, meta: meta ?? undefined },
    });
  }
}

function assertNotSelfSafe(actorId: string, targetId: string) {
  try {
    assertNotSelf(actorId, targetId);
  } catch (e) {
    throw new BadRequestException({ code: e instanceof Error ? e.message : "ADMIN_SELF" });
  }
}
