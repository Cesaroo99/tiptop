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
    const rows = await this.prisma.contact.findMany({
      where: { ownerId: req.user.id },
      orderBy: { createdAt: "desc" },
      include: { person: { include: { profile: true } } },
    });
    return {
      items: rows
        .filter((row) => row.person.status === "ACTIVE")
        .map((row) => ({
          id: row.person.id,
          username: row.person.username,
          firstName: row.person.firstName,
          lastName: row.person.lastName,
          certified: row.person.certified,
          profession: row.person.profile?.profession ?? null,
          city: row.person.profile?.city ?? null,
          avatarUrl: row.person.profile?.avatarUrl ?? null,
        })),
    };
  }
}
