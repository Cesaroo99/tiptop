import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  applyWebhook,
  canConsumeTicket,
  canShowQr,
  isInEntryWindow,
  mockCharge,
  qrExpiry,
  reservationAmountXaf,
  signTicketQr,
  verifyTicketQr,
  type PaymentProviderKind,
} from "@tiptop/domain";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { LikesService } from "../likes/likes.service";
import { hmac } from "../crypto";
import { loadEnv } from "../env";

const env = loadEnv();

@Injectable()
export class BookingService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(NotificationsService) private readonly notifications: NotificationsService,
    @Inject(LikesService) private readonly likes: LikesService,
  ) {}

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
    if (!event.requiresReservation && event.priceXaf <= 0 && !input.invitationId) {
      throw new BadRequestException({ code: "RESERVATION_NOT_REQUIRED" });
    }

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
        if (existing.status === "CONFIRMED") throw new ConflictException({ code: "ALREADY_IN" });
        return this.mapReservation(existing);
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

    const taken = event.participants.filter((p) =>
      ["HOST", "CONFIRMED", "RESERVED"].includes(p.status),
    ).length;
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

    const amountXaf = reservationAmountXaf(event.priceXaf, holders.length);
    const ticketStatus = amountXaf > 0 ? "AWAITING_PAYMENT" : "CONFIRMED";
    const resStatus = amountXaf > 0 ? "AWAITING_PAYMENT" : "CONFIRMED";

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
        } else {
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
    }

    const next = await this.prisma.reservation.findUnique({
      where: { id: reservation.id },
      include: { tickets: true, payment: true, event: true },
    });
    return { ...this.mapReservation(next!), paymentStatus: payment.status };
  }

  async webhook(idempotencyKey: string, status: "SUCCEEDED" | "FAILED") {
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
      include: { event: true },
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
    return { ok: true, code: "OK" };
  }

  async scan(actorId: string, token: string) {
    const parsed = verifyTicketQr({
      token,
      expectedSig: this.sigForToken(token),
    });
    if (!parsed.ok) throw new BadRequestException({ code: `QR_${parsed.reason}` });
    return this.consume(actorId, parsed.ticketId);
  }

  async hostTickets(actorId: string, eventId: string) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException({ code: "EVENT_NOT_FOUND" });
    if (event.hostId !== actorId) throw new ForbiddenException({ code: "NOT_HOST" });
    const tickets = await this.prisma.ticket.findMany({
      where: { eventId },
      include: { holder: { select: { id: true, firstName: true, lastName: true, username: true, certified: true } } },
      orderBy: { createdAt: "asc" },
    });
    const participants = await this.prisma.eventParticipant.findMany({
      where: { eventId },
      include: { user: { select: { id: true, firstName: true, lastName: true, username: true, certified: true } } },
    });
    return {
      eventId,
      counts: {
        interested: participants.filter((p) => p.status === "INTERESTED").length,
        reserved: participants.filter((p) => p.status === "RESERVED").length,
        confirmed: participants.filter((p) => p.status === "CONFIRMED").length,
        present: participants.filter((p) => p.status === "PRESENT").length,
      },
      tickets: tickets.map((t) => ({
        id: t.id,
        status: t.status,
        consumedAt: t.consumedAt?.toISOString() ?? null,
        holder: t.holder,
        paid: t.status === "CONFIRMED" || t.status === "CONSUMED",
      })),
      people: participants.map((p) => ({ ...p.user, status: p.status })),
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
      currency: r.currency,
      createdAt: r.createdAt.toISOString(),
      needsPayment: r.status === "AWAITING_PAYMENT" && r.amountXaf > 0,
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
        imageUrl: t.event.imageUrl,
        hostId: t.event.hostId,
      },
    };
  }
}
