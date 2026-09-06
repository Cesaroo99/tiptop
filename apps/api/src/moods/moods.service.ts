import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
  isMoodActive,
  isMoodSoundKey,
  moodExpiresAt,
  moodHasPlace,
  moodPlaceLabel,
  validateMoodCoords,
} from "@tiptop/domain";
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
      placeName?: string;
      address?: string;
      latitude?: number;
      longitude?: number;
      eventId?: string;
      companionId?: string;
      visibility?: string;
      hours?: number;
      soundKey?: string;
      soundLabel?: string;
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
    let companionId: string | null = null;
    if (input.companionId) {
      if (input.companionId === authorId) throw new BadRequestException({ code: "COMPANION_SELF" });
      const companion = await this.prisma.user.findUnique({ where: { id: input.companionId } });
      if (!companion) throw new BadRequestException({ code: "COMPANION_NOT_FOUND" });
      companionId = companion.id;
    }
    let expiresAt: Date;
    try {
      expiresAt = moodExpiresAt(new Date(), input.hours);
    } catch {
      throw new BadRequestException({ code: "MOOD_DURATION_INVALID" });
    }
    const visibility =
      input.visibility === "FOLLOWERS" || input.visibility === "EVENT" ? input.visibility : "ZONE";
    let coords: { latitude: number; longitude: number } | null = null;
    try {
      coords = validateMoodCoords(input.latitude, input.longitude);
    } catch {
      throw new BadRequestException({ code: "MOOD_COORDS_INVALID" });
    }
    const placeName = input.placeName?.trim().slice(0, 120) || null;
    const address = input.address?.trim().slice(0, 240) || null;
    const explicitPlace = moodHasPlace({
      placeName,
      address,
      city: input.city,
      zone: input.zone,
      latitude: coords?.latitude,
      longitude: coords?.longitude,
    });
    const soundKey = isMoodSoundKey(input.soundKey) ? input.soundKey : null;
    const soundLabel = soundKey && soundKey !== "original" ? input.soundLabel?.trim().slice(0, 80) || null : null;
    const mood = await this.prisma.mood.create({
      data: {
        authorId,
        body,
        imageUrl,
        videoUrl,
        activity,
        soundKey,
        soundLabel,
        city: explicitPlace ? input.city?.trim() || null : null,
        zone: explicitPlace ? input.zone?.trim() || null : null,
        placeName: explicitPlace ? placeName : null,
        address: explicitPlace ? address : null,
        latitude: explicitPlace ? coords?.latitude ?? null : null,
        longitude: explicitPlace ? coords?.longitude ?? null : null,
        eventId: input.eventId || null,
        companionId,
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
        companion: {
          select: { id: true, username: true, firstName: true, lastName: true, certified: true, profile: { select: { avatarUrl: true } } },
        },
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
      items: visible.map((m) => this.map(m, extras, likeTimes.get(m.id), followeeIds.has(m.authorId))),
    };
  }

  async get(viewerId: string, id: string) {
    const mood = await this.prisma.mood.findUnique({
      where: { id },
      include: {
        author: { include: { profile: true } },
        event: { select: { id: true, title: true } },
        companion: {
          select: { id: true, username: true, firstName: true, lastName: true, certified: true, profile: { select: { avatarUrl: true } } },
        },
        _count: { select: { comments: true } },
      },
    });
    if (!mood) throw new NotFoundException({ code: "MOOD_NOT_FOUND" });
    if (!isMoodActive(mood.expiresAt)) throw new NotFoundException({ code: "MOOD_EXPIRED" });
    const extras = await this.likeExtras(viewerId, [mood.authorId]);
    const likeTimes = await this.likes.snapshots(viewerId, "mood", [mood.id]);
    const follow = await this.prisma.follow.findFirst({
      where: { followerId: viewerId, followeeId: mood.authorId },
      select: { id: true },
    });
    return this.map(mood, extras, likeTimes.get(mood.id), Boolean(follow));
  }

  async comments(viewerId: string, moodId: string) {
    const mood = await this.prisma.mood.findUnique({ where: { id: moodId } });
    if (!mood) throw new NotFoundException({ code: "MOOD_NOT_FOUND" });
    const rows = await this.prisma.moodComment.findMany({
      where: { moodId },
      orderBy: { createdAt: "asc" },
      include: { author: { include: { profile: { select: { avatarUrl: true } } } } },
    });
    const likeTimes = await this.likes.snapshots(
      viewerId,
      "comment",
      rows.map((c) => c.id),
    );
    return { items: rows.map((c) => this.mapComment(c, likeTimes.get(c.id))) };
  }

  async addComment(authorId: string, moodId: string, body: string, parentId?: string) {
    const text = body.trim();
    if (!text) throw new BadRequestException({ code: "COMMENT_EMPTY" });
    const mood = await this.prisma.mood.findUnique({ where: { id: moodId } });
    if (!mood) throw new NotFoundException({ code: "MOOD_NOT_FOUND" });
    let parent: { id: string; authorId: string } | null = null;
    if (parentId) {
      parent = await this.prisma.moodComment.findFirst({
        where: { id: parentId, moodId },
        select: { id: true, authorId: true },
      });
      if (!parent) throw new BadRequestException({ code: "COMMENT_PARENT_NOT_FOUND" });
    }
    const comment = await this.prisma.moodComment.create({
      data: { moodId, authorId, parentId: parent?.id ?? null, body: text.slice(0, 1000) },
      include: { author: { include: { profile: { select: { avatarUrl: true } } } } },
    });
    await this.notifications.create({
      userId: mood.authorId,
      actorId: authorId,
      type: "COMMENT",
      entityType: "mood",
      entityId: moodId,
    });
    if (parent && parent.authorId !== authorId && parent.authorId !== mood.authorId) {
      await this.notifications.create({
        userId: parent.authorId,
        actorId: authorId,
        type: "COMMENT",
        entityType: "mood",
        entityId: moodId,
      });
    }
    return this.mapComment(comment);
  }

  private mapComment(
    c: {
      id: string;
      body: string;
      parentId?: string | null;
      createdAt: Date;
      author: {
        id: string;
        firstName: string;
        lastName: string;
        username: string;
        certified: boolean;
        profile?: { avatarUrl: string | null } | null;
      };
    },
    likeTime?: {
      totalSeconds: number;
      activeCount: number;
      likedByMe: boolean;
      label: string;
    },
  ) {
    return {
      id: c.id,
      body: c.body,
      parentId: c.parentId ?? null,
      createdAt: c.createdAt.toISOString(),
      likedByMe: likeTime?.likedByMe ?? false,
      likeTime: likeTime
        ? {
            totalSeconds: likeTime.totalSeconds,
            activeCount: likeTime.activeCount,
            likedByMe: likeTime.likedByMe,
            label: likeTime.label,
          }
        : { totalSeconds: 0, activeCount: 0, likedByMe: false, label: "0 s" },
      author: {
        id: c.author.id,
        firstName: c.author.firstName,
        lastName: c.author.lastName,
        username: c.author.username,
        certified: c.author.certified,
        avatarUrl: c.author.profile?.avatarUrl ?? null,
      },
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
      placeName: string | null;
      address: string | null;
      latitude: number | null;
      longitude: number | null;
      expiresAt: Date;
      createdAt: Date;
      visibility: string;
      soundKey?: string | null;
      soundLabel?: string | null;
      event: { id: string; title: string } | null;
      companion: {
        id: string;
        username: string;
        firstName: string;
        lastName: string;
        certified: boolean;
        profile: { avatarUrl: string | null } | null;
      } | null;
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
      hourSeconds?: number;
      daySeconds?: number;
      monthSeconds?: number;
      hourLabel?: string;
      dayLabel?: string;
      monthLabel?: string;
    },
    following = false,
  ) {
    return {
      id: m.id,
      body: m.body,
      imageUrl: m.imageUrl,
      videoUrl: m.videoUrl,
      activity: m.activity,
      city: m.city,
      zone: m.zone,
      placeName: m.placeName,
      address: m.address,
      latitude: m.latitude,
      longitude: m.longitude,
      placeLabel: moodPlaceLabel({
        placeName: m.placeName,
        address: m.address,
        city: m.city,
        zone: m.zone,
        latitude: m.latitude,
        longitude: m.longitude,
      }),
      visibility: m.visibility,
      soundKey: m.soundKey ?? null,
      soundLabel: m.soundLabel ?? null,
      expiresAt: m.expiresAt.toISOString(),
      createdAt: m.createdAt.toISOString(),
      commentsCount: m._count.comments,
      likedAuthor: extras.liked.has(m.author.id),
      following,
      likedByMe: likeTime?.likedByMe ?? false,
      authorActiveLikes: extras.counts.get(m.author.id) ?? 0,
      likeTime: likeTime
        ? {
            totalSeconds: likeTime.totalSeconds,
            activeCount: likeTime.activeCount,
            likedByMe: likeTime.likedByMe,
            label: likeTime.label,
            hourSeconds: likeTime.hourSeconds ?? 0,
            daySeconds: likeTime.daySeconds ?? 0,
            monthSeconds: likeTime.monthSeconds ?? 0,
            hourLabel: likeTime.hourLabel ?? "0",
            dayLabel: likeTime.dayLabel ?? "0",
            monthLabel: likeTime.monthLabel ?? "0",
          }
        : {
            totalSeconds: 0,
            activeCount: 0,
            likedByMe: false,
            label: "0 seconde",
            hourSeconds: 0,
            daySeconds: 0,
            monthSeconds: 0,
            hourLabel: "0",
            dayLabel: "0",
            monthLabel: "0",
          },
      event: m.event,
      companion: m.companion
        ? {
            id: m.companion.id,
            username: m.companion.username,
            firstName: m.companion.firstName,
            lastName: m.companion.lastName,
            certified: m.companion.certified,
            avatarUrl: m.companion.profile?.avatarUrl ?? null,
          }
        : null,
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
