import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { planHeartTransfer } from "@tiptop/domain";
import { PrismaService } from "../prisma.service";
import { NotificationsService } from "../notifications/notifications.service";

export type CreateEventInput = {
  title: string;
  description?: string;
  imageUrl?: string;
  city?: string;
  zone?: string;
  venue?: string;
  startsAt: string;
  endsAt?: string;
  priceXaf?: number;
  capacity?: number;
  minAge?: number;
  requiresReservation?: boolean;
};

@Injectable()
export class EventsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(NotificationsService) private readonly notifications: NotificationsService,
  ) {}

  async create(hostId: string, input: CreateEventInput) {
    const title = input.title.trim();
    if (!title) throw new BadRequestException({ code: "EVENT_TITLE_REQUIRED" });
    const startsAt = new Date(input.startsAt);
    if (Number.isNaN(startsAt.getTime()) || startsAt.getTime() <= Date.now()) {
      throw new BadRequestException({ code: "EVENT_DATE_INVALID" });
    }
    const endsAt = input.endsAt ? new Date(input.endsAt) : null;
    if (endsAt && endsAt.getTime() <= startsAt.getTime()) {
      throw new BadRequestException({ code: "EVENT_END_INVALID" });
    }
    let imageUrl = input.imageUrl?.trim() || null;
    if (imageUrl && !imageUrl.startsWith("/seed/")) {
      throw new BadRequestException({ code: "IMAGE_NOT_ALLOWED" });
    }
    const host = await this.prisma.user.findUnique({ where: { id: hostId }, include: { profile: true } });
    const priceXaf = Math.max(0, Math.round(input.priceXaf ?? 0));
    const requiresReservation = priceXaf > 0 ? true : Boolean(input.requiresReservation);
    const event = await this.prisma.event.create({
      data: {
        hostId,
        title,
        description: (input.description ?? "").trim().slice(0, 4000),
        imageUrl,
        city: input.city ?? host?.profile?.city ?? "Yaoundé",
        zone: input.zone ?? host?.profile?.zone,
        venue: input.venue?.trim() || null,
        startsAt,
        endsAt,
        priceXaf,
        capacity: input.capacity && input.capacity > 0 ? input.capacity : null,
        minAge: input.minAge && input.minAge > 0 ? input.minAge : null,
        requiresReservation,
        participants: { create: { userId: hostId, status: "HOST" } },
      },
    });
    await this.prisma.post.create({
      data: {
        authorId: hostId,
        body: title,
        imageUrl,
        city: event.city,
        zone: event.zone,
        eventId: event.id,
      },
    });
    return this.get(hostId, event.id);
  }

  async list(viewerId: string, tab: "all" | "mine", city?: string) {
    const now = new Date();
    const where =
      tab === "mine"
        ? {
            OR: [
              { hostId: viewerId },
              { participants: { some: { userId: viewerId, status: { not: "CANCELLED" } } } },
            ],
          }
        : {
            status: "PUBLISHED" as const,
            startsAt: { gt: now },
            ...(city ? { city } : {}),
          };
    const rows = await this.prisma.event.findMany({
      where,
      orderBy: { startsAt: "asc" },
      take: 40,
      include: this.include(),
    });
    return { items: await Promise.all(rows.map((e) => this.map(viewerId, e))) };
  }

  async get(viewerId: string, id: string) {
    const event = await this.prisma.event.findUnique({ where: { id }, include: this.include() });
    if (!event) throw new NotFoundException({ code: "EVENT_NOT_FOUND" });
    return this.map(viewerId, event);
  }

  async toggleInterested(viewerId: string, eventId: string) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException({ code: "EVENT_NOT_FOUND" });
    if (event.hostId === viewerId) throw new BadRequestException({ code: "EVENT_HOST" });
    const existing = await this.prisma.eventParticipant.findUnique({
      where: { eventId_userId: { eventId, userId: viewerId } },
    });
    if (existing?.status === "CONFIRMED" || existing?.status === "RESERVED") {
      throw new BadRequestException({ code: "ALREADY_IN" });
    }
    if (existing?.status === "INTERESTED") {
      await this.prisma.eventParticipant.delete({ where: { id: existing.id } });
      return { interested: false };
    }
    await this.prisma.eventParticipant.upsert({
      where: { eventId_userId: { eventId, userId: viewerId } },
      create: { eventId, userId: viewerId, status: "INTERESTED" },
      update: { status: "INTERESTED" },
    });
    return { interested: true };
  }

  async heartPreview(userId: string, eventId: string) {
    const current = await this.prisma.eventHeart.findFirst({
      where: { userId, releasedAt: null },
      include: { event: { select: { id: true, title: true } } },
    });
    let wouldTransferFrom: { id: string; title: string } | null = null;
    try {
      const plan = planHeartTransfer(current ? { userId, eventId: current.eventId } : null, userId, eventId);
      if (plan.fromEventId && current) wouldTransferFrom = current.event;
    } catch (e) {
      const code = e instanceof Error ? e.message : "HEART_ERROR";
      if (code === "HEART_ALREADY_ON_TARGET") return { alreadyHearted: true, wouldTransferFrom: null };
    }
    return { alreadyHearted: current?.eventId === eventId, wouldTransferFrom };
  }

  async heart(userId: string, eventId: string, confirmTransfer: boolean) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException({ code: "EVENT_NOT_FOUND" });
    const result = await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;
      const current = await tx.eventHeart.findFirst({ where: { userId, releasedAt: null } });
      let plan;
      try {
        plan = planHeartTransfer(current ? { userId, eventId: current.eventId } : null, userId, eventId);
      } catch (e) {
        const code = e instanceof Error ? e.message : "HEART_ERROR";
        throw new ConflictException({ code });
      }
      if (plan.fromEventId && !confirmTransfer) {
        throw new ConflictException({ code: "HEART_TRANSFER_REQUIRED", fromEventId: plan.fromEventId });
      }
      if (plan.fromEventId) {
        await tx.eventHeart.updateMany({
          where: { userId, releasedAt: null },
          data: { releasedAt: new Date() },
        });
      }
      await tx.eventHeart.create({ data: { userId, eventId } });
      return plan;
    });
    return { ok: true, transferredFrom: result.fromEventId };
  }

  async unheart(userId: string, eventId: string) {
    await this.prisma.eventHeart.updateMany({
      where: { userId, eventId, releasedAt: null },
      data: { releasedAt: new Date() },
    });
    return { ok: true };
  }

  async favorites(userId: string) {
    const rows = await this.prisma.eventHeart.findMany({
      where: { userId, releasedAt: null },
      orderBy: { createdAt: "desc" },
      include: { event: { include: this.include() } },
    });
    return { items: await Promise.all(rows.map((r) => this.map(userId, r.event))) };
  }

  include() {
    return {
      host: { include: { profile: true } },
      participants: {
        include: {
          user: { select: { id: true, username: true, firstName: true, lastName: true, certified: true } },
        },
      },
      _count: { select: { hearts: { where: { releasedAt: null } } } },
    };
  }

  async map(
    viewerId: string,
    e: {
      id: string;
      hostId: string;
      title: string;
      description: string;
      imageUrl: string | null;
      city: string;
      zone: string | null;
      venue: string | null;
      startsAt: Date;
      endsAt: Date | null;
      priceXaf: number;
      currency: string;
      capacity: number | null;
      minAge: number | null;
      requiresReservation: boolean;
      status: string;
      createdAt: Date;
      host: {
        id: string;
        username: string;
        firstName: string;
        lastName: string;
        certified: boolean;
        profile: { avatarUrl: string | null } | null;
      };
      participants: Array<{
        userId: string;
        status: string;
        user: { id: string; username: string; firstName: string; lastName: string; certified: boolean };
      }>;
      _count: { hearts: number };
    },
  ) {
    const heart = await this.prisma.eventHeart.findFirst({
      where: { userId: viewerId, eventId: e.id, releasedAt: null },
    });
    const mine = e.participants.find((p) => p.userId === viewerId);
    const taken = e.participants.filter((p) => p.status === "CONFIRMED" || p.status === "RESERVED" || p.status === "HOST")
      .length;
    const ticket = await this.prisma.ticket.findFirst({
      where: { eventId: e.id, holderId: viewerId },
      orderBy: { createdAt: "desc" },
    });
    const isHost = e.hostId === viewerId;
    const seated = ["CONFIRMED", "RESERVED", "HOST", "PRESENT"].includes(mine?.status ?? "");
    return {
      id: e.id,
      title: e.title,
      description: e.description,
      imageUrl: e.imageUrl,
      city: e.city,
      zone: e.zone,
      venue: e.venue,
      startsAt: e.startsAt.toISOString(),
      endsAt: e.endsAt?.toISOString() ?? null,
      priceXaf: e.priceXaf,
      currency: e.currency,
      capacity: e.capacity,
      taken,
      minAge: e.minAge,
      requiresReservation: e.requiresReservation,
      status: e.status,
      createdAt: e.createdAt.toISOString(),
      hearts: e._count.hearts,
      viewerHearted: Boolean(heart),
      viewerInterested: mine?.status === "INTERESTED",
      viewerStatus: mine?.status ?? null,
      isHost,
      canBook: !isHost && (e.requiresReservation || e.priceXaf > 0) && !seated,
      viewerTicketId: ticket?.id ?? null,
      canChatGroup: seated,
      host: {
        id: e.host.id,
        username: e.host.username,
        firstName: e.host.firstName,
        lastName: e.host.lastName,
        certified: e.host.certified,
        avatarUrl: e.host.profile?.avatarUrl ?? null,
      },
      people: e.participants
        .filter((p) => p.status !== "CANCELLED")
        .map((p) => ({ ...p.user, status: p.status })),
    };
  }
}
