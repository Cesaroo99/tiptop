import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { eventIsFull, remainingSeats, seatedGuestCount } from "@tiptop/domain";
import { PrismaService } from "../prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { LikesService } from "../likes/likes.service";

const MAX_BODY = 2000;
const MAX_IMAGES = 8;

function parseImageUrls(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return [
    ...new Set(
      raw
        .map((u) => (typeof u === "string" ? u.trim() : ""))
        .filter((u) => u.startsWith("/seed/")),
    ),
  ].slice(0, MAX_IMAGES);
}

function resolvePostImages(imageUrl: string | null | undefined, imageUrls: unknown): { imageUrl: string | null; imageUrls: string[] } {
  const extra = parseImageUrls(imageUrls);
  const first = imageUrl?.trim() && imageUrl.startsWith("/seed/") ? imageUrl.trim() : extra[0] ?? null;
  const all = first ? [first, ...extra.filter((u) => u !== first)] : extra;
  const unique = [...new Set(all)].slice(0, MAX_IMAGES);
  return { imageUrl: unique[0] ?? null, imageUrls: unique };
}

const POST_INCLUDE = {
  author: { include: { profile: true } },
  event: {
    select: {
      id: true,
      title: true,
      startsAt: true,
      minAge: true,
      city: true,
      zone: true,
      venue: true,
      address: true,
      latitude: true,
      longitude: true,
      capacity: true,
      requiresReservation: true,
      priceXaf: true,
      hostId: true,
      status: true,
      endsAt: true,
      recurrence: true,
      seriesId: true,
      participants: { select: { status: true, userId: true } },
    },
  },
  _count: { select: { comments: true } },
} as const;

