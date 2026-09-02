import { Inject, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma.service";

@Injectable()
export class SearchService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async search(q: string, type: "all" | "people" | "posts" | "events" | "wishes" | "moods") {
    const query = q.trim();
    if (!query) {
      return { people: [], posts: [], events: [], wishes: [], moods: [] };
    }
    const people =
      type !== "all" && type !== "people"
        ? []
        : await this.prisma.user.findMany({
            where: {
              status: "ACTIVE",
              profileCompleted: true,
              OR: [
                { username: { contains: query, mode: Prisma.QueryMode.insensitive } },
                { firstName: { contains: query, mode: Prisma.QueryMode.insensitive } },
                { lastName: { contains: query, mode: Prisma.QueryMode.insensitive } },
                { profile: { profession: { contains: query, mode: Prisma.QueryMode.insensitive } } },
              ],
            },
            take: 20,
            include: { profile: true },
          });
    const posts =
      type !== "all" && type !== "posts"
        ? []
        : await this.prisma.post.findMany({
            where: { hiddenAt: null, body: { contains: query, mode: Prisma.QueryMode.insensitive } },
            take: 20,
            orderBy: { createdAt: "desc" },
            include: {
              author: { select: { id: true, username: true, firstName: true, lastName: true } },
            },
          });
    const events =
      type !== "all" && type !== "events"
        ? []
        : await this.prisma.event.findMany({
            where: {
              status: "PUBLISHED",
              OR: [
                { title: { contains: query, mode: Prisma.QueryMode.insensitive } },
                { description: { contains: query, mode: Prisma.QueryMode.insensitive } },
                { city: { contains: query, mode: Prisma.QueryMode.insensitive } },
                { zone: { contains: query, mode: Prisma.QueryMode.insensitive } },
              ],
            },
            take: 20,
            orderBy: { startsAt: "asc" },
            include: {
              host: { select: { username: true, firstName: true, lastName: true } },
            },
          });
    const wishes =
      type !== "all" && type !== "wishes"
        ? []
        : await this.prisma.wish.findMany({
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
    const moods =
      type !== "all" && type !== "moods"
        ? []
        : await this.prisma.mood.findMany({
            where: {
              expiresAt: { gt: new Date() },
              OR: [
                { body: { contains: query, mode: Prisma.QueryMode.insensitive } },
                { activity: { contains: query, mode: Prisma.QueryMode.insensitive } },
                { city: { contains: query, mode: Prisma.QueryMode.insensitive } },
              ],
            },
            take: 20,
            orderBy: { createdAt: "desc" },
            include: { author: { select: { username: true, firstName: true, lastName: true } } },
          });
    return {
      people: people.map((u) => ({
        id: u.id,
        username: u.username,
        firstName: u.firstName,
        lastName: u.lastName,
        certified: u.certified,
        profession: u.profile?.profession ?? null,
        city: u.profile?.city ?? null,
      })),
      posts: posts.map((p) => ({
        id: p.id,
        body: p.body,
        createdAt: p.createdAt.toISOString(),
        author: p.author,
      })),
      events: events.map((e) => ({
        id: e.id,
        title: e.title,
        startsAt: e.startsAt.toISOString(),
        city: e.city,
        zone: e.zone,
        priceXaf: e.priceXaf,
        host: e.host,
      })),
      wishes: wishes.map((w) => ({
        id: w.id,
        title: w.title,
        category: w.category,
        owner: w.owner,
      })),
      moods: moods.map((m) => ({
        id: m.id,
        body: m.body,
        activity: m.activity,
        city: m.city,
        author: m.author,
      })),
    };
  }
}
