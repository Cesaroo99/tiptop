import { Controller, Get, Inject, Query, UseGuards } from "@nestjs/common";
import { SessionGuard } from "../auth/session.guard";
import { SearchService } from "./search.service";

@Controller("search")
@UseGuards(SessionGuard)
export class SearchController {
  constructor(@Inject(SearchService) private readonly search: SearchService) {}

  @Get()
  run(@Query("q") q = "", @Query("type") type = "all") {
    const t = type === "people" || type === "posts" || type === "events" ? type : "all";
    return this.search.search(q, t);
  }
}
