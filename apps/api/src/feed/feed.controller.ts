import { Controller, Get, Inject, UseGuards } from "@nestjs/common";
import { SessionGuard } from "../auth/session.guard";
import { FeedService } from "./feed.service";

@Controller("feed")
@UseGuards(SessionGuard)
export class FeedController {
  constructor(@Inject(FeedService) private readonly feed: FeedService) {}

  @Get()
  list() {
    return this.feed.list();
  }
}
