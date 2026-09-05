import { Controller, Delete, Get, Inject, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { SessionGuard } from "../auth/session.guard";
import type { PublicUser } from "../auth/auth.service";
import { InvitePoolService } from "./invite-pool.service";

@Controller()
@UseGuards(SessionGuard)
export class InvitePoolController {
  constructor(@Inject(InvitePoolService) private readonly pool: InvitePoolService) {}

  @Get("invite-pool")
  list(@Req() req: Request & { user: PublicUser }, @Query("q") q?: string) {
    return this.pool.pool(req.user.id, q);
  }

  @Get("invite-later")
  later(@Req() req: Request & { user: PublicUser }) {
    return this.pool.listLater(req.user.id);
  }

  @Post("invite-later/:userId")
  save(@Req() req: Request & { user: PublicUser }, @Param("userId") userId: string) {
    return this.pool.saveLater(req.user.id, userId);
  }

  @Delete("invite-later/:userId")
  remove(@Req() req: Request & { user: PublicUser }, @Param("userId") userId: string) {
    return this.pool.removeLater(req.user.id, userId);
  }
}
