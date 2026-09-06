import { Controller, Get, Inject, Query, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { SessionGuard } from "../auth/session.guard";
import type { PublicUser } from "../auth/auth.service";
import { FeedService } from "./feed.service";

@Controller("feed")
@UseGuards(SessionGuard)
export class FeedController {
  constructor(@Inject(FeedService) private readonly feed: FeedService) {}

  @Get()
  list(
    @Req() req: Request & { user: PublicUser },
    @Query("cursor") cursor?: string,
    @Query("exclude") exclude?: string,
  ) {
    const excludeIds = exclude
      ? exclude
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean)
          .slice(0, 80)
      : [];
    return this.feed.list(req.user.id, { cursor, excludeIds });
  }
}
