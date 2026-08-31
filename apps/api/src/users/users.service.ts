import { ConflictException, Inject, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
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
                city: dto.city,
                zone: dto.zone,
              },
              update: {
                profession: dto.profession,
                city: dto.city,
                zone: dto.zone,
              },
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
