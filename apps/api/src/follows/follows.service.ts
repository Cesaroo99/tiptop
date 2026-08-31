import { BadRequestException, ConflictException, Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { NotificationsService } from "../notifications/notifications.service";

@Injectable()
export class FollowsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(NotificationsService) private readonly notifications: NotificationsService,
  ) {}

  async follow(followerId: string, followeeId: string) {
    if (followerId === followeeId) throw new BadRequestException({ code: "FOLLOW_SELF" });
    try {
      await this.prisma.follow.create({ data: { followerId, followeeId } });
    } catch {
      throw new ConflictException({ code: "ALREADY_FOLLOWING" });
    }
    await this.notifications.create({
      userId: followeeId,
      actorId: followerId,
      type: "FOLLOW",
      entityType: "user",
      entityId: followeeId,
    });
    return { ok: true, following: true };
  }

  async unfollow(followerId: string, followeeId: string) {
    await this.prisma.follow.deleteMany({ where: { followerId, followeeId } });
    return { ok: true, following: false };
  }

  async isFollowing(followerId: string, followeeId: string) {
    const row = await this.prisma.follow.findUnique({
      where: { followerId_followeeId: { followerId, followeeId } },
    });
    return Boolean(row);
  }

  async counts(userId: string) {
    const [followers, following] = await Promise.all([
      this.prisma.follow.count({ where: { followeeId: userId } }),
      this.prisma.follow.count({ where: { followerId: userId } }),
    ]);
    return { followers, following };
  }
}
