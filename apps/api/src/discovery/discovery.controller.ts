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
    @Query("maxKm") maxKm?: string,
    @Query("minAge") minAge?: string,
    @Query("maxAge") maxAge?: string,
    @Query("available") available?: string,
    @Query("profession") profession?: string,
    @Query("wishCategory") wishCategory?: string,
  ) {
    return this.discovery.people(req.user.id, {
      city,
      zone,
      maxKm: maxKm ? Number(maxKm) : undefined,
      minAge: minAge ? Number(minAge) : undefined,
      maxAge: maxAge ? Number(maxAge) : undefined,
      availableOnly: available === "1" || available === "true",
      profession,
      wishCategory,
    });
  }
}
