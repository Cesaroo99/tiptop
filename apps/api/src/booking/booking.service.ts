import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  Optional,
  UnauthorizedException,
} from "@nestjs/common";
import {
  applyWebhook,
  canConsumeTicket,
  canShowQr,
  chargeBreakdown,
  hostPeopleCounts,
  isCurrentlyAvailable,
  isInEntryWindow,
  mockCharge,
  normalizePaymentRule,
  normalizePlatformFeePercent,
  planEventBooking,
  PLATFORM_FEE_CONFIG_KEY,
  seatedGuestCount,
  qrExpiry,
  reservationAmountXaf,
  signTicketQr,
  TIPTOP_PLATFORM_FEE_PERCENT,
  unpaidReservationNeedsPay,
  verifyTicketQr,
  webhookRequestAllowed,
  type AvailabilityStatus,
  type PaymentProviderKind,
} from "@tiptop/domain";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { LikesService } from "../likes/likes.service";
import { hmac } from "../crypto";
import { loadEnv } from "../env";
import { AnalyticsService } from "../analytics/analytics.service";

const env = loadEnv();

@Injectable()
export class BookingService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(NotificationsService) private readonly notifications: NotificationsService,
    @Inject(LikesService) private readonly likes: LikesService,
    @Optional() @Inject(AnalyticsService) private readonly analytics?: AnalyticsService,
  ) {}

  async checkout(
    bookerId: string,
    input: { eventId: string; holderIds?: string[]; invitationId?: string; includeSelf?: boolean; intent?: string },
  ) {
    if (input.invitationId) {
      return this.create(bookerId, input);
    }
    const event = await this.prisma.event.findUnique({ where: { id: input.eventId } });
    if (!event) throw new NotFoundException({ code: "EVENT_NOT_FOUND" });
    const includeSelf = input.includeSelf !== false;
    const holderIds = [...new Set(input.holderIds ?? [])].filter((id) => id !== bookerId && id !== event.hostId);
    const plan = planEventBooking({
      price: event.priceXaf,
      paymentRule: event.paymentRule,
      includeSelf,
      pickedCount: holderIds.length,
      intent: input.intent,
    });

    const invitations: Array<Record<string, unknown>> = [];
    if (plan.sendInvites) {
      const { InvitationsService } = await import("../invitations/invitations.service");
      const invites = new InvitationsService(this.prisma, this.notifications, this);
      for (const inviteeId of holderIds) {
        invitations.push(
          await invites.create(bookerId, inviteeId, event.id, plan.invitePayer, plan.payAfterAccept),
        );
      }
    }

    let reservation = null;
    const guests = plan.includeGuestsInReservation ? holderIds : [];
    if ((includeSelf && plan.bookSelfNow) || guests.length > 0) {
      reservation = await this.create(bookerId, {
        eventId: event.id,
        includeSelf: includeSelf && plan.bookSelfNow,
        holderIds: guests,
      });
    }

    return {
      ...(reservation ?? {
        id: null,
        eventId: event.id,
        status: "NONE",
        seats: 0,
        amountXaf: 0,
        currency: event.currency,
        needsPayment: false,
        tickets: [],
      }),
      invitations,
      intent: plan.intent,
      paymentRule: plan.paymentRule,
    };
  }

  async create(
    bookerId: string,
    input: { eventId: string; holderIds?: string[]; invitationId?: string; includeSelf?: boolean },
  ) {
    const includeSelf = input.includeSelf !== false;
    const holders = [...new Set([...(includeSelf ? [bookerId] : []), ...(input.holderIds ?? [])])];
    if (holders.length === 0) throw new BadRequestException({ code: "NO_HOLDERS" });

    const event = await this.prisma.event.findUnique({
      where: { id: input.eventId },
      include: { participants: true },
    });
    if (!event) throw new NotFoundException({ code: "EVENT_NOT_FOUND" });
    if (event.status === "CANCELLED") throw new BadRequestException({ code: "EVENT_CANCELLED" });
    if (event.startsAt.getTime() <= Date.now()) throw new BadRequestException({ code: "EVENT_NOT_FUTURE" });
    void event.requiresReservation;

    if (input.invitationId) {
      const byInvite = await this.prisma.reservation.findUnique({
        where: { invitationId: input.invitationId },
        include: { tickets: true, payment: true, event: true },
      });
      if (byInvite) return this.mapReservation(byInvite);
    } else {
      const existing = await this.prisma.reservation.findFirst({
        where: {
          eventId: event.id,
          bookerId,
          invitationId: null,
          status: { in: ["DRAFT", "AWAITING_PAYMENT", "CONFIRMED"] },
        },
        include: { tickets: true, payment: true, event: true },
      });
      if (existing) {
        const bookingSelf = includeSelf && holders.includes(bookerId);
        if (existing.status === "CONFIRMED" && bookingSelf && holders.length === 1) {
          throw new ConflictException({ code: "ALREADY_IN" });
        }
        if (existing.status !== "CONFIRMED") return this.mapReservation(existing);
      }
    }

    const alreadyTicket = await this.prisma.ticket.findFirst({
      where: {
        eventId: event.id,
        holderId: { in: holders },
        status: { in: ["DRAFT", "AWAITING_PAYMENT", "CONFIRMED", "CONSUMED"] },
      },
    });
    if (alreadyTicket) throw new ConflictException({ code: "ALREADY_IN" });

    const taken = seatedGuestCount(event.participants);
    const newSeats = holders.filter((id) => id !== event.hostId).length || holders.length;
    if (event.capacity != null && taken + newSeats > event.capacity) {
      throw new ConflictException({ code: "EVENT_FULL" });
    }

    for (const id of holders) {
      const user = await this.prisma.user.findUnique({ where: { id }, include: { profile: true } });
      if (!user) throw new BadRequestException({ code: "USER_NOT_FOUND" });
      if (event.minAge) {
        const ageOk = user.profile?.birthDate
          ? (Date.now() - user.profile.birthDate.getTime()) / 31557600000 >= event.minAge
          : false;
        if (!ageOk) throw new BadRequestException({ code: "AGE_RESTRICTED" });
      }
    }

    const ticketAmountXaf = reservationAmountXaf(event.priceXaf, holders.length);
    const charge = chargeBreakdown({
      ticketAmountXaf,
      platformFeePercent: await this.platformFeePercent(),
    });
    const amountXaf = charge.chargeTotalXaf;
    const holdCapacity = amountXaf === 0 || normalizePaymentRule(event.paymentRule) === "HOLD";
    const ticketStatus = amountXaf === 0 ? "CONFIRMED" : holdCapacity ? "AWAITING_PAYMENT" : "DRAFT";
    const resStatus = ticketStatus;

    try {
      const reservation = await this.prisma.$transaction(async (tx) => {
        const row = await tx.reservation.create({
          data: {
            eventId: event.id,
            bookerId,
            invitationId: input.invitationId ?? null,
            status: resStatus,
            seats: holders.length,
            amountXaf,
            tickets: {
              create: holders.map((holderId) => ({
                eventId: event.id,
                holderId,
                status: ticketStatus,
              })),
            },
          },
          include: { tickets: true, payment: true },
        });
        if (amountXaf === 0) {
          await this.confirmParticipants(tx, event.id, holders);
        } else if (holdCapacity) {
          for (const holderId of holders) {
            if (holderId === event.hostId) continue;
            await tx.eventParticipant.upsert({
              where: { eventId_userId: { eventId: event.id, userId: holderId } },
              create: { eventId: event.id, userId: holderId, status: "RESERVED" },
              update: { status: "RESERVED" },
            });
          }
        }
        return row;
      });
      this.analytics?.track("reservation.create", {
        userId: bookerId,
        props: { eventId: event.id, amountXaf, seats: holders.length },
      });
      return this.mapReservation(reservation);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        throw new ConflictException({ code: "ALREADY_IN" });
      }
      throw e;
    }
  }

  async listReservations(userId: string) {
    const rows = await this.prisma.reservation.findMany({
      where: { bookerId: userId },
      orderBy: { createdAt: "desc" },
      include: { event: true, tickets: true, payment: true },
    });
    return { items: rows.map((r) => this.mapReservation(r)) };
  }

  async listTickets(userId: string) {
    const rows = await this.prisma.ticket.findMany({
      where: { holderId: userId },
      orderBy: { createdAt: "desc" },
      include: { event: true, holder: { select: { firstName: true, lastName: true, username: true } } },
    });
    return { items: rows.map((t) => this.mapTicket(t, false)) };
  }

  async getTicket(userId: string, id: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: {
        event: true,
        holder: { select: { firstName: true, lastName: true, username: true } },
        reservation: { select: { bookerId: true } },
      },
    });
    if (!ticket) throw new NotFoundException({ code: "TICKET_NOT_FOUND" });
    const allowed =
      ticket.holderId === userId || ticket.event.hostId === userId || ticket.reservation.bookerId === userId;
    if (!allowed) throw new ForbiddenException({ code: "TICKET_FORBIDDEN" });
    return this.mapTicket(ticket, ticket.holderId === userId);
  }

  async pay(
    userId: string,
    input: { reservationId: string; provider: PaymentProviderKind; fail?: boolean; idempotencyKey: string },
  ) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: input.reservationId },
      include: { tickets: true, payment: true, event: true, invitation: true },
    });
    if (!reservation) throw new NotFoundException({ code: "RESERVATION_NOT_FOUND" });
    if (reservation.bookerId !== userId) throw new ForbiddenException({ code: "NOT_BOOKER" });
    if (reservation.amountXaf <= 0) return this.mapReservation(reservation);
    if (reservation.status === "CONFIRMED") return this.mapReservation(reservation);

    const existing = await this.prisma.payment.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
    if (existing) {
      if (existing.kind !== "RESERVATION" || !existing.reservationId) {
        throw new ConflictException({ code: "IDEMPOTENCY_KIND_MISMATCH" });
      }
      const full = await this.prisma.reservation.findUnique({
        where: { id: existing.reservationId },
        include: { tickets: true, payment: true, event: true },
      });
      return { ...this.mapReservation(full!), paymentStatus: existing.status };
    }

    const charge = mockCharge({ provider: input.provider, fail: input.fail });
    const payload = {
      provider: input.provider,
      status: (charge.status === "SUCCEEDED" ? "SUCCEEDED" : "FAILED") as "SUCCEEDED" | "FAILED",
      amountXaf: reservation.amountXaf,
      idempotencyKey: input.idempotencyKey,
      providerRef: `mock_${input.provider}_${Date.now()}`,
    };

    let payment;
    try {
      if (reservation.payment && reservation.payment.status !== "SUCCEEDED") {
        payment = await this.prisma.payment.update({
          where: { id: reservation.payment.id },
          data: payload,
        });
      } else {
        payment = await this.prisma.payment.create({
          data: {
            kind: "RESERVATION",
            userId,
            reservationId: reservation.id,
            ...payload,
          },
        });
      }
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        const dup = await this.prisma.payment.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
        const full = await this.prisma.reservation.findUnique({
          where: { id: reservation.id },
          include: { tickets: true, payment: true, event: true },
        });
        return { ...this.mapReservation(full!), paymentStatus: dup?.status ?? full?.payment?.status };
      }
      throw e;
    }

    if (charge.status === "SUCCEEDED") {
      await this.markPaid(reservation.id);
      await this.notifications.create({
        userId,
        type: "PAYMENT",
        entityType: "reservation",
        entityId: reservation.id,
      });
      this.analytics?.track("payment.succeed", {
        userId,
        props: { reservationId: reservation.id, amountXaf: reservation.amountXaf },
      });
    }

    const next = await this.prisma.reservation.findUnique({
      where: { id: reservation.id },
      include: { tickets: true, payment: true, event: true },
    });
    return { ...this.mapReservation(next!), paymentStatus: payment.status };
  }

  async webhook(idempotencyKey: string, status: "SUCCEEDED" | "FAILED", providedSecret?: string) {
    if (
      !webhookRequestAllowed({
        providedSecret,
        configuredSecret: env.PAYMENT_WEBHOOK_SECRET,
        nodeEnv: env.NODE_ENV,
      })
    ) {
      throw new UnauthorizedException({ code: "WEBHOOK_UNAUTHORIZED" });
    }
    const payment = await this.prisma.payment.findUnique({ where: { idempotencyKey } });
    if (!payment) throw new NotFoundException({ code: "PAYMENT_NOT_FOUND" });
    const result = applyWebhook(payment.status, status);
    if (!result.applied) return { ok: true, duplicate: true, status: payment.status };
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: result.status },
    });
    if (result.status === "SUCCEEDED") {
      if (payment.kind === "LIKE_PACK") {
        await this.likes.fulfillPaidPurchase(payment.id);
      } else if (payment.reservationId) {
        await this.markPaid(payment.reservationId);
      }
    }
    return { ok: true, duplicate: false, status: result.status };
  }

  async consume(actorId: string, ticketId: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        event: true,
        holder: { select: { id: true, firstName: true, lastName: true, username: true } },
      },
    });
    if (!ticket) throw new NotFoundException({ code: "TICKET_NOT_FOUND" });
    if (ticket.event.hostId !== actorId) throw new ForbiddenException({ code: "NOT_HOST" });
    if (!isInEntryWindow({ startsAt: ticket.event.startsAt, endsAt: ticket.event.endsAt })) {
      throw new BadRequestException({ code: "ENTRY_WINDOW" });
    }
    const gate = canConsumeTicket(ticket.status, ticket.consumedAt);
    if (gate !== "OK") {
      throw new ConflictException({ code: gate });
    }
    const updated = await this.prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<Array<{ id: string }>>`
        UPDATE "Ticket"
        SET status = 'CONSUMED'::"TicketStatus", "consumedAt" = NOW()
        WHERE id = ${ticketId} AND status = 'CONFIRMED'::"TicketStatus" AND "consumedAt" IS NULL
        RETURNING id
      `;
      if (rows.length === 0) throw new ConflictException({ code: "ALREADY_CONSUMED" });
      await tx.eventParticipant.updateMany({
        where: { eventId: ticket.eventId, userId: ticket.holderId },
        data: { status: "PRESENT" },
      });
      return rows[0];
    });
    await this.notifications.create({
      userId: ticket.holderId,
      actorId,
      type: "TICKET",
      entityType: "ticket",
      entityId: ticket.id,
    });
    void updated;
    this.analytics?.track("ticket.checkin", {
      userId: actorId,
      props: { ticketId: ticket.id, eventId: ticket.eventId, holderId: ticket.holderId },
    });
    return {
      ok: true,
      code: "OK",
      ticketId: ticket.id,
      eventId: ticket.eventId,
      holder: ticket.holder,
    };
  }

  async scan(actorId: string, token: string, eventId?: string) {
    const parsed = verifyTicketQr({
      token,
      expectedSig: this.sigForToken(token),
    });
    if (!parsed.ok) throw new BadRequestException({ code: `QR_${parsed.reason}` });
    if (eventId) {
      const ticket = await this.prisma.ticket.findUnique({
        where: { id: parsed.ticketId },
        select: { eventId: true },
      });
      if (!ticket || ticket.eventId !== eventId) {
        throw new ForbiddenException({ code: "NOT_HOST" });
      }
    }
    return this.consume(actorId, parsed.ticketId);
  }

  async hostTickets(actorId: string, eventId: string) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException({ code: "EVENT_NOT_FOUND" });
    if (event.hostId !== actorId) throw new ForbiddenException({ code: "NOT_HOST" });
    const tickets = await this.prisma.ticket.findMany({
      where: { eventId, status: { not: "CANCELLED" } },
      include: {
        holder: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            certified: true,
            profile: { select: { avatarUrl: true, profession: true, availability: true, availabilityUntil: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });
    const participants = await this.prisma.eventParticipant.findMany({
      where: { eventId, status: { not: "CANCELLED" } },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            certified: true,
            profile: { select: { avatarUrl: true, profession: true, availability: true, availabilityUntil: true } },
          },
        },
      },
    });
    const ticketByHolder = new Map(tickets.map((t) => [t.holderId, t]));
    const people = participants
      .filter((p) => p.status !== "HOST")
      .map((p) => {
        const ticket = ticketByHolder.get(p.userId);
        return {
          id: p.user.id,
          username: p.user.username,
          firstName: p.user.firstName,
          lastName: p.user.lastName,
          certified: p.user.certified,
          avatarUrl: p.user.profile?.avatarUrl ?? null,
          profession: p.user.profile?.profession ?? null,
          available: isCurrentlyAvailable({
            availability: (p.user.profile?.availability ?? "HIDDEN") as AvailabilityStatus,
            availabilityUntil: p.user.profile?.availabilityUntil ?? null,
          }),
          status: p.status,
          ticketId: ticket?.id ?? null,
          ticketStatus: ticket?.status ?? null,
          paid: ticket ? ticket.status === "CONFIRMED" || ticket.status === "CONSUMED" : false,
          consumedAt: ticket?.consumedAt?.toISOString() ?? null,
        };
      });
    const counts = hostPeopleCounts(people);
    return {
      eventId,
      counts: {
        ...counts,
        confirmed: participants.filter((p) => p.status === "CONFIRMED").length,
        present: participants.filter((p) => p.status === "PRESENT").length,
      },
      tickets: tickets.map((t) => ({
        id: t.id,
        status: t.status,
        consumedAt: t.consumedAt?.toISOString() ?? null,
        holder: {
          id: t.holder.id,
          firstName: t.holder.firstName,
          lastName: t.holder.lastName,
          username: t.holder.username,
          certified: t.holder.certified,
        },
        paid: t.status === "CONFIRMED" || t.status === "CONSUMED",
      })),
      people,
    };
  }

  async methods(userId: string) {
    const items = await this.prisma.paymentMethod.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return { items };
  }

  async addMethod(userId: string, provider: PaymentProviderKind, label: string) {
    const row = await this.prisma.paymentMethod.create({
      data: { userId, provider, label: label.trim().slice(0, 80) || provider },
    });
    return row;
  }

  async releaseUnpaidForInvitation(invitationId: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { invitationId },
      include: { tickets: true },
    });
    if (!reservation) return;
    if (reservation.status === "CONFIRMED") {
      await this.prisma.$transaction(async (tx) => {
        await tx.ticket.updateMany({
          where: { reservationId: reservation.id, status: { in: ["DRAFT", "AWAITING_PAYMENT", "CONFIRMED"] } },
          data: { status: "CANCELLED" },
        });
        await tx.reservation.update({ where: { id: reservation.id }, data: { status: "CANCELLED" } });
        const holders = reservation.tickets.map((t) => t.holderId);
        await tx.eventParticipant.updateMany({
          where: { eventId: reservation.eventId, userId: { in: holders }, status: { in: ["RESERVED", "CONFIRMED"] } },
          data: { status: "CANCELLED" },
        });
      });
      return;
    }
    if (!unpaidReservationNeedsPay(reservation.status, reservation.amountXaf) && reservation.status !== "DRAFT") {
      return;
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.ticket.updateMany({
        where: { reservationId: reservation.id },
        data: { status: "CANCELLED" },
      });
      await tx.reservation.update({ where: { id: reservation.id }, data: { status: "CANCELLED" } });
      const holders = reservation.tickets.map((t) => t.holderId);
      await tx.eventParticipant.updateMany({
        where: { eventId: reservation.eventId, userId: { in: holders } },
        data: { status: "CANCELLED" },
      });
    });
  }

  async fulfillInvitation(bookerId: string, invitationId: string, inviteeId: string, eventId: string, paidByHost: boolean) {
    if (paidByHost) {
      const existing = await this.prisma.reservation.findUnique({ where: { invitationId } });
      if (existing?.status === "CONFIRMED") return { needsPayment: false, reservation: this.mapReservation(existing) };
    }
    return this.create(bookerId, {
      eventId,
      invitationId,
      includeSelf: bookerId === inviteeId,
      holderIds: [inviteeId],
    });
  }

  private sigForToken(token: string): string {
    const parts = token.split(".");
    if (parts.length !== 4) return "";
    return hmac(env.SESSION_SECRET, `${parts[1]}.${parts[2]}`);
  }

  private async markPaid(reservationId: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { tickets: true, event: true, invitation: true },
    });
    if (!reservation) return;
    await this.prisma.$transaction(async (tx) => {
      await tx.reservation.update({
        where: { id: reservationId },
        data: { status: "CONFIRMED" },
      });
      await tx.ticket.updateMany({
        where: { reservationId, status: { in: ["DRAFT", "AWAITING_PAYMENT"] } },
        data: { status: "CONFIRMED" },
      });
      const holders = reservation.tickets.map((t) => t.holderId);
      await this.confirmParticipants(tx, reservation.eventId, holders);
      if (reservation.invitationId) {
        if (reservation.invitation?.payer === "GUEST") {
          await tx.invitation.update({
            where: { id: reservation.invitationId },
            data: { status: "ACCEPTED", respondedAt: new Date() },
          });
        }
        const inv = reservation.invitation;
        if (inv) {
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
        }
      }
    });
    for (const t of reservation.tickets) {
      await this.notifications.create({
        userId: t.holderId,
        type: "TICKET",
        entityType: "ticket",
        entityId: t.id,
      });
    }
  }

  private async confirmParticipants(
    tx: Prisma.TransactionClient,
    eventId: string,
    holderIds: string[],
  ) {
    const event = await tx.event.findUnique({ where: { id: eventId } });
    for (const holderId of holderIds) {
      if (holderId === event?.hostId) continue;
      await tx.eventParticipant.upsert({
        where: { eventId_userId: { eventId, userId: holderId } },
        create: { eventId, userId: holderId, status: "CONFIRMED" },
        update: { status: "CONFIRMED" },
      });
    }
  }

  private async platformFeePercent(): Promise<number> {
    try {
      const row = await this.prisma.appConfig.findUnique({ where: { key: PLATFORM_FEE_CONFIG_KEY } });
      return normalizePlatformFeePercent(row?.value ?? TIPTOP_PLATFORM_FEE_PERCENT);
    } catch {
      return TIPTOP_PLATFORM_FEE_PERCENT;
    }
  }

  mapReservation(r: {
    id: string;
    eventId: string;
    bookerId: string;
    status: string;
    seats: number;
    amountXaf: number;
    currency: string;
    createdAt: Date;
    invitationId?: string | null;
    tickets?: Array<{ id: string; holderId: string; status: string }>;
    payment?: { id: string; status: string; provider: string } | null;
    event?: { title: string; startsAt: Date; city: string };
  }) {
    return {
      id: r.id,
      eventId: r.eventId,
      bookerId: r.bookerId,
      invitationId: r.invitationId ?? null,
      status: r.status,
      seats: r.seats,
      amountXaf: r.amountXaf,
      charge: chargeBreakdown({ ticketAmountXaf: r.amountXaf }),
      currency: r.currency,
      createdAt: r.createdAt.toISOString(),
      needsPayment: unpaidReservationNeedsPay(r.status, r.amountXaf),
      tickets: (r.tickets ?? []).map((t) => ({ id: t.id, holderId: t.holderId, status: t.status })),
      payment: r.payment
        ? { id: r.payment.id, status: r.payment.status, provider: r.payment.provider }
        : null,
      event: r.event
        ? { title: r.event.title, startsAt: r.event.startsAt.toISOString(), city: r.event.city }
        : undefined,
    };
  }

  private mapTicket(
    t: {
      id: string;
      status: string;
      consumedAt: Date | null;
      createdAt: Date;
      holderId: string;
      event: {
        id: string;
        title: string;
        startsAt: Date;
        endsAt: Date | null;
        city: string;
        zone: string | null;
        venue: string | null;
        address?: string | null;
        latitude?: number | null;
        longitude?: number | null;
        hostId: string;
        imageUrl: string | null;
      };
      holder: { firstName: string; lastName: string; username: string };
    },
    withQr: boolean,
  ) {
    const status = t.status as Parameters<typeof canShowQr>[0]["status"];
    const show = withQr && canShowQr({ status, startsAt: t.event.startsAt, endsAt: t.event.endsAt });
    let qr: string | null = null;
    if (show) {
      const exp = qrExpiry();
      const sig = hmac(env.SESSION_SECRET, `${t.id}.${exp}`);
      qr = signTicketQr(t.id, exp, sig);
    }
    return {
      id: t.id,
      status: t.status,
      consumedAt: t.consumedAt?.toISOString() ?? null,
      createdAt: t.createdAt.toISOString(),
      qr,
      qrActive: show,
      holder: t.holder,
      event: {
        id: t.event.id,
        title: t.event.title,
        startsAt: t.event.startsAt.toISOString(),
        endsAt: t.event.endsAt?.toISOString() ?? null,
        city: t.event.city,
        zone: t.event.zone,
        venue: t.event.venue,
        address: t.event.address ?? null,
        latitude: t.event.latitude ?? null,
        longitude: t.event.longitude ?? null,
        imageUrl: t.event.imageUrl,
        hostId: t.event.hostId,
      },
    };
  }
}
