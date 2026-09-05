import { Controller, Get, Inject, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { SessionGuard } from "../auth/session.guard";
import type { PublicUser } from "../auth/auth.service";
import { PrismaService } from "../prisma.service";

@Controller("contacts")
@UseGuards(SessionGuard)
export class ContactsController {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  @Get()
  async list(@Req() req: Request & { user: PublicUser }) {
    const [rows, follows] = await Promise.all([
      this.prisma.contact.findMany({
        where: { ownerId: req.user.id },
        orderBy: { createdAt: "desc" },
        include: { person: { include: { profile: true } } },
      }),
      this.prisma.follow.findMany({
        where: { followerId: req.user.id },
        include: { followee: { include: { profile: true } } },
        take: 20,
      }),
    ]);
    const seen = new Set<string>();
    const items = [];
    for (const row of [
      ...rows.map((c) => c.person),
      ...follows.map((f) => f.followee),
    ]) {
      if (seen.has(row.id)) continue;
      seen.add(row.id);
      items.push({
        id: row.id,
        username: row.username,
        firstName: row.firstName,
        lastName: row.lastName,
        certified: row.certified,
        profession: row.profile?.profession ?? null,
        city: row.profile?.city ?? null,
        avatarUrl: row.profile?.avatarUrl ?? null,
      });
    }
    return { items };
  }
}
