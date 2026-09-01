import { Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { PostsService } from "../posts/posts.service";
import { EventsService } from "../events/events.service";
import { MoodsService } from "../moods/moods.service";

@Injectable()
export class FeedService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(PostsService) private readonly posts: PostsService,
    @Inject(EventsService) private readonly events: EventsService,
    @Inject(MoodsService) private readonly moods: MoodsService,
  ) {}

  async list(viewerId: string) {
    const viewer = await this.prisma.user.findUnique({
      where: { id: viewerId },
      include: { profile: true },
    });
    const rows = await this.prisma.post.findMany({
      where: { hiddenAt: null },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        author: { include: { profile: true } },
        event: { select: { id: true, title: true, startsAt: true, minAge: true, participants: { select: { status: true } } } },
        _count: { select: { comments: true } },
      },
    });
    const [items, eventList, moodList] = await Promise.all([
      this.posts.decorate(viewerId, rows),
      this.events.list(viewerId, "all", viewer?.profile?.city ?? undefined),
      this.moods.list(viewerId),
    ]);
    return {
      items,
      events: eventList.items.slice(0, 8),
      moods: moodList.items.slice(0, 12),
    };
  }
}
