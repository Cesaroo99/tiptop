import { BadRequestException, ConflictException, Inject, Injectable } from "@nestjs/common";
import { Availability, LocationPrecision, Prisma } from "@prisma/client";
import { availabilityUntil, findZone } from "@tiptop/domain";
import { PrismaService } from "../prisma.service";
import { AuthService } from "../auth/auth.service";
import type { UpdateMeDto } from "./dto";

function optionalText(value: string | undefined, max: number) {
  if (value === undefined) return undefined;
  const v = value.trim();
  if (!v) return null;
  if (v.length > max) throw new BadRequestException({ code: "INVALID_TEXT" });
  return v;
}

function optionalSeedUrl(value: string | undefined, folder: "avatars" | "covers") {
  if (value === undefined) return undefined;
  const v = value.trim();
  if (!v) return null;
  if (!new RegExp(`^/seed/${folder}/[a-z0-9._-]+\\.(jpe?g|png|webp)$`, "i").test(v)) {
    throw new BadRequestException({ code: "INVALID_MEDIA" });
  }
  return v;
}

function optionalBirthDate(value: string | undefined) {
  if (value === undefined) return undefined;
  const v = value.trim();
  if (!v) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) throw new BadRequestException({ code: "INVALID_BIRTHDATE" });
  const d = new Date(`${v}T12:00:00.000Z`);
  if (Number.isNaN(d.getTime())) throw new BadRequestException({ code: "INVALID_BIRTHDATE" });
  const oldest = new Date();
  oldest.setUTCFullYear(oldest.getUTCFullYear() - 120);
  const youngest = new Date();
  youngest.setUTCFullYear(youngest.getUTCFullYear() - 13);
  if (d < oldest || d > youngest) throw new BadRequestException({ code: "INVALID_BIRTHDATE" });
  return d;
}

function optionalCountry(value: string | undefined) {
  if (value === undefined) return undefined;
  const v = value.trim().toUpperCase();
  if (!v) return null;
  if (!/^[A-Z]{2}$/.test(v)) throw new BadRequestException({ code: "INVALID_COUNTRY" });
  return v;
}

function optionalWebsite(value: string | undefined) {
  if (value === undefined) return undefined;
  const v = value.trim().replace(/^https?:\/\//i, "").replace(/\/$/, "");
  if (!v) return null;
  if (v.length > 120) throw new BadRequestException({ code: "INVALID_WEBSITE" });
  return v;
}

@Injectable()
export class UsersService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuthService) private readonly auth: AuthService,
  ) {}

  async updateMe(userId: string, dto: UpdateMeDto) {
    try {
      const firstName = dto.firstName?.trim();
      const lastName = dto.lastName?.trim();
      const complete =
        Boolean(firstName && lastName) ||
        (await this.prisma.user.findUnique({ where: { id: userId } }))?.profileCompleted;

      const zoneHint = findZone(dto.city, dto.zone);
      let availabilityUntilAt: Date | null | undefined;
      if (dto.availability === "AVAILABLE") {
        availabilityUntilAt = availabilityUntil(new Date(), dto.ttlHours);
      } else if (dto.availability === "HIDDEN" || dto.availability === "BUSY") {
        availabilityUntilAt = null;
      }

      const bio = optionalText(dto.bio, 280);
      const website = optionalWebsite(dto.website);
      const avatarUrl = optionalSeedUrl(dto.avatarUrl, "avatars");
      const coverUrl = optionalSeedUrl(dto.coverUrl, "covers");
      const birthDate = optionalBirthDate(dto.birthDate);
      const country = optionalCountry(dto.country);

      const profilePatch = {
        profession: dto.profession,
        city: dto.city,
        zone: dto.zone,
        availability: dto.availability as Availability | undefined,
        availabilityUntil: availabilityUntilAt,
        locationPrecision: dto.locationPrecision as LocationPrecision | undefined,
        latitude: dto.latitude ?? zoneHint?.latitude,
        longitude: dto.longitude ?? zoneHint?.longitude,
        bio,
        website,
        avatarUrl,
        coverUrl,
        birthDate,
        country,
      };

      const user = await this.prisma.user.update({
        where: { id: userId },
        data: {
          firstName: firstName,
          lastName: lastName,
          username: dto.username,
          locale: dto.locale,
          theme: dto.theme,
          currency: dto.currency,
          profileCompleted: Boolean(firstName && lastName) ? true : undefined,
          profile: {
            upsert: {
              create: {
                profession: dto.profession,
                city: dto.city ?? "Yaoundé",
                zone: dto.zone,
                availability: (dto.availability as Availability | undefined) ?? Availability.HIDDEN,
                availabilityUntil: availabilityUntilAt ?? undefined,
                locationPrecision: (dto.locationPrecision as LocationPrecision | undefined) ?? LocationPrecision.ZONE,
                latitude: dto.latitude ?? zoneHint?.latitude,
                longitude: dto.longitude ?? zoneHint?.longitude,
                bio: bio ?? undefined,
                website: website ?? undefined,
                avatarUrl: avatarUrl ?? undefined,
                coverUrl: coverUrl ?? undefined,
                birthDate: birthDate ?? undefined,
                country: country ?? undefined,
              },
              update: profilePatch,
            },
          },
        },
        include: { profile: true },
      });
      void complete;
      return this.auth.toPublic(user);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        throw new ConflictException({ code: "USERNAME_TAKEN" });
      }
      throw e;
    }
  }
}
