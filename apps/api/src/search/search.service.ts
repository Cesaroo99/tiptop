import { Inject, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma.service";

@Injectable()
export class SearchService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async search(q: string, type: "all" | "people" | "posts" | "events") {
    const query = q.trim();
    if (!query) {
      return { people: [], posts: [], events: [] };
    }
    const people =
      type === "posts" || type === "events"
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
      type === "people" || type === "events"
        ? []
        : await this.prisma.post.findMany({
            where: { body: { contains: query, mode: Prisma.QueryMode.insensitive } },
            take: 20,
            orderBy: { createdAt: "desc" },
            include: {
              author: { select: { id: true, username: true, firstName: true, lastName: true } },
            },
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
      events: [],
    };
  }
}
