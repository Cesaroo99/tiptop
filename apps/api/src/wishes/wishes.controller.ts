import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { IsOptional, IsString } from "class-validator";
import type { Request } from "express";
import { SessionGuard } from "../auth/session.guard";
import type { PublicUser } from "../auth/auth.service";
import { WishesService } from "./wishes.service";

class WishDto {
  @IsString()
  title!: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @IsString() url?: string;
  @IsOptional() estimatedPriceXaf?: number;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() zone?: string;
  @IsOptional() @IsString() desiredAt?: string;
  @IsOptional() @IsString() eventId?: string;
  @IsOptional() @IsString() priority?: string;
  @IsOptional() @IsString() visibility?: string;
}

class OfferDto {
  @IsOptional() @IsString() message?: string;
}

@Controller()
@UseGuards(SessionGuard)
export class WishesController {
  constructor(@Inject(WishesService) private readonly wishes: WishesService) {}

  @Get("wishes/me")
  mine(@Req() req: Request & { user: PublicUser }) {
    return this.wishes.listMine(req.user.id);
  }

  @Get("wishes/offers/mine")
  myOffers(@Req() req: Request & { user: PublicUser }) {
    return this.wishes.myOffers(req.user.id);
  }

  @Get("users/:id/wishes")
  ofUser(@Req() req: Request & { user: PublicUser }, @Param("id") id: string) {
    return this.wishes.listPublic(req.user.id, id);
  }

  @Post("wishes")
  create(@Req() req: Request & { user: PublicUser }, @Body() body: WishDto) {
    return this.wishes.create(req.user.id, body);
  }

  @Patch("wishes/:id")
  update(@Req() req: Request & { user: PublicUser }, @Param("id") id: string, @Body() body: WishDto) {
    return this.wishes.update(req.user.id, id, body);
  }

  @Delete("wishes/:id")
  remove(@Req() req: Request & { user: PublicUser }, @Param("id") id: string) {
    return this.wishes.remove(req.user.id, id);
  }

  @Post("wishes/:id/offer")
  offer(@Req() req: Request & { user: PublicUser }, @Param("id") id: string, @Body() body: OfferDto) {
    return this.wishes.offer(req.user.id, id, body.message ?? "");
  }

  @Post("wish-offers/:id/accept")
  accept(@Req() req: Request & { user: PublicUser }, @Param("id") id: string) {
    return this.wishes.decide(req.user.id, id, true);
  }

  @Post("wish-offers/:id/refuse")
  refuse(@Req() req: Request & { user: PublicUser }, @Param("id") id: string) {
    return this.wishes.decide(req.user.id, id, false);
  }
}
