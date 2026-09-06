import { Inject, Injectable } from "@nestjs/common";
import { feedHint, feedItemScore } from "@tiptop/domain";
import { PrismaService } from "../prisma.service";
import { PostsService } from "../posts/posts.service";
import { EventsService } from "../events/events.service";
import { MoodsService } from "../moods/moods.service";
import { DiscoveryService } from "../discovery/discovery.service";
import { viewerHiddenIds, viewerNetwork } from "../graph/viewer-graph";

@Injectable()
export class FeedService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(PostsService) private readonly posts: PostsService,
    @Inject(EventsService) private readonly events: EventsService,
    @Inject(MoodsService) private readonly moods: MoodsService,
    @Inject(DiscoveryService) private readonly discovery: DiscoveryService,
  ) {}

  async list(viewerId: string, opts: { cursor?: string; excludeIds?: string[] } = {}) {
    const viewer = await this.prisma.user.findUnique({
      where: { id: viewerId },
      include: { profile: true },
    });
    const [hidden, network] = await Promise.all([
      viewerHiddenIds(this.prisma, viewerId),
      viewerNetwork(this.prisma, viewerId),
    ]);
    const hiddenIds = [...hidden];
    const excludeIds = opts.excludeIds ?? [];
    const before = opts.cursor ? new Date(opts.cursor) : null;
    const pageSize = 30;
    const rows = await this.prisma.post.findMany({
      where: {
        hiddenAt: null,
        ...(hiddenIds.length ? { authorId: { notIn: hiddenIds } } : {}),
        ...(excludeIds.length ? { id: { notIn: excludeIds } } : {}),
        ...(before && !Number.isNaN(before.getTime()) ? { createdAt: { lt: before } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: pageSize + 20,
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
            venue: true,
            address: true,
            latitude: true,
            longitude: true,
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
    const decorated = await this.posts.decorate(viewerId, rows);
    const now = new Date();
    const city = viewer?.profile?.city ?? null;
    const items = decorated
      .map((item) => {
        const signals = {
          isFollowed: item.viewerFollows,
          isFriend: network.friendIds.has(item.author.id),
          sameCity: Boolean(city && item.city === city),
          createdAt: item.createdAt,
          now,
          lifeSeconds: item.likeTime?.totalSeconds ?? 0,
          commentCount: item.commentsCount,
          blocked: false,
        };
        return { ...item, hint: feedHint(signals), _score: feedItemScore(signals) };
      })
      .sort((a, b) => b._score - a._score)
      .slice(0, pageSize)
      .map((row) => {
        const { _score, ...item } = row;
        void _score;
        return item;
      });
    const nextCursor = items[items.length - 1]?.createdAt ?? null;
    const hasMore = rows.length > pageSize;
    const firstPage = !opts.cursor && excludeIds.length === 0;
    let events: Awaited<ReturnType<EventsService["list"]>>["items"] = [];
    let moods: Awaited<ReturnType<MoodsService["list"]>>["items"] = [];
    let reels: Awaited<ReturnType<MoodsService["list"]>>["items"] = [];
    let people: Awaited<ReturnType<DiscoveryService["people"]>>["items"] = [];
    if (firstPage) {
      try {
        const eventList = await this.events.list(viewerId, "all", viewer?.profile?.city ?? undefined);
        events = eventList.items.filter((event) => !hidden.has(event.host.id)).slice(0, 16);
      } catch (err) {
        console.error("[feed] events.list", err);
      }
      try {
        const moodList = await this.moods.list(viewerId, "STATUS");
        moods = moodList.items.filter((mood) => !hidden.has(mood.author.id)).slice(0, 12);
      } catch (err) {
        console.error("[feed] moods.list", err);
      }
      try {
        const reelList = await this.moods.list(viewerId, "MOOD");
        reels = reelList.items.filter((m) => m.videoUrl && !hidden.has(m.author.id)).slice(0, 12);
      } catch (err) {
        console.error("[feed] moods.reels", err);
      }
      try {
        const found = await this.discovery.people(viewerId, { city: viewer?.profile?.city ?? undefined });
        people = found.items.filter((p) => p.circle !== "FRIEND" && !hidden.has(p.id)).slice(0, 10);
      } catch (err) {
        console.error("[feed] people", err);
      }
    }
    return { items, events, moods, reels, people, nextCursor, hasMore };
  }
}
