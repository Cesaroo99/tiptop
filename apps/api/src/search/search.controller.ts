import { Controller, Get, Inject, Query, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { SessionGuard } from "../auth/session.guard";
import type { PublicUser } from "../auth/auth.service";
import { SearchService, type SearchType } from "./search.service";

@Controller("search")
@UseGuards(SessionGuard)
export class SearchController {
  constructor(@Inject(SearchService) private readonly search: SearchService) {}

  @Get()
  run(
    @Req() req: Request & { user: PublicUser },
    @Query("q") q = "",
    @Query("type") type = "all",
    @Query("city") city = "",
    @Query("zone") zone = "",
  ) {
    const valid: SearchType[] = ["all", "people", "posts", "events", "wishes", "moods", "offers"];
    const t = valid.includes(type as SearchType) ? (type as SearchType) : "all";
    return this.search.search({
      q,
      type: t,
      viewerId: req.user.id,
      city: city || req.user.city || undefined,
      zone: zone || req.user.zone || undefined,
    });
  }
}
