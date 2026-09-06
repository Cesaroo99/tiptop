import { Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { PostsService } from "../posts/posts.service";
import { EventsService } from "../events/events.service";
import { MoodsService } from "../moods/moods.service";
import { DiscoveryService } from "../discovery/discovery.service";

@Injectable()
export class FeedService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(PostsService) private readonly posts: PostsService,
    @Inject(EventsService) private readonly events: EventsService,
    @Inject(MoodsService) private readonly moods: MoodsService,
    @Inject(DiscoveryService) private readonly discovery: DiscoveryService,
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
        event: {
          select: {
            id: true,
            title: true,
            startsAt: true,
            minAge: true,
            city: true,
            zone: true,
            capacity: true,
            requiresReservation: true,
            priceXaf: true,
            hostId: true,
            recurrence: true,
            seriesId: true,
            participants: { select: { status: true, userId: true } },
          },
        },
        _count: { select: { comments: true } },
      },
    });
    const items = await this.posts.decorate(viewerId, rows);
    let events: Awaited<ReturnType<EventsService["list"]>>["items"] = [];
    let moods: Awaited<ReturnType<MoodsService["list"]>>["items"] = [];
    let reels: Awaited<ReturnType<MoodsService["list"]>>["items"] = [];
    let people: Awaited<ReturnType<DiscoveryService["people"]>>["items"] = [];
    try {
      const eventList = await this.events.list(viewerId, "all", viewer?.profile?.city ?? undefined);
      events = eventList.items.slice(0, 16);
    } catch (err) {
      console.error("[feed] events.list", err);
    }
    try {
      const moodList = await this.moods.list(viewerId, "STATUS");
      moods = moodList.items.slice(0, 12);
    } catch (err) {
      console.error("[feed] moods.list", err);
    }
    try {
      const reelList = await this.moods.list(viewerId, "MOOD");
      reels = reelList.items.filter((m) => m.videoUrl).slice(0, 12);
    } catch (err) {
      console.error("[feed] moods.reels", err);
    }
    try {
      const found = await this.discovery.people(viewerId, { city: viewer?.profile?.city ?? undefined });
      people = found.items.filter((p) => p.circle !== "FRIEND").slice(0, 10);
    } catch (err) {
      console.error("[feed] people", err);
    }
    return { items, events, moods, reels, people };
  }
}
