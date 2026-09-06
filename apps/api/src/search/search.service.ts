import { Inject, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import {
  dedupeSeriesOccurrences,
  isCurrentlyAvailable,
  remainingSeats,
  seatedGuestCount,
  type AvailabilityStatus,
} from "@tiptop/domain";
import { PrismaService } from "../prisma.service";

export type SearchType = "all" | "people" | "posts" | "events" | "wishes" | "moods" | "offers";

@Injectable()
export class SearchService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async search(input: { q: string; type: SearchType; viewerId: string; city?: string; zone?: string }) {
    const query = input.q.trim();
    const city = input.city?.trim() || undefined;
    const suggested = !query;
    void input.zone;
    const type = input.type;

    const [people, posts, events, wishes, moods, offers] = await Promise.all([
      type === "all" || type === "people" ? this.people(query, city, input.viewerId) : [],
      !suggested && (type === "all" || type === "posts") ? this.posts(query) : [],
      type === "all" || type === "events" ? this.events(query, city, input.viewerId) : [],
      !suggested && (type === "all" || type === "wishes") ? this.wishes(query) : [],
      !suggested && (type === "all" || type === "moods") ? this.moods(query, city) : [],
      !suggested && (type === "all" || type === "offers") ? this.offers(query, city) : [],
    ]);

    return { suggested, people, posts, events, wishes, moods, offers };
  }

  private async people(query: string, city: string | undefined, viewerId: string) {
    const rows = await this.prisma.user.findMany({
      where: {
        status: "ACTIVE",
        profileCompleted: true,
        id: { not: viewerId },
        ...(query
          ? {
              OR: [
                { username: { contains: query, mode: Prisma.QueryMode.insensitive } },
                { firstName: { contains: query, mode: Prisma.QueryMode.insensitive } },
                { lastName: { contains: query, mode: Prisma.QueryMode.insensitive } },
                { profile: { profession: { contains: query, mode: Prisma.QueryMode.insensitive } } },
              ],
            }
          : city
            ? { profile: { city: { equals: city, mode: Prisma.QueryMode.insensitive } } }
            : {}),
      },
      take: 20,
      include: { profile: true },
    });
    return rows.map((u) => ({
      id: u.id,
      username: u.username,
      firstName: u.firstName,
      lastName: u.lastName,
      certified: u.certified,
      profession: u.profile?.profession ?? null,
      city: u.profile?.city ?? null,
      avatarUrl: u.profile?.avatarUrl ?? null,
      available: isCurrentlyAvailable({
        availability: (u.profile?.availability ?? "HIDDEN") as AvailabilityStatus,
        availabilityUntil: u.profile?.availabilityUntil ?? null,
      }),
    }));
  }

  private async posts(query: string) {
    const rows = await this.prisma.post.findMany({
      where: { hiddenAt: null, body: { contains: query, mode: Prisma.QueryMode.insensitive } },
      take: 20,
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            profile: { select: { avatarUrl: true } },
          },
        },
      },
    });
    return rows.map((p) => ({
      id: p.id,
      body: p.body,
      imageUrl: p.imageUrl,
      createdAt: p.createdAt.toISOString(),
      author: {
        username: p.author.username,
        firstName: p.author.firstName,
        lastName: p.author.lastName,
        avatarUrl: p.author.profile?.avatarUrl ?? null,
      },
    }));
  }

  private async events(query: string, city: string | undefined, viewerId: string) {
    const rows = await this.prisma.event.findMany({
      where: {
        status: "PUBLISHED",
        wanted: false,
        startsAt: { gt: new Date() },
        ...(query
          ? {
              OR: [
                { title: { contains: query, mode: Prisma.QueryMode.insensitive } },
                { description: { contains: query, mode: Prisma.QueryMode.insensitive } },
                { city: { contains: query, mode: Prisma.QueryMode.insensitive } },
                { zone: { contains: query, mode: Prisma.QueryMode.insensitive } },
              ],
            }
          : city
            ? { city: { equals: city, mode: Prisma.QueryMode.insensitive } }
            : {}),
      },
      take: query ? 40 : 80,
      orderBy: { startsAt: "asc" },
      include: {
        host: { include: { profile: { select: { avatarUrl: true } } } },
        participants: { select: { status: true, userId: true } },
        hearts: { where: { userId: viewerId, releasedAt: null }, select: { id: true } },
      },
    });
    return dedupeSeriesOccurrences(rows).slice(0, query ? 20 : 40).map((e) => {
      const taken = seatedGuestCount(e.participants);
      return {
      id: e.id,
      title: e.title,
      imageUrl: e.imageUrl,
      startsAt: e.startsAt.toISOString(),
      city: e.city,
      zone: e.zone,
      priceXaf: e.priceXaf,
      currency: e.currency,
      capacity: e.capacity,
      taken,
      remaining: remainingSeats(e.capacity, taken),
      viewerHearted: e.hearts.length > 0,
      interestedCount: e.participants.filter((p) => p.status === "INTERESTED").length,
      viewerInterested: e.participants.some((p) => p.userId === viewerId && p.status === "INTERESTED"),
      viewerReserved: e.participants.some(
        (p) => p.userId === viewerId && ["RESERVED", "CONFIRMED", "PRESENT"].includes(p.status),
      ),
      recurrence: e.recurrence,
      seriesId: e.seriesId,
      host: {
        username: e.host.username,
        firstName: e.host.firstName,
        lastName: e.host.lastName,
        avatarUrl: e.host.profile?.avatarUrl ?? null,
      },
    };
    });
  }

  private async wishes(query: string) {
    const rows = await this.prisma.wish.findMany({
      where: {
        visibility: "PUBLIC",
        OR: [
          { title: { contains: query, mode: Prisma.QueryMode.insensitive } },
          { description: { contains: query, mode: Prisma.QueryMode.insensitive } },
        ],
      },
      take: 20,
      orderBy: { createdAt: "desc" },
      include: { owner: { select: { username: true, firstName: true, lastName: true } } },
    });
    return rows.map((w) => ({
      id: w.id,
      title: w.title,
      category: w.category,
      owner: w.owner,
    }));
  }

  private async moods(query: string, city: string | undefined) {
    const rows = await this.prisma.mood.findMany({
      where: {
        kind: "MOOD",
        hiddenAt: null,
        AND: [
          { OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
          {
            OR: [
              { body: { contains: query, mode: Prisma.QueryMode.insensitive } },
              { activity: { contains: query, mode: Prisma.QueryMode.insensitive } },
              { city: { contains: query, mode: Prisma.QueryMode.insensitive } },
            ],
          },
        ],
      },
      take: 20,
      orderBy: { createdAt: "desc" },
      include: { author: { select: { username: true, firstName: true, lastName: true } } },
    });
    void city;
    return rows.map((m) => ({
      id: m.id,
      body: m.body,
      activity: m.activity,
      city: m.city,
      author: m.author,
    }));
  }

  private async offers(query: string, city: string | undefined) {
    const rows = await this.prisma.offer.findMany({
      where: {
        status: "ACTIVE",
        OR: [
          { title: { contains: query, mode: Prisma.QueryMode.insensitive } },
          { description: { contains: query, mode: Prisma.QueryMode.insensitive } },
          { shopName: { contains: query, mode: Prisma.QueryMode.insensitive } },
        ],
      },
      take: 20,
      orderBy: { priceXaf: "asc" },
      include: { seller: { select: { username: true, firstName: true, lastName: true } } },
    });
    void city;
    return rows.map((o) => ({
      id: o.id,
      title: o.title,
      priceXaf: o.priceXaf,
      currency: o.currency,
      city: o.city,
      shopName: o.shopName,
      seller: o.seller,
    }));
  }
}
