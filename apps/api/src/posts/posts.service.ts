import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { NotificationsService } from "../notifications/notifications.service";

const MAX_BODY = 2000;

@Injectable()
export class PostsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(NotificationsService) private readonly notifications: NotificationsService,
  ) {}

  mapPost(
    p: {
      id: string;
      body: string;
      imageUrl: string | null;
      city: string | null;
      zone: string | null;
      createdAt: Date;
      author: {
        id: string;
        username: string;
        firstName: string;
        lastName: string;
        certified: boolean;
        profile: { avatarUrl: string | null } | null;
      };
      _count: { comments: number };
    },
    extra: { likedAuthor: boolean; viewerFollows: boolean; authorLikes: number },
  ) {
    return {
      id: p.id,
      body: p.body,
      imageUrl: p.imageUrl,
      city: p.city,
      zone: p.zone,
      createdAt: p.createdAt.toISOString(),
      commentsCount: p._count.comments,
      likedAuthor: extra.likedAuthor,
      viewerFollows: extra.viewerFollows,
      authorActiveLikes: extra.authorLikes,
      author: {
        id: p.author.id,
        username: p.author.username,
        firstName: p.author.firstName,
        lastName: p.author.lastName,
        certified: p.author.certified,
        avatarUrl: p.author.profile?.avatarUrl ?? null,
      },
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
      city: string | null;
      zone: string | null;
      createdAt: Date;
      author: {
        id: string;
        username: string;
        firstName: string;
        lastName: string;
        certified: boolean;
        profile: { avatarUrl: string | null } | null;
      };
      _count: { comments: number };
    }>,
  ) {
    const extras = await this.extras(
      viewerId,
      posts.map((p) => p.author.id),
    );
    return posts.map((p) =>
      this.mapPost(p, {
        likedAuthor: extras.liked.has(p.author.id),
        viewerFollows: extras.following.has(p.author.id),
        authorLikes: extras.counts.get(p.author.id) ?? 0,
      }),
    );
  }

  async create(authorId: string, input: { body: string; city?: string; zone?: string; imageUrl?: string }) {
    const body = input.body.trim();
    if (!body) throw new BadRequestException({ code: "POST_EMPTY" });
    if (body.length > MAX_BODY) throw new BadRequestException({ code: "POST_TOO_LONG" });
    let imageUrl = input.imageUrl?.trim() || null;
    if (imageUrl && !imageUrl.startsWith("/seed/")) {
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
        imageUrl,
        city: input.city ?? author?.profile?.city,
        zone: input.zone ?? author?.profile?.zone,
      },
      include: {
        author: { include: { profile: true } },
        _count: { select: { comments: true } },
      },
    });
    const [item] = await this.decorate(authorId, [post]);
    return item;
  }

  async get(viewerId: string, id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        author: { include: { profile: true } },
        _count: { select: { comments: true } },
      },
    });
    if (!post) throw new NotFoundException({ code: "POST_NOT_FOUND" });
    const [item] = await this.decorate(viewerId, [post]);
    return item;
  }

  async listByAuthor(viewerId: string, authorId: string) {
    const posts = await this.prisma.post.findMany({
      where: { authorId },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        author: { include: { profile: true } },
        _count: { select: { comments: true } },
      },
    });
    return this.decorate(viewerId, posts);
  }

  async comments(postId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException({ code: "POST_NOT_FOUND" });
    const rows = await this.prisma.comment.findMany({
      where: { postId },
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

  async addComment(authorId: string, postId: string, body: string) {
    const text = body.trim();
    if (!text) throw new BadRequestException({ code: "COMMENT_EMPTY" });
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException({ code: "POST_NOT_FOUND" });
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
