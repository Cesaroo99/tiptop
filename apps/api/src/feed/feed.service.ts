import { Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";

@Injectable()
export class FeedService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async list() {
    const posts = await this.prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        author: { include: { profile: true } },
        _count: { select: { comments: true } },
      },
    });
    return {
      items: posts.map((p) => ({
        id: p.id,
        body: p.body,
        imageUrl: p.imageUrl,
        city: p.city,
        zone: p.zone,
        createdAt: p.createdAt.toISOString(),
        commentsCount: p._count.comments,
        author: {
          id: p.author.id,
          username: p.author.username,
          firstName: p.author.firstName,
          lastName: p.author.lastName,
          certified: p.author.certified,
          avatarUrl: p.author.profile?.avatarUrl ?? null,
        },
      })),
    };
  }
}
