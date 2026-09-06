import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  canAdministerGroup,
  canCreateEventGroup,
  canLeaveGroup,
  canPromoteAdmin,
  canRespondToGroupInvite,
  groupNameOk,
} from "@tiptop/domain";
import { PrismaService } from "../prisma.service";
import { NotificationsService } from "../notifications/notifications.service";

const PERSON = {
  select: {
    id: true,
    username: true,
    firstName: true,
    lastName: true,
    certified: true,
    profile: { select: { avatarUrl: true } },
  },
};

function publicPerson(u: {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  certified: boolean;
  profile?: { avatarUrl: string | null } | null;
}) {
  return {
    id: u.id,
    username: u.username,
    firstName: u.firstName,
    lastName: u.lastName,
    certified: u.certified,
    avatarUrl: u.profile?.avatarUrl ?? null,
  };
}

@Injectable()
export class EventGroupsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(NotificationsService) private readonly notifications: NotificationsService,
  ) {}

  async list(viewerId: string, eventId: string) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException({ code: "EVENT_NOT_FOUND" });
    const groups = await this.prisma.eventGroup.findMany({
      where: { eventId },
      orderBy: { createdAt: "asc" },
      include: {
        members: { include: { user: PERSON } },
      },
    });
    return {
      allowGroups: event.allowGroups,
      isHost: event.hostId === viewerId,
      items: groups.map((g) => this.serialize(g, viewerId, event.hostId)),
    };
  }

  async create(actorId: string, eventId: string, name: string) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException({ code: "EVENT_NOT_FOUND" });
    if (!canCreateEventGroup(event.hostId === actorId, event.allowGroups)) {
      throw new ForbiddenException({ code: "GROUPS_NOT_ALLOWED" });
    }
    if (event.status === "CANCELLED") throw new BadRequestException({ code: "EVENT_CANCELLED" });
    if (!groupNameOk(name)) throw new BadRequestException({ code: "GROUP_NAME_INVALID" });
    const title = name.trim();
    const conv = await this.prisma.conversation.create({
      data: { kind: "GROUP", title, members: { create: { userId: actorId } } },
    });
    const group = await this.prisma.eventGroup.create({
      data: {
        eventId,
        name: title,
        createdById: actorId,
        conversationId: conv.id,
        members: { create: { userId: actorId, role: "HOST", status: "JOINED", respondedAt: new Date() } },
      },
      include: { members: { include: { user: PERSON } } },
    });
    return this.serialize(group, actorId, event.hostId);
  }

  async invite(actorId: string, eventId: string, groupId: string, userId: string) {
    const { event, group, mine } = await this.load(eventId, groupId, actorId);
    if (!canAdministerGroup(mine?.role, event.hostId === actorId)) {
      throw new ForbiddenException({ code: "NOT_GROUP_ADMIN" });
    }
    if (userId === actorId) throw new BadRequestException({ code: "GROUP_INVITE_SELF" });
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true, status: true } });
    if (!user || user.status !== "ACTIVE") throw new NotFoundException({ code: "USER_NOT_FOUND" });
    const existing = group.members.find((m) => m.userId === userId);
    if (existing?.status === "JOINED" || existing?.status === "INVITED") {
      throw new ConflictException({ code: "GROUP_ALREADY_IN" });
    }
    const row = existing
      ? await this.prisma.eventGroupMember.update({
          where: { id: existing.id },
          data: { status: "INVITED", role: "MEMBER", invitedById: actorId, respondedAt: null },
          include: { user: PERSON },
        })
      : await this.prisma.eventGroupMember.create({
          data: { groupId, userId, status: "INVITED", role: "MEMBER", invitedById: actorId },
          include: { user: PERSON },
        });
    await this.notifications.create({
      userId,
      actorId,
      type: "EVENT_UPDATE",
      entityType: "event_group_invite",
      entityId: eventId,
    });
    return { member: this.serializeMember(row) };
  }

  async accept(actorId: string, eventId: string, groupId: string) {
    const { event, group, mine } = await this.load(eventId, groupId, actorId);
    if (!mine || !canRespondToGroupInvite(mine.status)) {
      throw new BadRequestException({ code: "GROUP_INVITE_MISSING" });
    }
    await this.prisma.eventGroupMember.update({
      where: { id: mine.id },
      data: { status: "JOINED", respondedAt: new Date() },
    });
    await this.addToConversation(group.conversationId, actorId);
    const fresh = await this.reload(groupId);
    return this.serialize(fresh, actorId, event.hostId);
  }

  async decline(actorId: string, eventId: string, groupId: string) {
    const { mine } = await this.load(eventId, groupId, actorId);
    if (!mine || !canRespondToGroupInvite(mine.status)) {
      throw new BadRequestException({ code: "GROUP_INVITE_MISSING" });
    }
    await this.prisma.eventGroupMember.update({
      where: { id: mine.id },
      data: { status: "DECLINED", respondedAt: new Date() },
    });
    return { ok: true };
  }

  async leave(actorId: string, eventId: string, groupId: string) {
    const { event, group, mine } = await this.load(eventId, groupId, actorId);
    if (!mine || !canLeaveGroup(mine.status, mine.role)) {
      throw new ForbiddenException({ code: "GROUP_CANNOT_LEAVE" });
    }
    await this.prisma.eventGroupMember.update({
      where: { id: mine.id },
      data: { status: "LEFT", role: "MEMBER", respondedAt: new Date() },
    });
    if (group.conversationId) {
      await this.prisma.conversationMember.deleteMany({
        where: { conversationId: group.conversationId, userId: actorId },
      });
    }
    const fresh = await this.reload(groupId);
    return this.serialize(fresh, actorId, event.hostId);
  }

  async setAdmin(actorId: string, eventId: string, groupId: string, userId: string, admin: boolean) {
    const { event, group, mine } = await this.load(eventId, groupId, actorId);
    if (!canPromoteAdmin(mine?.role, event.hostId === actorId)) {
      throw new ForbiddenException({ code: "NOT_GROUP_HOST" });
    }
    const target = group.members.find((m) => m.userId === userId);
    if (!target || target.status !== "JOINED") throw new NotFoundException({ code: "GROUP_MEMBER_MISSING" });
    if (target.role === "HOST") throw new BadRequestException({ code: "GROUP_HOST_FIXED" });
    await this.prisma.eventGroupMember.update({
      where: { id: target.id },
      data: { role: admin ? "ADMIN" : "MEMBER" },
    });
    const fresh = await this.reload(groupId);
    return this.serialize(fresh, actorId, event.hostId);
  }

  async conversation(actorId: string, eventId: string, groupId: string) {
    const { group, mine } = await this.load(eventId, groupId, actorId);
    if (mine?.status !== "JOINED") throw new ForbiddenException({ code: "NOT_IN_GROUP" });
    if (!group.conversationId) throw new NotFoundException({ code: "GROUP_CHAT_MISSING" });
    return { id: group.conversationId };
  }

  async candidates(actorId: string, eventId: string, groupId: string) {
    const { event, group, mine } = await this.load(eventId, groupId, actorId);
    if (!canAdministerGroup(mine?.role, event.hostId === actorId)) {
      throw new ForbiddenException({ code: "NOT_GROUP_ADMIN" });
    }
    const taken = new Set(
      group.members.filter((m) => m.status === "JOINED" || m.status === "INVITED").map((m) => m.userId),
    );
    const [participants, contacts] = await Promise.all([
      this.prisma.eventParticipant.findMany({
        where: { eventId, status: { not: "CANCELLED" } },
        include: { user: PERSON },
      }),
      this.prisma.contact.findMany({
        where: { ownerId: actorId },
        include: { person: PERSON },
      }),
    ]);
    const map = new Map<string, ReturnType<typeof publicPerson>>();
    for (const p of participants) {
      if (!taken.has(p.userId) && p.userId !== actorId) map.set(p.userId, publicPerson(p.user));
    }
    for (const c of contacts) {
      if (!taken.has(c.personId) && c.personId !== actorId) map.set(c.personId, publicPerson(c.person));
    }
    return { items: [...map.values()] };
  }

  async remove(actorId: string, eventId: string, groupId: string) {
    const { event, group } = await this.load(eventId, groupId, actorId);
    if (event.hostId !== actorId && group.createdById !== actorId) {
      throw new ForbiddenException({ code: "NOT_GROUP_HOST" });
    }
    if (group.conversationId) {
      await this.prisma.conversation.delete({ where: { id: group.conversationId } }).catch(() => undefined);
    }
    await this.prisma.eventGroup.delete({ where: { id: groupId } });
    return { ok: true };
  }

  private async load(eventId: string, groupId: string, viewerId: string) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException({ code: "EVENT_NOT_FOUND" });
    const group = await this.prisma.eventGroup.findUnique({
      where: { id: groupId },
      include: { members: { include: { user: PERSON } } },
    });
    if (!group || group.eventId !== eventId) throw new NotFoundException({ code: "GROUP_NOT_FOUND" });
    return {
      event,
      group,
      mine: group.members.find((m) => m.userId === viewerId) ?? null,
    };
  }

  private async reload(groupId: string) {
    const group = await this.prisma.eventGroup.findUnique({
      where: { id: groupId },
      include: { members: { include: { user: PERSON } } },
    });
    if (!group) throw new NotFoundException({ code: "GROUP_NOT_FOUND" });
    return group;
  }

  private async addToConversation(conversationId: string | null, userId: string) {
    if (!conversationId) return;
    await this.prisma.conversationMember.upsert({
      where: { conversationId_userId: { conversationId, userId } },
      create: { conversationId, userId },
      update: {},
    });
  }

  private serializeMember(m: {
    userId: string;
    role: string;
    status: string;
    user: {
      id: string;
      username: string;
      firstName: string;
      lastName: string;
      certified: boolean;
      profile?: { avatarUrl: string | null } | null;
    };
  }) {
    return { ...publicPerson(m.user), role: m.role, status: m.status };
  }

  private serialize(
    group: {
      id: string;
      name: string;
      createdById: string;
      conversationId: string | null;
      members: Array<{
        userId: string;
        role: string;
        status: string;
        user: {
          id: string;
          username: string;
          firstName: string;
          lastName: string;
          certified: boolean;
          profile?: { avatarUrl: string | null } | null;
        };
      }>;
    },
    viewerId: string,
    hostId: string,
  ) {
    const mine = group.members.find((m) => m.userId === viewerId) ?? null;
    const joined = group.members.filter((m) => m.status === "JOINED");
    const showMembers = mine?.status === "JOINED" || hostId === viewerId || mine?.role === "ADMIN" || mine?.role === "HOST";
    return {
      id: group.id,
      name: group.name,
      conversationId: mine?.status === "JOINED" ? group.conversationId : null,
      memberCount: joined.length,
      viewerStatus: mine?.status ?? null,
      viewerRole: mine?.role ?? null,
      canInvite: canAdministerGroup(mine?.role as "HOST" | "ADMIN" | "MEMBER" | undefined, hostId === viewerId),
      canAdmin: canPromoteAdmin(mine?.role as "HOST" | "ADMIN" | "MEMBER" | undefined, hostId === viewerId),
      canLeave: canLeaveGroup(mine?.status as "INVITED" | "JOINED" | "DECLINED" | "LEFT" | undefined, mine?.role as "HOST" | "ADMIN" | "MEMBER" | undefined),
      canRespond: canRespondToGroupInvite(mine?.status as "INVITED" | "JOINED" | "DECLINED" | "LEFT" | undefined),
      members: showMembers ? joined.map((m) => this.serializeMember(m)) : [],
    };
  }
}
