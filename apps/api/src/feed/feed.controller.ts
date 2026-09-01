import { Controller, Get, Inject, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { SessionGuard } from "../auth/session.guard";
import type { PublicUser } from "../auth/auth.service";
import { FeedService } from "./feed.service";

@Controller("feed")
@UseGuards(SessionGuard)
export class FeedController {
  constructor(@Inject(FeedService) private readonly feed: FeedService) {}

  @Get()
  list(@Req() req: Request & { user: PublicUser }) {
    return this.feed.list(req.user.id);
  }
}
