import { Controller, Get, Inject, Param, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { SessionGuard } from "../auth/session.guard";
import type { PublicUser } from "../auth/auth.service";
import { ProfilesService } from "./profiles.service";

@Controller("profiles")
@UseGuards(SessionGuard)
export class ProfilesController {
  constructor(@Inject(ProfilesService) private readonly profiles: ProfilesService) {}

  @Get(":username")
  get(@Req() req: Request & { user: PublicUser }, @Param("username") username: string) {
    return this.profiles.byUsername(req.user.id, username);
  }
}
