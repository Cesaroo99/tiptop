import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import {
  mapsDirectionsUrl,
  moodHasPlace,
  moodPlaceLabel,
  offerDistanceKm,
  offerDistanceLabel,
  parseOfferKind,
  parseOfferSellerKind,
  parseOfferSort,
  rankOffers,
  validateMoodCoords,
} from "@tiptop/domain";
import { PrismaService } from "../prisma.service";

const sellerSelect = {
  id: true,
  username: true,
  firstName: true,
  lastName: true,
  certified: true,
  profile: { select: { avatarUrl: true, profession: true } },
} as const;

@Injectable()
export class OffersService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async list(
    viewerId: string,
    query: {
      q?: string;
      kind?: string;
      sort?: string;
      city?: string;
      maxKm?: number;
      mine?: boolean;
    },
  ) {
    const viewer = await this.prisma.user.findUnique({
      where: { id: viewerId },
      include: { profile: true },
    });
    const origin =
      viewer?.profile?.latitude != null && viewer.profile.longitude != null
        ? { latitude: viewer.profile.latitude, longitude: viewer.profile.longitude }
        : null;
    const sort = parseOfferSort(query.sort);
    const kind = parseOfferKind(query.kind);
    const city = query.city?.trim() || viewer?.profile?.city || undefined;
    const text = query.q?.trim();

    const where: Prisma.OfferWhereInput = query.mine
      ? { sellerId: viewerId }
      : {
          status: "ACTIVE",
          ...(kind ? { kind } : {}),
          ...(city ? { city } : {}),
          ...(text
            ? {
                OR: [
                  { title: { contains: text, mode: Prisma.QueryMode.insensitive } },
                  { description: { contains: text, mode: Prisma.QueryMode.insensitive } },
                  { shopName: { contains: text, mode: Prisma.QueryMode.insensitive } },
                  { placeName: { contains: text, mode: Prisma.QueryMode.insensitive } },
                ],
              }
            : {}),
        };

    const rows = await this.prisma.offer.findMany({
      where,
      take: 80,
      orderBy: { createdAt: "desc" },
      include: { seller: { select: sellerSelect } },
    });

    const mapped = rows.map((row) => {
      const distanceKm = offerDistanceKm(origin, row);
      return this.toCard(row, distanceKm, row.sellerId === viewerId);
    });
    const maxKm = query.maxKm && query.maxKm > 0 ? query.maxKm : undefined;
    const filtered = maxKm != null ? mapped.filter((o) => o.distanceKm == null || o.distanceKm <= maxKm) : mapped;
    return { items: rankOffers(filtered, sort) };
  }

  async get(id: string, viewerId: string) {
    const row = await this.prisma.offer.findUnique({
      where: { id },
      include: { seller: { select: sellerSelect } },
    });
    if (!row) throw new NotFoundException({ code: "OFFER_NOT_FOUND" });
    if (row.status !== "ACTIVE" && row.sellerId !== viewerId) {
      throw new NotFoundException({ code: "OFFER_NOT_FOUND" });
    }
    const viewer = await this.prisma.user.findUnique({
      where: { id: viewerId },
      include: { profile: true },
    });
    const origin =
      viewer?.profile?.latitude != null && viewer.profile.longitude != null
        ? { latitude: viewer.profile.latitude, longitude: viewer.profile.longitude }
        : null;
    return this.toCard(row, offerDistanceKm(origin, row), row.sellerId === viewerId);
  }

  async create(
    sellerId: string,
    input: {
      title?: string;
      description?: string;
      kind?: string;
      sellerKind?: string;
      shopName?: string;
      priceXaf?: number;
      city?: string;
      zone?: string;
      placeName?: string;
      address?: string;
      latitude?: number;
      longitude?: number;
      imageUrl?: string;
    },
  ) {
    const title = (input.title ?? "").trim();
    if (title.length < 2) throw new BadRequestException({ code: "OFFER_TITLE_REQUIRED" });
    const kind = parseOfferKind(input.kind);
    if (!kind) throw new BadRequestException({ code: "OFFER_KIND_REQUIRED" });
    const priceXaf = Number(input.priceXaf);
    if (!Number.isFinite(priceXaf) || priceXaf < 0) throw new BadRequestException({ code: "OFFER_PRICE_INVALID" });
    let coords: { latitude: number; longitude: number } | null = null;
    try {
      coords = validateMoodCoords(input.latitude, input.longitude);
    } catch {
      throw new BadRequestException({ code: "OFFER_COORDS_INVALID" });
    }
    const city = input.city?.trim() || null;
    const zone = input.zone?.trim() || null;
    const placeName = input.placeName?.trim().slice(0, 120) || null;
    const address = input.address?.trim().slice(0, 240) || null;
    if (!moodHasPlace({ placeName, address, city, zone, latitude: coords?.latitude, longitude: coords?.longitude })) {
      throw new BadRequestException({ code: "OFFER_PLACE_REQUIRED" });
    }
    let imageUrl = input.imageUrl?.trim() || null;
    if (imageUrl && !imageUrl.startsWith("/seed/")) {
      throw new BadRequestException({ code: "IMAGE_NOT_ALLOWED" });
    }
    const seller = await this.prisma.user.findUnique({
      where: { id: sellerId },
      include: { profile: true },
    });
    const row = await this.prisma.offer.create({
      data: {
        sellerId,
        kind,
        sellerKind: parseOfferSellerKind(input.sellerKind),
        title: title.slice(0, 80),
        description: (input.description ?? "").trim().slice(0, 500),
        shopName: input.shopName?.trim().slice(0, 80) || null,
        priceXaf: Math.round(priceXaf),
        city: city || seller?.profile?.city || "Yaoundé",
        zone: zone || seller?.profile?.zone || null,
        placeName,
        address,
        latitude: coords?.latitude ?? null,
        longitude: coords?.longitude ?? null,
        imageUrl,
      },
      include: { seller: { select: sellerSelect } },
    });
    return this.toCard(row, 0, true);
  }

  async hide(id: string, sellerId: string) {
    const row = await this.prisma.offer.findUnique({ where: { id } });
    if (!row) throw new NotFoundException({ code: "OFFER_NOT_FOUND" });
    if (row.sellerId !== sellerId) throw new ForbiddenException({ code: "OFFER_FORBIDDEN" });
    await this.prisma.offer.update({ where: { id }, data: { status: "HIDDEN" } });
    return { ok: true };
  }

  private toCard(
    row: {
      id: string;
      sellerId: string;
      kind: "PRODUCT" | "SERVICE";
      sellerKind: "PERSON" | "SHOP" | "BUSINESS";
      title: string;
      description: string;
      shopName: string | null;
      priceXaf: number;
      currency: string;
      city: string;
      zone: string | null;
      placeName: string | null;
      address: string | null;
      latitude: number | null;
      longitude: number | null;
      imageUrl: string | null;
      status: "ACTIVE" | "HIDDEN";
      seller: {
        id: string;
        username: string;
        firstName: string;
        lastName: string;
        certified: boolean;
        profile: { avatarUrl: string | null; profession: string | null } | null;
      };
    },
    distanceKm: number | null,
    isMine: boolean,
  ) {
    const place = {
      placeName: row.placeName,
      address: row.address,
      city: row.city,
      zone: row.zone,
      latitude: row.latitude,
      longitude: row.longitude,
    };
    return {
      id: row.id,
      kind: row.kind,
      sellerKind: row.sellerKind,
      title: row.title,
      description: row.description,
      shopName: row.shopName,
      priceXaf: row.priceXaf,
      currency: row.currency,
      city: row.city,
      zone: row.zone,
      placeName: row.placeName,
      address: row.address,
      latitude: row.latitude,
      longitude: row.longitude,
      placeLabel: moodPlaceLabel(place),
      directionsUrl: mapsDirectionsUrl(place),
      imageUrl: row.imageUrl,
      status: row.status,
      isMine,
      distanceKm,
      distanceLabel: offerDistanceLabel(distanceKm),
      seller: {
        id: row.seller.id,
        username: row.seller.username,
        firstName: row.seller.firstName,
        lastName: row.seller.lastName,
        certified: row.seller.certified,
        avatarUrl: row.seller.profile?.avatarUrl ?? null,
        profession: row.seller.profile?.profession ?? null,
      },
    };
  }
}
