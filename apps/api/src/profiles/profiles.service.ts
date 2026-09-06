import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { FollowsService } from "../follows/follows.service";
import { LikesService } from "../likes/likes.service";
import { PostsService } from "../posts/posts.service";

@Injectable()
export class ProfilesService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(FollowsService) private readonly follows: FollowsService,
    @Inject(LikesService) private readonly likes: LikesService,
    @Inject(PostsService) private readonly posts: PostsService,
  ) {}

  async byUsername(viewerId: string, username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: { profile: true },
    });
    if (!user || user.status !== "ACTIVE") throw new NotFoundException({ code: "USER_NOT_FOUND" });
    const isSelf = viewerId === user.id;
    const [followCounts, following, friendship, likePreview, likeStats, posts, hosted, interested, attending, moods] =
      await Promise.all([
        this.follows.counts(user.id),
        this.follows.isFollowing(viewerId, user.id),
        this.prisma.contact.findUnique({
          where: { ownerId_personId: { ownerId: viewerId, personId: user.id } },
          select: { id: true },
        }),
        this.likes.preview(viewerId, user.id).catch(() => ({
          alreadyLiked: false,
          availableUnits: 0,
          wouldTransferFrom: null,
        })),
        this.likes.statsFor(user.id),
        this.posts.listByAuthor(viewerId, user.id),
        this.prisma.event.findMany({
          where: { hostId: user.id, status: { not: "CANCELLED" }, wanted: false },
          orderBy: { startsAt: "desc" },
          take: 8,
          include: { host: { include: { profile: true } }, participants: true },
        }),
        this.prisma.event.findMany({
          where: {
            status: { not: "CANCELLED" },
            OR: [
              { participants: { some: { userId: user.id, status: "INTERESTED" } } },
              { hostId: user.id, wanted: true },
            ],
          },
          orderBy: { startsAt: "asc" },
          take: 12,
          include: { host: { include: { profile: true } }, participants: true },
        }),
        this.prisma.event.findMany({
          where: {
            hostId: { not: user.id },
            status: { not: "CANCELLED" },
            participants: {
              some: {
                userId: user.id,
                status: { in: ["RESERVED", "CONFIRMED", "PRESENT"] },
                ...(isSelf ? {} : { showOnProfile: true }),
              },
            },
          },
          orderBy: { startsAt: "desc" },
          take: 8,
          include: { host: { include: { profile: true } }, participants: true },
        }),
        this.prisma.mood.findMany({
          where: { authorId: user.id, expiresAt: { gt: new Date() } },
          orderBy: { createdAt: "desc" },
          take: 12,
        }),
      ]);
    return {
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      certified: user.certified,
      profession: user.profile?.profession ?? null,
      bio: user.profile?.bio ?? null,
      avatarUrl: user.profile?.avatarUrl ?? null,
      coverUrl: user.profile?.coverUrl ?? null,
      city: user.profile?.city ?? null,
      zone: user.profile?.zone ?? null,
      country: user.profile?.country ?? "CM",
      website: user.profile?.website ?? null,
      availability: user.profile?.availability ?? "HIDDEN",
      availabilityUntil: user.profile?.availabilityUntil?.toISOString() ?? null,
      locationPrecision: user.profile?.locationPrecision ?? "ZONE",
      isSelf,
      isFriend: Boolean(friendship) && !isSelf,
      following,
      followersCount: followCounts.followers,
      followingCount: followCounts.following,
      likedByMe: likePreview.alreadyLiked,
      likePreview,
      likeStats,
      posts,
      eventsInterested: interested.map((e) => previewEvent(e, user.id)),
      eventsLinked: [...hosted, ...attending]
        .filter((e, i, all) => all.findIndex((x) => x.id === e.id) === i)
        .map((e) => previewEvent(e, user.id)),
      moods: moods.map((m) => ({
        id: m.id,
        body: m.body,
        imageUrl: m.imageUrl,
        videoUrl: m.videoUrl,
        expiresAt: m.expiresAt.toISOString(),
      })),
    };
  }
}

function previewEvent(
  e: {
    id: string;
    title: string;
    imageUrl: string | null;
    city: string;
    zone: string | null;
    startsAt: Date;
    minAge: number | null;
    hostId: string;
    wanted: boolean;
    host: { firstName: string; lastName: string; profile: { avatarUrl: string | null } | null };
    participants: Array<{ userId: string; status: string; showOnProfile: boolean }>;
  },
  ownerId: string,
) {
  const mine = e.participants.find((p) => p.userId === ownerId);
  return {
    id: e.id,
    title: e.title,
    imageUrl: e.imageUrl,
    city: e.city,
    zone: e.zone,
    startsAt: e.startsAt.toISOString(),
    minAge: e.minAge,
    taken: e.participants.filter((p) => ["RESERVED", "CONFIRMED", "PRESENT", "HOST"].includes(p.status)).length,
    hosted: e.hostId === ownerId,
    wanted: e.wanted,
    showOnProfile: e.hostId === ownerId ? true : Boolean(mine?.showOnProfile),
    host: {
      firstName: e.host.firstName,
      lastName: e.host.lastName,
      avatarUrl: e.host.profile?.avatarUrl ?? null,
    },
  };
}