@Injectable()
export class PostsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(NotificationsService) private readonly notifications: NotificationsService,
    @Inject(LikesService) private readonly likes: LikesService,
  ) {}

  mapPost(
    p: {
      id: string;
      body: string;
      imageUrl: string | null;
      imageUrls?: unknown;
      city: string | null;
      zone: string | null;
      createdAt: Date;
      author: {
        id: string;
        username: string;
        firstName: string;
        lastName: string;
        certified: boolean;
        profile: {
          avatarUrl: string | null;
          availability?: string;
          availabilityUntil?: Date | null;
        } | null;
      };
      _count: { comments: number };
      event?: {
        id: string;
        title: string;
        startsAt: Date;
        minAge: number | null;
        city?: string | null;
        zone?: string | null;
        venue?: string | null;
        address?: string | null;
        latitude?: number | null;
        longitude?: number | null;
        capacity?: number | null;
        requiresReservation?: boolean;
        priceXaf?: number;
        hostId?: string;
        status?: string;
        endsAt?: Date | null;
        recurrence?: string;
        seriesId?: string | null;
        participants: Array<{ status: string; userId?: string }>;
      } | null;
    },
    extra: {
      viewerId: string;
      likedAuthor: boolean;
      viewerFollows: boolean;
      authorLikes: number;
      likedByMe: boolean;
      likeTime: {
        totalSeconds: number;
        activeCount: number;
        likedByMe: boolean;
        label: string;
      };
    },
  ) {
    const until = p.author.profile?.availabilityUntil;
    const available =
      p.author.profile?.availability === "AVAILABLE" && Boolean(until && until.getTime() > Date.now());
    const taken = p.event ? seatedGuestCount(p.event.participants) : 0;
    const remaining = p.event ? remainingSeats(p.event.capacity, taken) : null;
    const seated =
      p.event?.participants.some(
        (x) => x.userId === extra.viewerId && ["RESERVED", "CONFIRMED", "PRESENT", "HOST"].includes(x.status),
      ) ?? false;
    const isHost = p.event?.hostId === extra.viewerId;
    const event = p.event
      ? {
          id: p.event.id,
          title: p.event.title,
          startsAt: p.event.startsAt.toISOString(),
          minAge: p.event.minAge,
          city: p.event.city ?? p.city,
          zone: p.event.zone ?? p.zone,
          venue: p.event.venue ?? null,
          address: p.event.address ?? null,
          latitude: p.event.latitude ?? null,
          longitude: p.event.longitude ?? null,
          capacity: p.event.capacity ?? null,
          remaining,
          interestedCount: p.event.participants.filter((x) => x.status === "INTERESTED").length,
          reservedCount: taken,
          viewerInterested: p.event.participants.some(
            (x) => x.userId === extra.viewerId && x.status === "INTERESTED",
          ),
          canBook: !isHost && !eventIsFull(p.event.capacity, taken),
          viewerReserved: seated && !isHost,
          isHost,
          status: p.event.status ?? "PUBLISHED",
          endsAt: p.event.endsAt?.toISOString() ?? null,
          recurrence: p.event.recurrence ?? "NONE",
          seriesId: p.event.seriesId ?? null,
          priceXaf: p.event.priceXaf ?? 0,
        }
      : null;
    const images = resolvePostImages(p.imageUrl, p.imageUrls);
    return {
      id: p.id,
      body: p.body,
      imageUrl: images.imageUrl,
      imageUrls: images.imageUrls,
      city: p.city,
      zone: p.zone,
      createdAt: p.createdAt.toISOString(),
      commentsCount: p._count.comments,
      sharesCount: 0,
      likedAuthor: extra.likedAuthor,
      likedByMe: extra.likedByMe,
      viewerFollows: extra.viewerFollows,
      authorActiveLikes: extra.authorLikes,
      likeTime: extra.likeTime,
      author: {
        id: p.author.id,
        username: p.author.username,
        firstName: p.author.firstName,
        lastName: p.author.lastName,
        certified: p.author.certified,
        avatarUrl: p.author.profile?.avatarUrl ?? null,
        available,
      },
      event,
    };
  }

  private async extras(viewerId: string, authorIds: string[]) {
    const unique = [...new Set(authorIds)];
    const [likes, follows, likeCounts] = await Promise.all([
      this.prisma.likeAllocation.findMany({
        where: { releasedAt: null, toUserId: { in: unique }, unit: { ownerId: viewerId } },
        select: { toUserId: true },
      }),
      this.prisma.follow.findMany({
        where: { followerId: viewerId, followeeId: { in: unique } },
        select: { followeeId: true },
      }),
      this.prisma.likeAllocation.groupBy({
        by: ["toUserId"],
        where: { releasedAt: null, toUserId: { in: unique } },
        _count: { _all: true },
      }),
    ]);
    const liked = new Set(likes.map((l) => l.toUserId));
    const following = new Set(follows.map((f) => f.followeeId));
    const counts = new Map(likeCounts.map((c) => [c.toUserId, c._count._all]));
    return { liked, following, counts };
  }

  async decorate(
    viewerId: string,
    posts: Array<{
      id: string;
      body: string;
      imageUrl: string | null;
      imageUrls?: unknown;
      city: string | null;
      zone: string | null;
      createdAt: Date;
      author: {
        id: string;
        username: string;
        firstName: string;
        lastName: string;
        certified: boolean;
        profile: {
          avatarUrl: string | null;
          availability?: string;
          availabilityUntil?: Date | null;
        } | null;
      };
      _count: { comments: number };
      event?: {
        id: string;
        title: string;
        startsAt: Date;
        minAge: number | null;
        city?: string | null;
        zone?: string | null;
        venue?: string | null;
        address?: string | null;
        latitude?: number | null;
        longitude?: number | null;
        capacity?: number | null;
        requiresReservation?: boolean;
        priceXaf?: number;
        hostId?: string;
        status?: string;
        endsAt?: Date | null;
        recurrence?: string;
        seriesId?: string | null;
        participants: Array<{ status: string; userId?: string }>;
      } | null;
    }>,
  ) {
    const extras = await this.extras(
      viewerId,
      posts.map((p) => p.author.id),
    );
    const likeTimes = await this.likes.snapshots(
      viewerId,
      "post",
      posts.map((p) => p.id),
    );
    const empty = { totalSeconds: 0, activeCount: 0, likedByMe: false, label: "0 seconde" };
    return posts.map((p) => {
      const snap = likeTimes.get(p.id);
      return this.mapPost(p, {
        viewerId,
        likedAuthor: extras.liked.has(p.author.id),
        viewerFollows: extras.following.has(p.author.id),
        authorLikes: extras.counts.get(p.author.id) ?? 0,
        likedByMe: snap?.likedByMe ?? false,
        likeTime: snap
          ? {
              totalSeconds: snap.totalSeconds,
              activeCount: snap.activeCount,
              likedByMe: snap.likedByMe,
              label: snap.label,
            }
          : empty,
      });
    });
  }

  async create(authorId: string, input: { body: string; city?: string; zone?: string; imageUrl?: string; imageUrls?: string[] }) {
    const body = input.body.trim();
    if (!body) throw new BadRequestException({ code: "POST_EMPTY" });
    if (body.length > MAX_BODY) throw new BadRequestException({ code: "POST_TOO_LONG" });
    const images = resolvePostImages(input.imageUrl, input.imageUrls);
    if ((input.imageUrl || (input.imageUrls && input.imageUrls.length)) && images.imageUrls.length === 0) {
      throw new BadRequestException({ code: "IMAGE_NOT_ALLOWED" });
    }
    const author = await this.prisma.user.findUnique({
      where: { id: authorId },
      include: { profile: true },
    });
    const post = await this.prisma.post.create({
      data: {
        authorId,
        body,
        imageUrl: images.imageUrl,
        imageUrls: images.imageUrls.length ? images.imageUrls : undefined,
        city: input.city ?? author?.profile?.city,
        zone: input.zone ?? author?.profile?.zone,
      },
      include: POST_INCLUDE,
    });
    const [item] = await this.decorate(authorId, [post]);
    return item;
  }

  async get(viewerId: string, id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: POST_INCLUDE,
    });
    if (!post || post.hiddenAt) throw new NotFoundException({ code: "POST_NOT_FOUND" });
    const [item] = await this.decorate(viewerId, [post]);
    return item;
  }

  async listByAuthor(viewerId: string, authorId: string) {
    const posts = await this.prisma.post.findMany({
      where: { authorId, hiddenAt: null },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: POST_INCLUDE,
    });
    return this.decorate(viewerId, posts);
  }

  /** Suppression par l'auteur (#20). Une publication liée à un événement se gère
   * depuis l'événement (modifier/annuler), pas via une suppression directe du post. */
  async delete(authorId: string, postId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException({ code: "POST_NOT_FOUND" });
    if (post.authorId !== authorId) throw new ForbiddenException({ code: "NOT_AUTHOR" });
    if (post.eventId) throw new BadRequestException({ code: "POST_LINKED_TO_EVENT" });
    await this.prisma.post.delete({ where: { id: postId } });
    return { ok: true };
  }

  async comments(postId: string, viewerId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post || post.hiddenAt) throw new NotFoundException({ code: "POST_NOT_FOUND" });
    const rows = await this.prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: "asc" },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, username: true, certified: true, profile: { select: { avatarUrl: true } } } },
      },
    });
    const likeTimes = await this.likes.snapshots(
      viewerId,
      "comment",
      rows.map((c) => c.id),
    );
    return {
      items: rows.map((c) => {
        const snap = likeTimes.get(c.id);
        return {
          id: c.id,
          body: c.body,
          createdAt: c.createdAt.toISOString(),
          author: { ...c.author, avatarUrl: c.author.profile?.avatarUrl ?? null },
          likedByMe: snap?.likedByMe ?? false,
          likeTime: snap
            ? {
                totalSeconds: snap.totalSeconds,
                activeCount: snap.activeCount,
                likedByMe: snap.likedByMe,
                label: snap.label,
              }
            : { totalSeconds: 0, activeCount: 0, likedByMe: false, label: "0 seconde" },
        };
      }),
    };
  }

  async addComment(authorId: string, postId: string, body: string) {
    const text = body.trim();
    if (!text) throw new BadRequestException({ code: "COMMENT_EMPTY" });
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post || post.hiddenAt) throw new NotFoundException({ code: "POST_NOT_FOUND" });
    const comment = await this.prisma.comment.create({
      data: { postId, authorId, body: text.slice(0, 1000) },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, username: true, certified: true } },
      },
    });
    await this.notifications.create({
      userId: post.authorId,
      actorId: authorId,
      type: "COMMENT",
      entityType: "post",
      entityId: postId,
    });
    return {
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt.toISOString(),
      author: comment.author,
    };
  }
}
