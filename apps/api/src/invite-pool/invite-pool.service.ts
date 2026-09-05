import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";

export type InvitePerson = {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  certified: boolean;
  avatarUrl: string | null;
  profession: string | null;
  city: string | null;
};

type UserWithProfile = {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  certified: boolean;
  profile: { avatarUrl: string | null; profession: string | null; city: string | null } | null;
};

export function matchesInviteQuery(person: InvitePerson, q?: string) {
  if (!q?.trim()) return true;
  const hay = `${person.firstName} ${person.lastName} ${person.username}`.toLowerCase();
  return hay.includes(q.trim().toLowerCase());
}

export function toInvitePerson(user: UserWithProfile): InvitePerson {
  return {
    id: user.id,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    certified: user.certified,
    avatarUrl: user.profile?.avatarUrl ?? null,
    profession: user.profile?.profession ?? null,
    city: user.profile?.city ?? null,
  };
}

@Injectable()
export class InvitePoolService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async pool(viewerId: string, q?: string) {
    const viewer = await this.prisma.user.findUnique({
      where: { id: viewerId },
      include: { profile: true },
    });
    const city = viewer?.profile?.city ?? "Yaoundé";

    const [contacts, laterRows, nearbyRows] = await Promise.all([
      this.prisma.contact.findMany({
        where: { ownerId: viewerId },
        orderBy: { createdAt: "desc" },
        include: { person: { include: { profile: true } } },
      }),
      this.prisma.inviteLater.findMany({
        where: { ownerId: viewerId },
        orderBy: { createdAt: "desc" },
        include: { person: { include: { profile: true } } },
      }),
      this.prisma.user.findMany({
        where: {
          id: { not: viewerId },
          status: "ACTIVE",
          profileCompleted: true,
          profile: { city, locationPrecision: { not: "HIDDEN" } },
        },
        include: { profile: true },
        take: 48,
      }),
    ]);

    const friendIds = new Set(contacts.map((c) => c.personId));
    const laterIds = new Set(laterRows.map((r) => r.personId));

    const friends = contacts
      .filter((c) => c.person.status === "ACTIVE")
      .map((c) => toInvitePerson(c.person))
      .filter((p) => matchesInviteQuery(p, q));

    const later = laterRows
      .filter((r) => r.person.status === "ACTIVE")
      .map((r) => toInvitePerson(r.person))
      .filter((p) => matchesInviteQuery(p, q));

    let nearby = nearbyRows
      .filter((u) => !friendIds.has(u.id) && !laterIds.has(u.id))
      .map(toInvitePerson)
      .filter((p) => matchesInviteQuery(p, q));

    if (q?.trim() && nearby.length < 8) {
      const extra = await this.prisma.user.findMany({
        where: {
          id: { notIn: [viewerId, ...friendIds, ...laterIds, ...nearby.map((p) => p.id)] },
          status: "ACTIVE",
          profileCompleted: true,
          OR: [
            { firstName: { contains: q.trim(), mode: "insensitive" } },
            { lastName: { contains: q.trim(), mode: "insensitive" } },
            { username: { contains: q.trim(), mode: "insensitive" } },
          ],
        },
        include: { profile: true },
        take: 16,
      });
      nearby = [...nearby, ...extra.map(toInvitePerson).filter((p) => matchesInviteQuery(p, q))];
    }

    return { friends, nearby, later };
  }

  async listLater(viewerId: string) {
    const rows = await this.prisma.inviteLater.findMany({
      where: { ownerId: viewerId },
      orderBy: { createdAt: "desc" },
      include: { person: { include: { profile: true } } },
    });
    return { items: rows.filter((r) => r.person.status === "ACTIVE").map((r) => toInvitePerson(r.person)) };
  }

  async saveLater(viewerId: string, personId: string) {
    if (viewerId === personId) {
      throw new BadRequestException({ code: "INVITE_LATER_SELF" });
    }
    const person = await this.prisma.user.findUnique({
      where: { id: personId },
      include: { profile: true },
    });
    if (!person || person.status !== "ACTIVE") {
      throw new NotFoundException({ code: "USER_NOT_FOUND" });
    }
    await this.prisma.inviteLater.upsert({
      where: { ownerId_personId: { ownerId: viewerId, personId } },
      create: { ownerId: viewerId, personId },
      update: {},
    });
    return { ok: true as const, person: toInvitePerson(person) };
  }

  async removeLater(viewerId: string, personId: string) {
    await this.prisma.inviteLater.deleteMany({ where: { ownerId: viewerId, personId } });
    return { ok: true as const };
  }
}
