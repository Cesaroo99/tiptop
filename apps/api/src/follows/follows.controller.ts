import { Controller, Delete, Inject, Param, Post, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { SessionGuard } from "../auth/session.guard";
import type { PublicUser } from "../auth/auth.service";
import { FollowsService } from "./follows.service";

@Controller("users")
@UseGuards(SessionGuard)
export class FollowsController {
  constructor(@Inject(FollowsService) private readonly follows: FollowsService) {}

  @Post(":id/follow")
  follow(@Req() req: Request & { user: PublicUser }, @Param("id") id: string) {
    return this.follows.follow(req.user.id, id);
  }

  @Delete(":id/follow")
  unfollow(@Req() req: Request & { user: PublicUser }, @Param("id") id: string) {
    return this.follows.unfollow(req.user.id, id);
  }
}
