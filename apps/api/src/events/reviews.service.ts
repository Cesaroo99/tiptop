import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
  assertReviewBody,
  assertReviewRating,
  canLeaveReview,
  eventEndedAt,
  reviewOpensAt,
} from "@tiptop/domain";
import { PrismaService } from "../prisma.service";
import { NotificationsService } from "../notifications/notifications.service";

const PERSON = { select: { id: true, username: true, firstName: true, lastName: true, certified: true } };

@Injectable()
export class ReviewsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(NotificationsService) private readonly notifications: NotificationsService,
  ) {}

  async list(eventId: string) {
    const items = await this.prisma.eventReview.findMany({
      where: { eventId },
      orderBy: { createdAt: "desc" },
      include: { author: PERSON },
    });
    return {
      items: items.map((r) => ({
        id: r.id,
        body: r.body,
        createdAt: r.createdAt.toISOString(),
        author: r.author,
      })),
    };
  }

  async gate(viewerId: string, eventId: string) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException({ code: "EVENT_NOT_FOUND" });
    const [ticket, participant, existing] = await Promise.all([
      this.prisma.ticket.findFirst({
        where: { eventId, holderId: viewerId, status: "CONSUMED" },
      }),
      this.prisma.eventParticipant.findUnique({
        where: { eventId_userId: { eventId, userId: viewerId } },
      }),
      this.prisma.eventReview.findUnique({
        where: { eventId_authorId: { eventId, authorId: viewerId } },
      }),
    ]);
    const endedAt = eventEndedAt(event.startsAt, event.endsAt);
    const opensAt = reviewOpensAt(endedAt);
    const attended = Boolean(ticket) || participant?.status === "PRESENT";
    const reason = canLeaveReview({
      isHost: event.hostId === viewerId,
      attended,
      alreadyReviewed: Boolean(existing),
      eventStatus: event.status,
      opensAt,
    });
    return {
      reason,
      canReview: reason === "OK",
      opensAt: opensAt.toISOString(),
      reviewed: Boolean(existing),
      event: { id: event.id, title: event.title, status: event.status },
    };
  }

  async create(viewerId: string, eventId: string, input: { body: string; rating?: number | null }) {
    const g = await this.gate(viewerId, eventId);
    if (g.reason !== "OK") throw new BadRequestException({ code: `REVIEW_${g.reason}` });
    let body: string;
    let rating: number | null;
    try {
      body = assertReviewBody(input.body);
      rating = assertReviewRating(input.rating ?? null);
    } catch (e) {
      throw new BadRequestException({ code: e instanceof Error ? e.message : "REVIEW_INVALID" });
    }
    try {
      const row = await this.prisma.eventReview.create({
        data: { eventId, authorId: viewerId, body, rating },
        include: { author: PERSON },
      });
      const event = await this.prisma.event.findUnique({ where: { id: eventId }, select: { hostId: true } });
      if (event && event.hostId !== viewerId) {
        await this.notifications.create({
          userId: event.hostId,
          actorId: viewerId,
          type: "REVIEW",
          entityType: "event",
          entityId: eventId,
        });
      }
      return {
        id: row.id,
        body: row.body,
        createdAt: row.createdAt.toISOString(),
        author: row.author,
      };
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code === "P2002") throw new BadRequestException({ code: "REVIEW_ALREADY" });
      throw e;
    }
  }

  async pending(viewerId: string) {
    const tickets = await this.prisma.ticket.findMany({
      where: { holderId: viewerId, status: "CONSUMED" },
      include: { event: true },
      take: 40,
    });
    const present = await this.prisma.eventParticipant.findMany({
      where: { userId: viewerId, status: "PRESENT" },
      include: { event: true },
      take: 40,
    });
    const byId = new Map<string, (typeof tickets)[number]["event"]>();
    for (const t of tickets) byId.set(t.event.id, t.event);
    for (const p of present) byId.set(p.event.id, p.event);
    const items = [];
    for (const event of byId.values()) {
      const existing = await this.prisma.eventReview.findUnique({
        where: { eventId_authorId: { eventId: event.id, authorId: viewerId } },
      });
      const opensAt = reviewOpensAt(eventEndedAt(event.startsAt, event.endsAt));
      const reason = canLeaveReview({
        isHost: event.hostId === viewerId,
        attended: true,
        alreadyReviewed: Boolean(existing),
        eventStatus: event.status,
        opensAt,
      });
      if (reason !== "OK") continue;
      items.push({
        eventId: event.id,
        title: event.title,
        opensAt: opensAt.toISOString(),
      });
    }
    return { items };
  }
}
