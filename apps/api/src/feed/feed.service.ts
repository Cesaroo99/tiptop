import { Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { PostsService } from "../posts/posts.service";

@Injectable()
export class FeedService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(PostsService) private readonly posts: PostsService,
  ) {}

  async list(viewerId: string) {
    const rows = await this.prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        author: { include: { profile: true } },
        _count: { select: { comments: true } },
      },
    });
    return { items: await this.posts.decorate(viewerId, rows) };
  }
}
