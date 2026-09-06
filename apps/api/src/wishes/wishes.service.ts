import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { WishCategory, WishOfferStatus, WishPriority, WishVisibility } from "@prisma/client";
import { PrismaService } from "../prisma.service";
import { NotificationsService } from "../notifications/notifications.service";

@Injectable()
export class WishesService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(NotificationsService) private readonly notifications: NotificationsService,
  ) {}

  listMine(userId: string) {
    return this.prisma.wish.findMany({
      where: { ownerId: userId },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      include: { offers: { include: { fromUser: { select: { id: true, firstName: true, lastName: true, username: true } } } } },
    });
  }

  async listPublic(viewerId: string, ownerId: string) {
    const follow = await this.prisma.follow.findUnique({
      where: { followerId_followeeId: { followerId: viewerId, followeeId: ownerId } },
    });
    const vis: WishVisibility[] = ["PUBLIC"];
    if (follow || viewerId === ownerId) vis.push("FOLLOWERS");
    if (viewerId === ownerId) vis.push("PRIVATE");
    return this.prisma.wish.findMany({
      where: { ownerId, visibility: { in: vis } },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    });
  }

  async create(
    ownerId: string,
    input: {
      title: string;
      category?: string;
      description?: string;
      imageUrl?: string;
      url?: string;
      estimatedPriceXaf?: number;
      city?: string;
      zone?: string;
      desiredAt?: string;
      eventId?: string;
      priority?: string;
      visibility?: string;
    },
  ) {
    const title = input.title?.trim();
    if (!title) throw new BadRequestException({ code: "WISH_TITLE" });
    if (input.imageUrl && !input.imageUrl.startsWith("/seed/")) {
      throw new BadRequestException({ code: "IMAGE_NOT_ALLOWED" });
    }
    return this.prisma.wish.create({
      data: {
        ownerId,
        title,
        category: this.cat(input.category),
        description: (input.description ?? "").trim(),
        imageUrl: input.imageUrl || null,
        url: input.url || null,
        estimatedPriceXaf: input.estimatedPriceXaf ?? null,
        city: input.city || null,
        zone: input.zone || null,
        desiredAt: input.desiredAt ? new Date(input.desiredAt) : null,
        eventId: input.eventId || null,
        priority: this.prio(input.priority),
        visibility: this.vis(input.visibility),
      },
    });
  }

  async update(ownerId: string, id: string, input: Parameters<WishesService["create"]>[1]) {
    const wish = await this.prisma.wish.findUnique({ where: { id } });
    if (!wish || wish.ownerId !== ownerId) throw new NotFoundException({ code: "WISH_NOT_FOUND" });
    return this.prisma.wish.update({
      where: { id },
      data: {
        title: input.title?.trim() || wish.title,
        category: input.category ? this.cat(input.category) : undefined,
        description: input.description != null ? input.description.trim() : undefined,
        imageUrl: input.imageUrl,
        url: input.url,
        estimatedPriceXaf: input.estimatedPriceXaf,
        city: input.city,
        zone: input.zone,
        desiredAt: input.desiredAt ? new Date(input.desiredAt) : undefined,
        eventId: input.eventId,
        priority: input.priority ? this.prio(input.priority) : undefined,
        visibility: input.visibility ? this.vis(input.visibility) : undefined,
      },
    });
  }

  async remove(ownerId: string, id: string) {
    const wish = await this.prisma.wish.findUnique({ where: { id } });
    if (!wish || wish.ownerId !== ownerId) throw new NotFoundException({ code: "WISH_NOT_FOUND" });
    await this.prisma.wish.delete({ where: { id } });
    return { ok: true };
  }

  async offer(fromUserId: string, wishId: string, message: string) {
    const wish = await this.prisma.wish.findUnique({ where: { id: wishId } });
    if (!wish) throw new NotFoundException({ code: "WISH_NOT_FOUND" });
    if (wish.ownerId === fromUserId) throw new BadRequestException({ code: "WISH_SELF" });
    const row = await this.prisma.wishOffer.create({
      data: {
        wishId,
        fromUserId,
        message: message.trim(),
        status: WishOfferStatus.SENT,
      },
    });
    await this.notifications.create({
      userId: wish.ownerId,
      actorId: fromUserId,
      type: "WISH_OFFER",
      entityType: "wish",
      entityId: wish.id,
    });
    return row;
  }

  /** « Mes propositions » : offres reçues sur mes envies + offres que j'ai envoyées. */
  async myOffers(userId: string) {
    const include = {
      wish: { select: { id: true, title: true, category: true, ownerId: true } },
      fromUser: { select: { id: true, firstName: true, lastName: true, username: true, certified: true } },
    } as const;
    const [received, sent] = await Promise.all([
      this.prisma.wishOffer.findMany({
        where: { wish: { ownerId: userId } },
        orderBy: { createdAt: "desc" },
        include,
      }),
      this.prisma.wishOffer.findMany({
        where: { fromUserId: userId },
        orderBy: { createdAt: "desc" },
        include,
      }),
    ]);
    const map = (o: (typeof received)[number]) => ({
      id: o.id,
      status: o.status,
      message: o.message,
      createdAt: o.createdAt.toISOString(),
      wish: o.wish,
      fromUser: o.fromUser,
    });
    return { received: received.map(map), sent: sent.map(map) };
  }

  async decide(ownerId: string, offerId: string, accept: boolean) {
    const offer = await this.prisma.wishOffer.findUnique({
      where: { id: offerId },
      include: { wish: true },
    });
    if (!offer || offer.wish.ownerId !== ownerId) throw new NotFoundException({ code: "OFFER_NOT_FOUND" });
    const status = accept ? WishOfferStatus.ACCEPTED : WishOfferStatus.REFUSED;
    const row = await this.prisma.wishOffer.update({ where: { id: offerId }, data: { status } });
    await this.notifications.create({
      userId: offer.fromUserId,
      actorId: ownerId,
      type: "WISH_OFFER",
      entityType: "wish_offer",
      entityId: offer.id,
    });
    return row;
  }

  private cat(v?: string): WishCategory {
    const x = (v ?? "OTHER").toUpperCase();
    return (Object.values(WishCategory) as string[]).includes(x) ? (x as WishCategory) : WishCategory.OTHER;
  }
  private prio(v?: string): WishPriority {
    const x = (v ?? "MEDIUM").toUpperCase();
    return (Object.values(WishPriority) as string[]).includes(x) ? (x as WishPriority) : WishPriority.MEDIUM;
  }
  private vis(v?: string): WishVisibility {
    const x = (v ?? "PUBLIC").toUpperCase();
    return (Object.values(WishVisibility) as string[]).includes(x) ? (x as WishVisibility) : WishVisibility.PUBLIC;
  }
}
