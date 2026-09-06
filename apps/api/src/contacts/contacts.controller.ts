import { BadRequestException, Controller, Delete, Get, Inject, NotFoundException, Param, Post, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { SessionGuard } from "../auth/session.guard";
import type { PublicUser } from "../auth/auth.service";
import { PrismaService } from "../prisma.service";

@Controller("contacts")
@UseGuards(SessionGuard)
export class ContactsController {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  @Post(":userId")
  async add(@Req() req: Request & { user: PublicUser }, @Param("userId") userId: string) {
    if (userId === req.user.id) throw new BadRequestException("SELF");
    const person = await this.prisma.user.findFirst({ where: { id: userId, status: "ACTIVE", profileCompleted: true } });
    if (!person) throw new NotFoundException();
    await this.prisma.contact.upsert({
      where: { ownerId_personId: { ownerId: req.user.id, personId: userId } },
      create: { ownerId: req.user.id, personId: userId },
      update: {},
    });
    await this.prisma.inviteLater.deleteMany({ where: { ownerId: req.user.id, personId: userId } });
    return { ok: true };
  }

  @Delete(":userId")
  async remove(@Req() req: Request & { user: PublicUser }, @Param("userId") userId: string) {
    await this.prisma.contact.deleteMany({ where: { ownerId: req.user.id, personId: userId } });
    return { ok: true };
  }

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
