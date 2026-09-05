import { Body, Controller, Get, Inject, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
import { IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";
import { Type } from "class-transformer";
import type { Request } from "express";
import { SessionGuard } from "../auth/session.guard";
import type { PublicUser } from "../auth/auth.service";
import { OffersService } from "./offers.service";

class CreateOfferDto {
  @IsString()
  @MaxLength(80)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsString()
  kind!: string;

  @IsOptional()
  @IsString()
  sellerKind?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  shopName?: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  priceXaf!: number;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  zone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  placeName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  address?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}

@Controller()
@UseGuards(SessionGuard)
export class OffersController {
  constructor(@Inject(OffersService) private readonly offers: OffersService) {}

  @Get("offers")
  list(
    @Req() req: Request & { user: PublicUser },
    @Query("q") q?: string,
    @Query("kind") kind?: string,
    @Query("sort") sort?: string,
    @Query("city") city?: string,
    @Query("maxKm") maxKm?: string,
    @Query("mine") mine?: string,
  ) {
    return this.offers.list(req.user.id, {
      q,
      kind,
      sort,
      city,
      maxKm: maxKm ? Number(maxKm) : undefined,
      mine: mine === "1" || mine === "true",
    });
  }

  @Get("offers/:id")
  get(@Req() req: Request & { user: PublicUser }, @Param("id") id: string) {
    return this.offers.get(id, req.user.id);
  }

  @Post("offers")
  create(@Req() req: Request & { user: PublicUser }, @Body() body: CreateOfferDto) {
    return this.offers.create(req.user.id, body);
  }

  @Post("offers/:id/hide")
  hide(@Req() req: Request & { user: PublicUser }, @Param("id") id: string) {
    return this.offers.hide(id, req.user.id);
  }
}
