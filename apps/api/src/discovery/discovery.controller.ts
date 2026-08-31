import { Controller, Get, Inject, Query, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { SessionGuard } from "../auth/session.guard";
import type { PublicUser } from "../auth/auth.service";
import { DiscoveryService } from "./discovery.service";

@Controller()
@UseGuards(SessionGuard)
export class DiscoveryController {
  constructor(@Inject(DiscoveryService) private readonly discovery: DiscoveryService) {}

  @Get("geo/zones")
  zones() {
    return this.discovery.zones();
  }

  @Get("discovery/people")
  people(
    @Req() req: Request & { user: PublicUser },
    @Query("city") city?: string,
    @Query("zone") zone?: string,
  ) {
    return this.discovery.people(req.user.id, city, zone);
  }
}
