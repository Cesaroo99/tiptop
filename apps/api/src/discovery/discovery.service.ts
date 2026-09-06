import { Inject, Injectable } from "@nestjs/common";
import {
  ageFromBirthDate,
  displayLocation,
  findZone,
  formatApproxDistance,
  formatLikeDuration,
  haversineKm,
  isCurrentlyAvailable,
  presenceState,
  publicCoords,
  roundDistanceKm,
  sumLikeSeconds,
  YAOUNDE_ZONES,
} from "@tiptop/domain";
import { PrismaService } from "../prisma.service";

export type NearbyFilters = {
  city?: string;
  zone?: string;
  maxKm?: number;
  minAge?: number;
  maxAge?: number;
  availableOnly?: boolean;
  presence?: "AVAILABLE" | "UNSURE" | "UNAVAILABLE";
  profession?: string;
  wishCategory?: string;
  lat?: number;
  lng?: number;
};

@Injectable()
export class DiscoveryService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  zones() {
    const cities = [...new Set(YAOUNDE_ZONES.map((z) => z.city))];
    return { cities, zones: YAOUNDE_ZONES };
  }

  async people(viewerId: string, filters: NearbyFilters = {}) {
    const viewer = await this.prisma.user.findUnique({
      where: { id: viewerId },
      include: { profile: true },
    });
    const filterCity = filters.city || viewer?.profile?.city || "Yaoundé";
    const now = new Date();
    const personInclude = {
      profile: true,
      wishes: {
        where: { visibility: "PUBLIC" },
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
        take: 4,
      },
    } as const;
    const [nearbyRows, contactRows, laterRows, myLike] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          id: { not: viewerId },
          status: "ACTIVE",
          profileCompleted: true,
          profile: {
            city: filterCity,
            locationPrecision: { not: "HIDDEN" },
            ...(filters.profession
              ? { profession: { contains: filters.profession, mode: "insensitive" as const } }
              : {}),
          },
        },
        include: personInclude,
      }),
      this.prisma.contact.findMany({
        where: { ownerId: viewerId },
        select: { personId: true, person: { include: personInclude } },
      }),
      this.prisma.inviteLater.findMany({
        where: { ownerId: viewerId },
        select: { personId: true, person: { include: personInclude } },
      }),
      this.prisma.likePeriod.findFirst({
        where: { actorId: viewerId, endedAt: null },
        select: { targetType: true, targetId: true },
      }),
    ]);
    const friendIds = new Set(contactRows.map((c) => c.personId));
    const laterIds = new Set(laterRows.map((r) => r.personId));
    const byId = new Map(nearbyRows.map((u) => [u.id, u]));
    for (const row of [...contactRows, ...laterRows]) {
      if (row.person.status === "ACTIVE" && row.person.profileCompleted && !byId.has(row.person.id)) {
        byId.set(row.person.id, row.person);
      }
    }
    const rows = [...byId.values()];
    const gps =
      filters.lat != null && filters.lng != null && Number.isFinite(filters.lat) && Number.isFinite(filters.lng)
        ? { latitude: filters.lat, longitude: filters.lng }
        : null;
    const origin =
      gps ??
      (viewer?.profile?.latitude != null && viewer.profile.longitude != null
        ? { latitude: viewer.profile.latitude, longitude: viewer.profile.longitude }
        : findZone(viewer?.profile?.city, viewer?.profile?.zone) ?? findZone(filterCity, filters.zone));

    const ids = rows.map((u) => u.id);
    const periods = ids.length
      ? await this.prisma.likePeriod.findMany({ where: { beneficiaryUserId: { in: ids } } })
      : [];
    const periodsByUser = new Map<string, typeof periods>();
    for (const p of periods) {
      const list = periodsByUser.get(p.beneficiaryUserId) ?? [];
      list.push(p);
      periodsByUser.set(p.beneficiaryUserId, list);
    }

    const activeMoods = ids.length
      ? await this.prisma.mood.findMany({
          where: { authorId: { in: ids }, expiresAt: { gt: now } },
          orderBy: { createdAt: "desc" },
        })
      : [];
    const moodByUser = new Map<string, (typeof activeMoods)[number]>();
    for (const m of activeMoods) {
      if (!moodByUser.has(m.authorId)) moodByUser.set(m.authorId, m);
    }

    const items = rows
      .map((u) => {
        const declared = {
          availability: (u.profile?.availability ?? "HIDDEN") as "HIDDEN" | "BUSY" | "AVAILABLE",
          availabilityUntil: u.profile?.availabilityUntil ?? null,
          now,
        };
        const available = isCurrentlyAvailable(declared);
        const presence = presenceState(declared);
        const precision = u.profile?.locationPrecision ?? "ZONE";
        const loc = displayLocation({
          precision,
          city: u.profile?.city ?? null,
          zone: u.profile?.zone ?? null,
        });
        const target =
          publicCoords(precision, u.profile?.latitude ?? null, u.profile?.longitude ?? null) ??
          findZone(u.profile?.city, u.profile?.zone);
        let distanceKm: number | null = null;
        if (origin && target && precision !== "HIDDEN") {
          distanceKm = roundDistanceKm(haversineKm(origin, target));
        }
        const sameZone = Boolean(filters.zone && u.profile?.zone === filters.zone);
        const age = ageFromBirthDate(u.profile?.birthDate ?? null);
        const userPeriods = periodsByUser.get(u.id) ?? [];
        const likeSum = sumLikeSeconds(
          userPeriods.map((p) => ({ startedAt: p.startedAt, endedAt: p.endedAt, weight: p.weight })),
          now,
        );
        const wishCategory = filters.wishCategory?.toUpperCase();
        const mood = moodByUser.get(u.id);
        const canReveal = mood && (mood.visibility === "ZONE" ? mood.city === filterCity : true);
        return {
          id: u.id,
          username: u.username,
          firstName: u.firstName,
          lastName: u.lastName,
          certified: u.certified,
          profession: u.profile?.profession ?? null,
          avatarUrl: u.profile?.avatarUrl ?? null,
          age,
          locationLabel: loc.label,
          approximate: loc.approximate,
          mapGrayed: loc.mapGrayed,
          distanceKm,
          distanceLabel: distanceKm != null ? formatApproxDistance(haversineKm(origin!, target!)) : null,
          city: precision === "HIDDEN" ? null : u.profile?.city ?? null,
          zone: precision === "ZONE" || precision === "EXACT" ? u.profile?.zone ?? null : null,
          sameZone,
          available,
          availability: presence === "AVAILABLE" ? "AVAILABLE" : presence === "UNSURE" ? "BUSY" : "HIDDEN",
          presence,
          circle: friendIds.has(u.id) ? "FRIEND" : laterIds.has(u.id) ? "LATER" : "NEARBY",
          likedByMe: myLike?.targetType === "USER" && myLike.targetId === u.id,
          likeTime: {
            totalSeconds: likeSum.totalSeconds,
            label: formatLikeDuration(likeSum.totalSeconds, "fr"),
          },
          wishes: u.wishes.map((w) => ({
            id: w.id,
            title: w.title,
            category: w.category,
          })),
          activeMood:
            mood && canReveal
              ? {
                  id: mood.id,
                  activity: mood.activity,
                  body: mood.body,
                  expiresAt: mood.expiresAt.toISOString(),
                }
              : null,
          _wishMatch: wishCategory ? u.wishes.some((w) => w.category === wishCategory) : true,
        };
      })
      .filter((a) => {
        const wanted = filters.presence ?? (filters.availableOnly ? "AVAILABLE" : undefined);
        if (wanted && a.presence !== wanted) return false;
        if (filters.maxKm != null && a.distanceKm != null && a.distanceKm > filters.maxKm) return false;
        if (filters.minAge != null && (a.age == null || a.age < filters.minAge)) return false;
        if (filters.maxAge != null && (a.age == null || a.age > filters.maxAge)) return false;
        if (filters.wishCategory && !a._wishMatch) return false;
        return true;
      })
      .sort((a, b) => {
        if (a.available !== b.available) return a.available ? -1 : 1;
        if (a.sameZone !== b.sameZone) return a.sameZone ? -1 : 1;
        return (a.distanceKm ?? 99) - (b.distanceKm ?? 99);
      })
      .map(({ _wishMatch, ...rest }) => rest);

    return { items };
  }
}
