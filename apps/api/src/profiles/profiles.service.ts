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
    const [followCounts, following, likePreview, likeStats, posts] = await Promise.all([
      this.follows.counts(user.id),
      this.follows.isFollowing(viewerId, user.id),
      this.likes.preview(viewerId, user.id).catch(() => ({
        alreadyLiked: false,
        availableUnits: 0,
        wouldTransferFrom: null,
      })),
      this.likes.statsFor(user.id),
      this.posts.listByAuthor(viewerId, user.id),
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
      website: user.profile?.website ?? null,
      availability: user.profile?.availability ?? "HIDDEN",
      isSelf: viewerId === user.id,
      following,
      followersCount: followCounts.followers,
      followingCount: followCounts.following,
      likedByMe: likePreview.alreadyLiked,
      likePreview,
      likeStats,
      posts,
    };
  }
}
