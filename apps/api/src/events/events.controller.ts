import { Body, Controller, Delete, Get, Inject, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
import { IsBoolean, IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";
import { Type } from "class-transformer";
import type { Request } from "express";
import { SessionGuard } from "../auth/session.guard";
import type { PublicUser } from "../auth/auth.service";
import { EventsService } from "./events.service";

class CreateEventDto {
  @IsString()
  @MaxLength(120)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  zone?: string;

  @IsOptional()
  @IsString()
  venue?: string;

  @IsString()
  startsAt!: string;

  @IsOptional()
  @IsString()
  endsAt?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  priceXaf?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5000)
  capacity?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(99)
  minAge?: number;

  @IsOptional()
  @IsBoolean()
  requiresReservation?: boolean;
}

class HeartDto {
  @IsOptional()
  @IsBoolean()
  confirmTransfer?: boolean;
}

@Controller()
@UseGuards(SessionGuard)
export class EventsController {
  constructor(@Inject(EventsService) private readonly events: EventsService) {}

  @Get("events")
  list(
    @Req() req: Request & { user: PublicUser },
    @Query("tab") tab = "all",
    @Query("city") city?: string,
  ) {
    const t = tab === "mine" ? "mine" : "all";
    return this.events.list(req.user.id, t, city);
  }

  @Post("events")
  create(@Req() req: Request & { user: PublicUser }, @Body() body: CreateEventDto) {
    return this.events.create(req.user.id, body);
  }

  @Get("events/:id")
  get(@Req() req: Request & { user: PublicUser }, @Param("id") id: string) {
    return this.events.get(req.user.id, id);
  }

  @Post("events/:id/interested")
  interested(@Req() req: Request & { user: PublicUser }, @Param("id") id: string) {
    return this.events.toggleInterested(req.user.id, id);
  }

  @Get("events/:id/heart/preview")
  heartPreview(@Req() req: Request & { user: PublicUser }, @Param("id") id: string) {
    return this.events.heartPreview(req.user.id, id);
  }

  @Post("events/:id/heart")
  heart(@Req() req: Request & { user: PublicUser }, @Param("id") id: string, @Body() body: HeartDto) {
    return this.events.heart(req.user.id, id, Boolean(body?.confirmTransfer));
  }

  @Delete("events/:id/heart")
  unheart(@Req() req: Request & { user: PublicUser }, @Param("id") id: string) {
    return this.events.unheart(req.user.id, id);
  }

  @Get("favorites")
  favorites(@Req() req: Request & { user: PublicUser }) {
    return this.events.favorites(req.user.id);
  }
}
