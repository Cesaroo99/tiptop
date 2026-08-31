import { Inject, Injectable } from "@nestjs/common";
import {
  ageFromBirthDate,
  displayLocation,
  findZone,
  haversineKm,
  isCurrentlyAvailable,
  publicCoords,
  roundDistanceKm,
  YAOUNDE_ZONES,
} from "@tiptop/domain";
import { PrismaService } from "../prisma.service";

@Injectable()
export class DiscoveryService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  zones() {
    const cities = [...new Set(YAOUNDE_ZONES.map((z) => z.city))];
    return { cities, zones: YAOUNDE_ZONES };
  }

  async people(viewerId: string, city?: string, zone?: string) {
    const viewer = await this.prisma.user.findUnique({
      where: { id: viewerId },
      include: { profile: true },
    });
    const filterCity = city || viewer?.profile?.city || "Yaoundé";
    const now = new Date();
    const rows = await this.prisma.user.findMany({
      where: {
        id: { not: viewerId },
        status: "ACTIVE",
        profileCompleted: true,
        profile: {
          availability: "AVAILABLE",
          availabilityUntil: { gt: now },
          city: filterCity,
        },
      },
      include: { profile: true },
    });
    const origin =
      viewer?.profile?.latitude != null && viewer.profile.longitude != null
        ? { latitude: viewer.profile.latitude, longitude: viewer.profile.longitude }
        : findZone(viewer?.profile?.city, viewer?.profile?.zone) ?? findZone(filterCity, zone);

    const items = rows
      .filter((u) =>
        isCurrentlyAvailable({
          availability: u.profile?.availability ?? "HIDDEN",
          availabilityUntil: u.profile?.availabilityUntil ?? null,
          now,
        }),
      )
      .map((u) => {
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
        const sameZone = Boolean(zone && u.profile?.zone === zone);
        return {
          id: u.id,
          username: u.username,
          firstName: u.firstName,
          lastName: u.lastName,
          certified: u.certified,
          profession: u.profile?.profession ?? null,
          avatarUrl: u.profile?.avatarUrl ?? null,
          age: ageFromBirthDate(u.profile?.birthDate ?? null),
          locationLabel: loc.label,
          approximate: loc.approximate,
          mapGrayed: loc.mapGrayed,
          distanceKm,
          city: precision === "HIDDEN" ? null : u.profile?.city ?? null,
          zone: precision === "ZONE" || precision === "EXACT" ? u.profile?.zone ?? null : null,
          sameZone,
        };
      })
      .sort((a, b) => {
        if (a.sameZone !== b.sameZone) return a.sameZone ? -1 : 1;
        return (a.distanceKm ?? 99) - (b.distanceKm ?? 99);
      });

    return { items };
  }
}
