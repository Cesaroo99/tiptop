import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  canAcceptInvitation,
  canSendEventInvite,
  evaluateInvite,
  invitationExpiresAt,
  normalizePaymentRule,
  resolveInvitationPayer,
  seatedGuestCount,
  unpaidReservationNeedsPay,
} from "@tiptop/domain";
import { PrismaService } from "../prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { BookingService } from "../booking/booking.service";

@Injectable()
export class InvitationsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(NotificationsService) private readonly notifications: NotificationsService,
    @Inject(BookingService) private readonly booking: BookingService,
  ) {}

  async relevantEvents(inviterId: string, inviteeId: string) {
    if (inviterId === inviteeId) throw new BadRequestException({ code: "INVITE_SELF" });
    const invitee = await this.prisma.user.findUnique({
      where: { id: inviteeId },
      include: { profile: true },
    });
    if (!invitee) throw new NotFoundException({ code: "USER_NOT_FOUND" });
    const now = new Date();
    const events = await this.prisma.event.findMany({
      where: { status: "PUBLISHED", startsAt: { gt: now } },
      orderBy: { startsAt: "asc" },
      take: 40,
      include: { participants: true, host: { include: { profile: true } } },
    });
    const items = events
      .map((e) => {
        const taken = seatedGuestCount(e.participants);
        const already = e.participants.some((p) => p.userId === inviteeId && p.status !== "CANCELLED");
        const reason = evaluateInvite({
          inviterId,
          inviteeId,
          startsAt: e.startsAt,
          status: e.status,
          capacity: e.capacity,
          taken,
          minAge: e.minAge,
          inviteeBirthDate: invitee.profile?.birthDate ?? null,
          alreadyParticipating: already,
          priceXaf: e.priceXaf,
          payer: e.priceXaf > 0 ? "GUEST" : "FREE",
        });
        return {
          id: e.id,
          title: e.title,
          city: e.city,
          zone: e.zone,
          startsAt: e.startsAt.toISOString(),
          priceXaf: e.priceXaf,
          currency: e.currency,
          paymentRule: normalizePaymentRule(e.paymentRule),
          capacity: e.capacity,
          taken,
          minAge: e.minAge,
          imageUrl: e.imageUrl,
          host: {
            firstName: e.host.firstName,
            lastName: e.host.lastName,
            username: e.host.username,
          },
          eligible: reason === "OK",
          reason,
        };
      })
      .filter((e) => e.eligible || e.reason === "AGE_RESTRICTED" || e.reason === "EVENT_FULL");
    return { items };
  }

  async create(
    inviterId: string,
    inviteeId: string,
    eventId: string,
    payerRaw?: string,
    payAfterAcceptRaw?: boolean,
  ) {
    if (inviterId === inviteeId) throw new BadRequestException({ code: "INVITE_SELF" });
    const [event, invitee] = await Promise.all([
      this.prisma.event.findUnique({ where: { id: eventId }, include: { participants: true } }),
      this.prisma.user.findUnique({ where: { id: inviteeId }, include: { profile: true } }),
    ]);
    if (!event) throw new NotFoundException({ code: "EVENT_NOT_FOUND" });
    if (!invitee) throw new NotFoundException({ code: "USER_NOT_FOUND" });
    const payer = resolveInvitationPayer(
      event.priceXaf,
      payerRaw === "HOST" || payerRaw === "GUEST" || payerRaw === "FREE" ? payerRaw : undefined,
    );
    const taken = seatedGuestCount(event.participants);
    const already = event.participants.some((p) => p.userId === inviteeId && p.status !== "CANCELLED");
    const reason = evaluateInvite({
      inviterId,
      inviteeId,
      startsAt: event.startsAt,
      status: event.status,
      capacity: event.capacity,
      taken,
      minAge: event.minAge,
      inviteeBirthDate: invitee.profile?.birthDate ?? null,
      alreadyParticipating: already,
      priceXaf: event.priceXaf,
      payer,
    });
    if (reason !== "OK") throw new BadRequestException({ code: reason });

    const [pending, sentTodayCount] = await Promise.all([
      this.prisma.invitation.findFirst({ where: { eventId, inviteeId, status: "PENDING" } }),
      this.prisma.invitation.count({
        where: { inviterId, createdAt: { gte: new Date(Date.now() - 24 * 3600_000) } },
      }),
    ]);
    if (pending) throw new ConflictException({ code: "INVITE_ALREADY_PENDING" });
    if (canSendEventInvite(sentTodayCount) !== "OK") {
      throw new ConflictException({ code: "INVITE_RATE_LIMITED" });
    }

    const paymentRule = normalizePaymentRule(event.paymentRule);
    const payAfterAccept = Boolean(payAfterAcceptRaw) && payer === "HOST" && event.priceXaf > 0;
    if (payAfterAccept && paymentRule === "PAY_REQUIRED") {
      throw new BadRequestException({ code: "WAIT_NOT_ALLOWED" });
    }
    const invitation = await this.prisma.invitation.create({
      data: {
        eventId,
        inviterId,
        inviteeId,
        payer,
        payAfterAccept,
        expiresAt: invitationExpiresAt(new Date()),
      },
    });
    await this.notifications.create({
      userId: inviteeId,
      actorId: inviterId,
      type: "INVITE",
      entityType: "invitation",
      entityId: invitation.id,
    });
    const mapped = await this.mapOne(invitation.id);
    const holdUnpaid =
      event.priceXaf > 0 && payer === "HOST" && (!payAfterAccept || paymentRule === "HOLD");
    if (holdUnpaid) {
      try {
        const reservation = await this.booking.create(inviterId, {
          eventId,
          invitationId: invitation.id,
          includeSelf: false,
          holderIds: [inviteeId],
        });
        return {
          ...mapped,
          needsPayment: payAfterAccept ? false : reservation.needsPayment,
          awaitingHostPay: payAfterAccept && reservation.needsPayment,
          reservation,
        };
      } catch (e) {
        await this.prisma.invitation.delete({ where: { id: invitation.id } });
        throw e;
      }
    }
    return mapped;
  }

  async list(userId: string, box: "received" | "sent") {
    await this.expireStale();
    const where = box === "sent" ? { inviterId: userId } : { inviteeId: userId };
    const rows = await this.prisma.invitation.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
      include: this.include(),
    });
    return { items: rows.map((r) => this.serialize(r)) };
  }

  async get(userId: string, id: string) {
    await this.expireStale();
    const row = await this.prisma.invitation.findUnique({ where: { id }, include: this.include() });
    if (!row) throw new NotFoundException({ code: "INVITE_NOT_FOUND" });
    if (row.inviteeId !== userId && row.inviterId !== userId) {
      throw new ForbiddenException({ code: "NOT_PARTY" });
    }
    return this.serialize(row);
  }

  async accept(actorId: string, id: string) {
    await this.expireStale();
    const inv = await this.prisma.invitation.findUnique({
      where: { id },
      include: { event: { include: { participants: true } } },
    });
    if (!inv) throw new NotFoundException({ code: "INVITE_NOT_FOUND" });
    const gate = canAcceptInvitation({
      status: inv.status,
      expiresAt: inv.expiresAt,
      inviteeId: inv.inviteeId,
      actorId,
    });
    if (gate !== "OK") {
      if (gate === "NOT_INVITEE") throw new ForbiddenException({ code: gate });
      throw new BadRequestException({ code: gate });
    }
    if (inv.event.priceXaf > 0 && inv.payer === "GUEST") {
      const reservation = await this.booking.fulfillInvitation(
        actorId,
        inv.id,
        inv.inviteeId,
        inv.eventId,
        false,
      );
      const mapped = await this.mapOne(id);
      return { ...mapped, needsPayment: reservation.needsPayment, reservation };
    }
    if (inv.event.priceXaf > 0 && inv.payer === "HOST" && inv.payAfterAccept) {
      const reservation = await this.booking.create(inv.inviterId, {
        eventId: inv.eventId,
        invitationId: inv.id,
        includeSelf: false,
        holderIds: [inv.inviteeId],
      });
      await this.prisma.invitation.update({
        where: { id },
        data: { status: "ACCEPTED", respondedAt: new Date() },
      });
      await this.notifications.create({
        userId: inv.inviterId,
        actorId,
        type: "INVITE",
        entityType: "invitation",
        entityId: id,
      });
      const mapped = await this.mapOne(id);
      return { ...mapped, needsPayment: false, awaitingHostPay: reservation.needsPayment, reservation };
    }
    if (inv.event.priceXaf > 0 && inv.payer === "HOST") {
      const existing = await this.prisma.reservation.findUnique({ where: { invitationId: inv.id } });
      if (!existing || existing.status !== "CONFIRMED") {
        throw new ConflictException({
          code: "HOST_PAYMENT_PENDING",
          message: "L’invitant n’a pas encore payé.",
        });
      }
    }
    const taken = seatedGuestCount(inv.event.participants);
    if (inv.event.capacity != null && taken >= inv.event.capacity) {
      throw new ConflictException({ code: "EVENT_FULL" });
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.invitation.update({
        where: { id },
        data: { status: "ACCEPTED", respondedAt: new Date() },
      });
      await tx.eventParticipant.upsert({
        where: { eventId_userId: { eventId: inv.eventId, userId: inv.inviteeId } },
        create: { eventId: inv.eventId, userId: inv.inviteeId, status: "CONFIRMED" },
        update: { status: "CONFIRMED" },
      });
      await tx.contact.upsert({
        where: { ownerId_personId: { ownerId: inv.inviterId, personId: inv.inviteeId } },
        create: { ownerId: inv.inviterId, personId: inv.inviteeId },
        update: {},
      });
      await tx.contact.upsert({
        where: { ownerId_personId: { ownerId: inv.inviteeId, personId: inv.inviterId } },
        create: { ownerId: inv.inviteeId, personId: inv.inviterId },
        update: {},
      });
    });
    await this.notifications.create({
      userId: inv.inviterId,
      actorId,
      type: "INVITE",
      entityType: "invitation",
      entityId: id,
    });
    if (inv.event.priceXaf <= 0) {
      try {
        await this.booking.create(actorId, {
          eventId: inv.eventId,
          invitationId: inv.id,
          includeSelf: true,
          holderIds: [inv.inviteeId],
        });
      } catch {
        /* déjà un ticket */
      }
    }
    return this.mapOne(id);
  }

  async refuse(actorId: string, id: string) {
    const inv = await this.prisma.invitation.findUnique({ where: { id } });
    if (!inv) throw new NotFoundException({ code: "INVITE_NOT_FOUND" });
    if (inv.inviteeId !== actorId) throw new ForbiddenException({ code: "NOT_INVITEE" });
    if (inv.status !== "PENDING") throw new BadRequestException({ code: "NOT_PENDING" });
    await this.booking.releaseUnpaidForInvitation(id);
    await this.prisma.invitation.update({
      where: { id },
      data: { status: "REFUSED", respondedAt: new Date() },
    });
    await this.notifications.create({
      userId: inv.inviterId,
      actorId,
      type: "INVITE",
      entityType: "invitation",
      entityId: id,
    });
    return this.mapOne(id);
  }

  private async expireStale() {
    const stale = await this.prisma.invitation.findMany({
      where: { status: "PENDING", expiresAt: { lte: new Date() } },
      select: { id: true, inviterId: true },
    });
    for (const row of stale) {
      await this.booking.releaseUnpaidForInvitation(row.id);
    }
    if (stale.length) {
      await this.prisma.invitation.updateMany({
        where: { id: { in: stale.map((r) => r.id) } },
        data: { status: "EXPIRED" },
      });
    }
  }

  private include() {
    return {
      event: {
        select: {
          id: true,
          title: true,
          startsAt: true,
          city: true,
          zone: true,
          priceXaf: true,
          currency: true,
          paymentRule: true,
          imageUrl: true,
        },
      },
      inviter: { select: { id: true, username: true, firstName: true, lastName: true, certified: true } },
      invitee: { select: { id: true, username: true, firstName: true, lastName: true, certified: true } },
      reservation: { select: { id: true, status: true, amountXaf: true, currency: true } },
    };
  }

  private async mapOne(id: string) {
    const row = await this.prisma.invitation.findUnique({ where: { id }, include: this.include() });
    if (!row) throw new NotFoundException({ code: "INVITE_NOT_FOUND" });
    return this.serialize(row);
  }

  private serialize(r: {
    id: string;
    payer: string;
    payAfterAccept: boolean;
    status: string;
    expiresAt: Date;
    createdAt: Date;
    respondedAt: Date | null;
    event: {
      id: string;
      title: string;
      startsAt: Date;
      city: string;
      zone: string | null;
      priceXaf: number;
      currency?: string;
      paymentRule?: string;
      imageUrl: string | null;
    };
    inviter: { id: string; username: string; firstName: string; lastName: string; certified: boolean };
    invitee: { id: string; username: string; firstName: string; lastName: string; certified: boolean };
    reservation?: { id: string; status: string; amountXaf: number; currency: string } | null;
  }) {
    const reservation = r.reservation
      ? {
          id: r.reservation.id,
          status: r.reservation.status,
          amountXaf: r.reservation.amountXaf,
          currency: r.reservation.currency,
          needsPayment: unpaidReservationNeedsPay(r.reservation.status, r.reservation.amountXaf),
        }
      : null;
    return {
      id: r.id,
      payer: r.payer,
      payAfterAccept: r.payAfterAccept,
      status: r.status,
      expiresAt: r.expiresAt.toISOString(),
      createdAt: r.createdAt.toISOString(),
      respondedAt: r.respondedAt?.toISOString() ?? null,
      event: {
        ...r.event,
        startsAt: r.event.startsAt.toISOString(),
        paymentRule: normalizePaymentRule(r.event.paymentRule),
      },
      inviter: r.inviter,
      invitee: r.invitee,
      reservation,
    };
  }
}
