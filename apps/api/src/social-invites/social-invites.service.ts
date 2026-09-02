import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
  assertSocialInviteTarget,
  canRespondSocialInvite,
  canSendSocialInvite,
  socialInviteExpiresAt,
  type SocialInviteContext,
} from "@tiptop/domain";
import { PrismaService } from "../prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { ChatService } from "../chat/chat.service";

const personSelect = {
  id: true,
  firstName: true,
  lastName: true,
  username: true,
  certified: true,
  profile: { select: { avatarUrl: true } },
} as const;

@Injectable()
export class SocialInvitesService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(NotificationsService) private readonly notifications: NotificationsService,
    @Inject(ChatService) private readonly chat: ChatService,
  ) {}

  async create(
    inviterId: string,
    input: { inviteeId: string; context: SocialInviteContext; label?: string; message?: string; wishId?: string },
  ) {
    if (assertSocialInviteTarget(inviterId, input.inviteeId) !== "OK") {
      throw new BadRequestException({ code: "INVITE_SELF" });
    }
    const invitee = await this.prisma.user.findUnique({ where: { id: input.inviteeId } });
    if (!invitee) throw new NotFoundException({ code: "USER_NOT_FOUND" });
    if (input.wishId) {
      const wish = await this.prisma.wish.findUnique({ where: { id: input.wishId } });
      if (!wish) throw new NotFoundException({ code: "WISH_NOT_FOUND" });
    }

    await this.expireStale();
    const dayAgo = new Date(Date.now() - 24 * 3600_000);
    const [sentTodayCount, pending] = await Promise.all([
      this.prisma.socialInvite.count({ where: { inviterId, createdAt: { gte: dayAgo } } }),
      this.prisma.socialInvite.findFirst({
        where: { inviterId, inviteeId: input.inviteeId, status: "SENT" },
      }),
    ]);
    const gate = canSendSocialInvite({ sentTodayCount, hasPendingToSameInvitee: Boolean(pending) });
    if (gate !== "OK") throw new ConflictException({ code: gate === "ALREADY_PENDING" ? "INVITE_ALREADY_PENDING" : "INVITE_RATE_LIMITED" });

    const now = new Date();
    const invite = await this.prisma.socialInvite.create({
      data: {
        inviterId,
        inviteeId: input.inviteeId,
        context: input.context,
        label: (input.label ?? "").trim().slice(0, 120),
        message: (input.message ?? "").trim().slice(0, 500),
        wishId: input.wishId ?? null,
        expiresAt: socialInviteExpiresAt(now),
      },
    });
    await this.notifications.create({
      userId: input.inviteeId,
      actorId: inviterId,
      type: "SOCIAL_INVITE",
      entityType: "social_invite_sent",
      entityId: invite.id,
    });
    return this.mapOne(invite.id);
  }

  async list(userId: string, box: "received" | "sent") {
    await this.expireStale();
    const where = box === "sent" ? { inviterId: userId } : { inviteeId: userId };
    const rows = await this.prisma.socialInvite.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
      include: this.include(),
    });
    return { items: rows.map((r) => this.serialize(r)) };
  }

  async accept(actorId: string, id: string) {
    await this.expireStale();
    const inv = await this.prisma.socialInvite.findUnique({ where: { id } });
    if (!inv) throw new NotFoundException({ code: "INVITE_NOT_FOUND" });
    const gate = canRespondSocialInvite({
      status: inv.status,
      expiresAt: inv.expiresAt,
      inviteeId: inv.inviteeId,
      actorId,
    });
    if (gate !== "OK") {
      if (gate === "NOT_INVITEE") throw new ForbiddenException({ code: gate });
      throw new BadRequestException({ code: gate });
    }
    await this.prisma.socialInvite.update({
      where: { id },
      data: { status: "ACCEPTED", respondedAt: new Date() },
    });
    const conversation = await this.chat.openDirect(actorId, inv.inviterId);
    await this.notifications.create({
      userId: inv.inviterId,
      actorId,
      type: "SOCIAL_INVITE",
      entityType: "social_invite_accepted",
      entityId: id,
    });
    return { ...(await this.mapOne(id)), conversationId: conversation.id };
  }

  async refuse(actorId: string, id: string) {
    const inv = await this.prisma.socialInvite.findUnique({ where: { id } });
    if (!inv) throw new NotFoundException({ code: "INVITE_NOT_FOUND" });
    const gate = canRespondSocialInvite({
      status: inv.status,
      expiresAt: inv.expiresAt,
      inviteeId: inv.inviteeId,
      actorId,
    });
    if (gate !== "OK") {
      if (gate === "NOT_INVITEE") throw new ForbiddenException({ code: gate });
      throw new BadRequestException({ code: gate });
    }
    await this.prisma.socialInvite.update({
      where: { id },
      data: { status: "REFUSED", respondedAt: new Date() },
    });
    return this.mapOne(id);
  }

  private async expireStale() {
    await this.prisma.socialInvite.updateMany({
      where: { status: "SENT", expiresAt: { lte: new Date() } },
      data: { status: "EXPIRED" },
    });
  }

  private include() {
    return {
      inviter: { select: personSelect },
      invitee: { select: personSelect },
      wish: { select: { id: true, title: true, category: true } },
    };
  }

  private async mapOne(id: string) {
    const row = await this.prisma.socialInvite.findUnique({ where: { id }, include: this.include() });
    if (!row) throw new NotFoundException({ code: "INVITE_NOT_FOUND" });
    return this.serialize(row);
  }

  private serialize(r: {
    id: string;
    context: string;
    label: string;
    message: string;
    status: string;
    createdAt: Date;
    respondedAt: Date | null;
    expiresAt: Date;
    inviter: { id: string; firstName: string; lastName: string; username: string; certified: boolean; profile: { avatarUrl: string | null } | null };
    invitee: { id: string; firstName: string; lastName: string; username: string; certified: boolean; profile: { avatarUrl: string | null } | null };
    wish: { id: string; title: string; category: string } | null;
  }) {
    const mapPerson = (u: typeof r.inviter) => ({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      username: u.username,
      certified: u.certified,
      avatarUrl: u.profile?.avatarUrl ?? null,
    });
    return {
      id: r.id,
      context: r.context,
      label: r.label,
      message: r.message,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      respondedAt: r.respondedAt?.toISOString() ?? null,
      expiresAt: r.expiresAt.toISOString(),
      inviter: mapPerson(r.inviter),
      invitee: mapPerson(r.invitee),
      wish: r.wish,
    };
  }
}
