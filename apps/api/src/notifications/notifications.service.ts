import { Inject, Injectable } from "@nestjs/common";
import { NotificationType } from "@prisma/client";
import { PrismaService } from "../prisma.service";

@Injectable()
export class NotificationsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create(input: {
    userId: string;
    actorId?: string | null;
    type: NotificationType;
    entityType?: string;
    entityId?: string;
  }) {
    if (input.actorId && input.actorId === input.userId) return null;
    return this.prisma.notification.create({
      data: {
        userId: input.userId,
        actorId: input.actorId ?? null,
        type: input.type,
        entityType: input.entityType,
        entityId: input.entityId,
      },
    });
  }

  async list(userId: string) {
    const items = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        actor: { select: { id: true, firstName: true, lastName: true, username: true, certified: true } },
      },
    });
    const unreadCount = await this.prisma.notification.count({
      where: { userId, readAt: null },
    });
    return {
      unreadCount,
      items: items.map((n) => ({
        id: n.id,
        type: n.type,
        entityType: n.entityType,
        entityId: n.entityId,
        read: Boolean(n.readAt),
        createdAt: n.createdAt.toISOString(),
        actor: n.actor,
      })),
    };
  }

  async markRead(userId: string, id: string) {
    await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { readAt: new Date() },
    });
    return { ok: true };
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { ok: true };
  }
}
