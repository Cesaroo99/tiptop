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
      include: {
        person: {
          include: { profile: true },
        },
      },
    });
    return {
      items: rows.map((c) => ({
        id: c.person.id,
        username: c.person.username,
        firstName: c.person.firstName,
        lastName: c.person.lastName,
        certified: c.person.certified,
        profession: c.person.profile?.profession ?? null,
        city: c.person.profile?.city ?? null,
      })),
    };
  }
}
