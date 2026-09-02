import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { isMoodActive, moodExpiresAt } from "@tiptop/domain";
import { PrismaService } from "../prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { LikesService } from "../likes/likes.service";

@Injectable()
export class MoodsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(NotificationsService) private readonly notifications: NotificationsService,
    @Inject(LikesService) private readonly likes: LikesService,
  ) {}

  async create(
    authorId: string,
    input: {
      body?: string;
      imageUrl?: string;
      videoUrl?: string;
      activity?: string;
      city?: string;
      zone?: string;
      eventId?: string;
      visibility?: string;
      hours?: number;
    },
  ) {
    const body = (input.body ?? "").trim();
    const activity = (input.activity ?? "").trim().slice(0, 80) || null;
    let imageUrl = input.imageUrl?.trim() || null;
    if (imageUrl && !imageUrl.startsWith("/seed/")) {
      throw new BadRequestException({ code: "IMAGE_NOT_ALLOWED" });
    }
    let videoUrl = input.videoUrl?.trim() || null;
    if (videoUrl && !videoUrl.startsWith("/seed/") && !videoUrl.startsWith("/uploads/")) {
      throw new BadRequestException({ code: "VIDEO_NOT_ALLOWED" });
    }
    if (videoUrl) imageUrl = null;
    if (!body && !imageUrl && !videoUrl && !activity) throw new BadRequestException({ code: "MOOD_EMPTY" });
    if (input.eventId) {
      const ev = await this.prisma.event.findUnique({ where: { id: input.eventId } });
      if (!ev) throw new BadRequestException({ code: "EVENT_NOT_FOUND" });
    }
    let expiresAt: Date;
    try {
      expiresAt = moodExpiresAt(new Date(), input.hours);
    } catch {
      throw new BadRequestException({ code: "MOOD_DURATION_INVALID" });
    }
    const visibility =
      input.visibility === "FOLLOWERS" || input.visibility === "EVENT" ? input.visibility : "ZONE";
    const author = await this.prisma.user.findUnique({ where: { id: authorId }, include: { profile: true } });
    const mood = await this.prisma.mood.create({
      data: {
        authorId,
        body,
        imageUrl,
        videoUrl,
        activity,
        city: input.city ?? author?.profile?.city ?? null,
        zone: input.zone ?? author?.profile?.zone ?? null,
        eventId: input.eventId || null,
        visibility,
        expiresAt,
      },
    });
    return this.get(authorId, mood.id);
  }

  async list(viewerId: string) {
    const now = new Date();
    const viewer = await this.prisma.user.findUnique({
      where: { id: viewerId },
      include: { profile: true, following: true },
    });
    const followeeIds = new Set((viewer?.following ?? []).map((f) => f.followeeId));
    const rows = await this.prisma.mood.findMany({
      where: { expiresAt: { gt: now } },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        author: { include: { profile: true } },
        event: { select: { id: true, title: true } },
        _count: { select: { comments: true } },
      },
    });
    const visible = rows.filter((m) => {
      if (m.authorId === viewerId) return true;
      if (m.visibility === "FOLLOWERS") return followeeIds.has(m.authorId);
      if (m.visibility === "EVENT") return Boolean(m.eventId);
      const city = viewer?.profile?.city;
      return !city || m.author.profile?.city === city;
    });
    const extras = await this.likeExtras(
      viewerId,
      visible.map((m) => m.authorId),
    );
    const likeTimes = await this.likes.snapshots(
      viewerId,
      "mood",
      visible.map((m) => m.id),
    );
    return {
      items: visible.map((m) => this.map(m, extras, likeTimes.get(m.id))),
    };
  }

  async get(viewerId: string, id: string) {
    const mood = await this.prisma.mood.findUnique({
      where: { id },
      include: {
        author: { include: { profile: true } },
        event: { select: { id: true, title: true } },
        _count: { select: { comments: true } },
      },
    });
    if (!mood) throw new NotFoundException({ code: "MOOD_NOT_FOUND" });
    if (!isMoodActive(mood.expiresAt)) throw new NotFoundException({ code: "MOOD_EXPIRED" });
    const extras = await this.likeExtras(viewerId, [mood.authorId]);
    const likeTimes = await this.likes.snapshots(viewerId, "mood", [mood.id]);
    return this.map(mood, extras, likeTimes.get(mood.id));
  }

  async comments(moodId: string) {
    const mood = await this.prisma.mood.findUnique({ where: { id: moodId } });
    if (!mood) throw new NotFoundException({ code: "MOOD_NOT_FOUND" });
    const rows = await this.prisma.moodComment.findMany({
      where: { moodId },
      orderBy: { createdAt: "asc" },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, username: true, certified: true } },
      },
    });
    return {
      items: rows.map((c) => ({
        id: c.id,
        body: c.body,
        createdAt: c.createdAt.toISOString(),
        author: c.author,
      })),
    };
  }

  async addComment(authorId: string, moodId: string, body: string) {
    const text = body.trim();
    if (!text) throw new BadRequestException({ code: "COMMENT_EMPTY" });
    const mood = await this.prisma.mood.findUnique({ where: { id: moodId } });
    if (!mood) throw new NotFoundException({ code: "MOOD_NOT_FOUND" });
    const comment = await this.prisma.moodComment.create({
      data: { moodId, authorId, body: text.slice(0, 1000) },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, username: true, certified: true } },
      },
    });
    await this.notifications.create({
      userId: mood.authorId,
      actorId: authorId,
      type: "COMMENT",
      entityType: "mood",
      entityId: moodId,
    });
    return {
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt.toISOString(),
      author: comment.author,
    };
  }

  private async likeExtras(viewerId: string, authorIds: string[]) {
    const unique = [...new Set(authorIds)];
    const [likes, counts] = await Promise.all([
      this.prisma.likeAllocation.findMany({
        where: { releasedAt: null, toUserId: { in: unique }, unit: { ownerId: viewerId } },
        select: { toUserId: true },
      }),
      this.prisma.likeAllocation.groupBy({
        by: ["toUserId"],
        where: { releasedAt: null, toUserId: { in: unique } },
        _count: { _all: true },
      }),
    ]);
    return {
      liked: new Set(likes.map((l) => l.toUserId)),
      counts: new Map(counts.map((c) => [c.toUserId, c._count._all])),
    };
  }

  private map(
    m: {
      id: string;
      body: string;
      imageUrl: string | null;
      videoUrl: string | null;
      activity: string | null;
      city: string | null;
      zone: string | null;
      expiresAt: Date;
      createdAt: Date;
      visibility: string;
      event: { id: string; title: string } | null;
      author: {
        id: string;
        username: string;
        firstName: string;
        lastName: string;
        certified: boolean;
        profile: { avatarUrl: string | null; city: string | null; zone: string | null } | null;
      };
      _count: { comments: number };
    },
    extras: { liked: Set<string>; counts: Map<string, number> },
    likeTime?: {
      totalSeconds: number;
      activeCount: number;
      likedByMe: boolean;
      label: string;
    },
  ) {
    return {
      id: m.id,
      body: m.body,
      imageUrl: m.imageUrl,
      videoUrl: m.videoUrl,
      activity: m.activity,
      city: m.city,
      zone: m.zone,
      visibility: m.visibility,
      expiresAt: m.expiresAt.toISOString(),
      createdAt: m.createdAt.toISOString(),
      commentsCount: m._count.comments,
      likedAuthor: extras.liked.has(m.author.id),
      likedByMe: likeTime?.likedByMe ?? false,
      authorActiveLikes: extras.counts.get(m.author.id) ?? 0,
      likeTime: likeTime
        ? {
            totalSeconds: likeTime.totalSeconds,
            activeCount: likeTime.activeCount,
            likedByMe: likeTime.likedByMe,
            label: likeTime.label,
          }
        : { totalSeconds: 0, activeCount: 0, likedByMe: false, label: "0 seconde" },
      event: m.event,
      author: {
        id: m.author.id,
        username: m.author.username,
        firstName: m.author.firstName,
        lastName: m.author.lastName,
        certified: m.author.certified,
        avatarUrl: m.author.profile?.avatarUrl ?? null,
        city: m.author.profile?.city ?? null,
      },
    };
  }
}
