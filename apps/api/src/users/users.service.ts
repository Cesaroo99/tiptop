import { ConflictException, Inject, Injectable } from "@nestjs/common";
import { Availability, LocationPrecision, Prisma } from "@prisma/client";
import { availabilityUntil, findZone } from "@tiptop/domain";
import { PrismaService } from "../prisma.service";
import { AuthService } from "../auth/auth.service";
import type { UpdateMeDto } from "./dto";

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

      const profilePatch = {
        profession: dto.profession,
        city: dto.city,
        zone: dto.zone,
        availability: dto.availability as Availability | undefined,
        availabilityUntil: availabilityUntilAt,
        locationPrecision: dto.locationPrecision as LocationPrecision | undefined,
        latitude: dto.latitude ?? zoneHint?.latitude,
        longitude: dto.longitude ?? zoneHint?.longitude,
      };

      const user = await this.prisma.user.update({
        where: { id: userId },
        data: {
          firstName: firstName,
          lastName: lastName,
          username: dto.username,
          locale: dto.locale,
          theme: dto.theme,
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
