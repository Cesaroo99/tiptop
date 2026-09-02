import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  canOpenNewDirectConversation,
  canSendMessage,
  canStartDirect,
  directKey,
  eventGroupTitle,
  isRecentlyOnline,
  pairIsBlocked,
  shouldNotifyOffline,
  type MessageKind,
} from "@tiptop/domain";
import { PrismaService } from "../prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { ChatRealtime } from "./chat.realtime";
import { PushService } from "./push.service";

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
export class ChatService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(NotificationsService) private readonly notifications: NotificationsService,
    @Inject(ChatRealtime) private readonly realtime: ChatRealtime,
    @Inject(PushService) private readonly push: PushService,
  ) {}

  async list(userId: string) {
    const rows = await this.prisma.conversation.findMany({
      where: { members: { some: { userId } } },
      orderBy: { updatedAt: "desc" },
      take: 50,
      include: {
        members: { include: { user: PERSON } },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
        event: { select: { id: true, title: true } },
      },
    });
    const items = [];
    for (const row of rows) {
      items.push(await this.serializeList(row, userId));
    }
    const unreadTotal = items.reduce((n, c) => n + c.unreadCount, 0);
    return { items, unreadTotal };
  }

  async get(userId: string, id: string) {
    const row = await this.load(id);
    this.assertMember(row, userId);
    return this.serializeList(row, userId);
  }

  async messages(userId: string, id: string) {
    const row = await this.load(id);
    this.assertMember(row, userId);
    const items = await this.prisma.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: "asc" },
      take: 100,
      include: { sender: PERSON },
    });
    return { items: items.map((m) => this.serializeMessage(m)) };
  }

  async openDirect(actorId: string, peerId: string) {
    if (canStartDirect(actorId, peerId) !== "OK") throw new BadRequestException({ code: "CHAT_SELF" });
    const peer = await this.prisma.user.findUnique({ where: { id: peerId }, select: { id: true } });
    if (!peer) throw new NotFoundException({ code: "USER_NOT_FOUND" });
    if (await this.blocked(actorId, peerId)) throw new ForbiddenException({ code: "BLOCKED" });
    const key = directKey(actorId, peerId);
    let conv = await this.prisma.conversation.findUnique({
      where: { directKey: key },
      include: { members: { include: { user: PERSON } }, messages: { orderBy: { createdAt: "desc" }, take: 1 }, event: true },
    });
    if (!conv) {
      const dayAgo = new Date(Date.now() - 24 * 3600_000);
      const recentNew = await this.prisma.conversation.count({
        where: { kind: "DIRECT", createdAt: { gte: dayAgo }, members: { some: { userId: actorId } } },
      });
      if (canOpenNewDirectConversation(recentNew) !== "OK") {
        throw new ConflictException({ code: "CONVERSATION_RATE_LIMITED" });
      }
      conv = await this.prisma.conversation.create({
        data: {
          kind: "DIRECT",
          directKey: key,
          members: { create: [{ userId: actorId }, { userId: peerId }] },
        },
        include: { members: { include: { user: PERSON } }, messages: { orderBy: { createdAt: "desc" }, take: 1 }, event: true },
      });
    }
    return this.serializeList(conv, actorId);
  }

  async openEvent(actorId: string, eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { participants: true },
    });
    if (!event) throw new NotFoundException({ code: "EVENT_NOT_FOUND" });
    const eligible = event.participants.filter((p) =>
      ["HOST", "CONFIRMED", "PRESENT", "RESERVED"].includes(p.status),
    );
    if (!eligible.some((p) => p.userId === actorId)) throw new ForbiddenException({ code: "NOT_IN_EVENT" });
    let conv = await this.prisma.conversation.findUnique({
      where: { eventId },
      include: { members: { include: { user: PERSON } }, messages: { orderBy: { createdAt: "desc" }, take: 1 }, event: true },
    });
    if (!conv) {
      conv = await this.prisma.conversation.create({
        data: {
          kind: "EVENT",
          eventId,
          title: eventGroupTitle(event.title),
          members: { create: eligible.map((p) => ({ userId: p.userId })) },
        },
        include: { members: { include: { user: PERSON } }, messages: { orderBy: { createdAt: "desc" }, take: 1 }, event: true },
      });
    } else {
      for (const p of eligible) {
        await this.prisma.conversationMember.upsert({
          where: { conversationId_userId: { conversationId: conv.id, userId: p.userId } },
          create: { conversationId: conv.id, userId: p.userId },
          update: {},
        });
      }
      conv = await this.load(conv.id);
    }
    return this.serializeList(conv, actorId);
  }

  async send(
    actorId: string,
    conversationId: string,
    input: { kind?: MessageKind; body?: string; imageUrl?: string },
  ) {
    const conv = await this.load(conversationId);
    this.assertMember(conv, actorId);
    const kind: MessageKind = input.kind ?? "TEXT";
    const blocked = await this.directBlocked(conv, actorId);
    const minuteAgo = new Date(Date.now() - 60_000);
    const recentMessageCount = await this.prisma.message.count({
      where: { senderId: actorId, createdAt: { gte: minuteAgo } },
    });
    const gate = canSendMessage({
      isMember: true,
      blocked,
      kind,
      body: input.body,
      imageUrl: input.imageUrl,
      recentMessageCount,
    });
    if (gate !== "OK") {
      if (gate === "BLOCKED") throw new ForbiddenException({ code: "BLOCKED" });
      if (gate === "RATE_LIMITED") throw new ConflictException({ code: "MESSAGE_RATE_LIMITED" });
      throw new BadRequestException({ code: gate });
    }
    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId: actorId,
        kind,
        body: kind === "AUDIO" ? "" : (input.body ?? "").trim(),
        imageUrl: kind === "IMAGE" ? input.imageUrl : kind === "AUDIO" ? "/seed/black-white.svg" : null,
      },
      include: { sender: PERSON },
    });
    await this.prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
    await this.prisma.conversationMember.update({
      where: { conversationId_userId: { conversationId, userId: actorId } },
      data: { lastReadAt: new Date() },
    });
    const payload = this.serializeMessage(message);
    const memberIds = conv.members.map((m) => m.userId);
    this.realtime.emitToUsers(memberIds, "message", { conversationId, message: payload });
    for (const member of conv.members) {
      if (member.userId === actorId) continue;
      const viewing = this.realtime.isViewing(member.userId, conversationId);
      const prefs = await this.push.prefs(member.userId);
      if (shouldNotifyOffline({ viewingThread: viewing, pushEnabled: prefs.messages })) {
        await this.notifications.create({
          userId: member.userId,
          actorId,
          type: "MESSAGE",
          entityType: "conversation",
          entityId: conversationId,
        });
        await this.push.notify({
          userId: member.userId,
          category: "messages",
          title: `${message.sender.firstName} ${message.sender.lastName}`,
          body: kind === "TEXT" ? message.body.slice(0, 80) : kind,
          deepLink: `/messages/${conversationId}`,
        });
      }
    }
    return payload;
  }

  async read(userId: string, conversationId: string) {
    this.assertMember(await this.load(conversationId), userId);
    await this.prisma.conversationMember.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { lastReadAt: new Date() },
    });
    this.realtime.emitToUsers([userId], "read", { conversationId });
    return { ok: true };
  }

  async block(actorId: string, peerId: string) {
    if (actorId === peerId) throw new BadRequestException({ code: "CHAT_SELF" });
    try {
      await this.prisma.userBlock.create({ data: { blockerId: actorId, blockedId: peerId } });
    } catch {
      throw new ConflictException({ code: "ALREADY_BLOCKED" });
    }
    return { ok: true };
  }

  async conversationIds(userId: string) {
    const rows = await this.prisma.conversationMember.findMany({
      where: { userId },
      select: { conversationId: true },
    });
    return rows.map((r) => r.conversationId);
  }

  async assertMemberById(userId: string, conversationId: string) {
    this.assertMember(await this.load(conversationId), userId);
  }

  private async load(id: string) {
    const row = await this.prisma.conversation.findUnique({
      where: { id },
      include: {
        members: { include: { user: PERSON } },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
        event: { select: { id: true, title: true } },
      },
    });
    if (!row) throw new NotFoundException({ code: "CONVERSATION_NOT_FOUND" });
    return row;
  }

  private assertMember(
    conv: { members: Array<{ userId: string }> },
    userId: string,
  ) {
    if (!conv.members.some((m) => m.userId === userId)) throw new ForbiddenException({ code: "NOT_MEMBER" });
  }

  private async blocked(a: string, b: string) {
    const rows = await this.prisma.userBlock.findMany({
      where: {
        OR: [
          { blockerId: a, blockedId: b },
          { blockerId: b, blockedId: a },
        ],
      },
    });
    return pairIsBlocked(rows, a, b);
  }

  private async directBlocked(conv: { kind: string; members: Array<{ userId: string }> }, actorId: string) {
    if (conv.kind !== "DIRECT") return false;
    const peer = conv.members.find((m) => m.userId !== actorId);
    if (!peer) return false;
    return this.blocked(actorId, peer.userId);
  }

  private async serializeList(
    row: {
      id: string;
      kind: string;
      title: string | null;
      eventId: string | null;
      updatedAt: Date;
      event: { id: string; title: string } | null;
      members: Array<{
        userId: string;
        lastReadAt: Date;
        user: {
          id: string;
          username: string;
          firstName: string;
          lastName: string;
          certified: boolean;
          profile?: { avatarUrl: string | null } | null;
        };
      }>;
      messages: Array<{ body: string; kind: string; createdAt: Date; senderId: string }>;
    },
    viewerId: string,
  ) {
    const me = row.members.find((m) => m.userId === viewerId);
    const last = row.messages[0];
    const unreadCount = await this.prisma.message.count({
      where: {
        conversationId: row.id,
        senderId: { not: viewerId },
        createdAt: { gt: me?.lastReadAt ?? new Date(0) },
      },
    });
    const peer = row.kind === "DIRECT" ? row.members.find((m) => m.userId !== viewerId)?.user : null;
    const peerPublic = peer ? publicPerson(peer) : null;
    let online = false;
    if (peer) {
      if (this.realtime.isConnected(peer.id)) online = true;
      else {
        const seen = await this.push.lastSeen(peer.id);
        online = isRecentlyOnline(seen?.lastSeenAt ?? null);
      }
    }
    const title =
      row.kind === "DIRECT"
        ? peerPublic
          ? `${peerPublic.firstName} ${peerPublic.lastName}`
          : row.title
        : row.title || row.event?.title || "Groupe";
    return {
      id: row.id,
      kind: row.kind,
      title,
      channel: row.kind === "EVENT" ? "# Général" : null,
      eventId: row.eventId,
      unreadCount,
      online,
      peer: peerPublic,
      members: row.members.map((m) => publicPerson(m.user)),
      lastMessage: last
        ? { body: last.body, kind: last.kind, createdAt: last.createdAt.toISOString(), senderId: last.senderId }
        : null,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private serializeMessage(m: {
    id: string;
    kind: string;
    body: string;
    imageUrl: string | null;
    createdAt: Date;
    senderId: string;
    sender: { id: string; username: string; firstName: string; lastName: string; certified: boolean; profile?: { avatarUrl: string | null } | null };
  }) {
    return {
      id: m.id,
      kind: m.kind,
      body: m.body,
      imageUrl: m.imageUrl,
      createdAt: m.createdAt.toISOString(),
      sender: publicPerson(m.sender),
    };
  }
}
