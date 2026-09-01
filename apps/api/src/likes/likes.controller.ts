import { Body, Controller, Delete, Get, Headers, Inject, Param, Post, Req, UseGuards } from "@nestjs/common";
import { IsBoolean, IsIn, IsOptional, IsString } from "class-validator";
import type { Request } from "express";
import { SessionGuard } from "../auth/session.guard";
import type { PublicUser } from "../auth/auth.service";
import { LikesService } from "./likes.service";

class LikeDto {
  @IsOptional()
  @IsBoolean()
  confirmTransfer?: boolean;
}

class PurchaseDto {
  @IsString()
  packCode!: string;

  @IsIn(["CARD", "ORANGE_MONEY", "MTN_MOMO"])
  provider!: "CARD" | "ORANGE_MONEY" | "MTN_MOMO";

  @IsOptional()
  @IsBoolean()
  fail?: boolean;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}

@Controller()
@UseGuards(SessionGuard)
export class LikesController {
  constructor(@Inject(LikesService) private readonly likes: LikesService) {}

  @Get("likes/me")
  mine(@Req() req: Request & { user: PublicUser }) {
    return this.likes.mine(req.user.id);
  }

  @Get("likes/wallet")
  wallet(@Req() req: Request & { user: PublicUser }) {
    return this.likes.wallet(req.user.id);
  }

  @Get("likes/packs")
  packs() {
    return this.likes.packs();
  }

  @Post("likes/purchase")
  purchase(
    @Req() req: Request & { user: PublicUser },
    @Body() body: PurchaseDto,
    @Headers("idempotency-key") headerKey?: string,
  ) {
    return this.likes.purchase(req.user.id, {
      packCode: body.packCode,
      provider: body.provider,
      fail: body.fail,
      idempotencyKey: body.idempotencyKey || headerKey || `likes_${req.user.id}_${Date.now()}`,
    });
  }

  @Get("likes/stats/:userId")
  stats(@Param("userId") userId: string) {
    return this.likes.statsFor(userId);
  }

  @Get("users/:id/like/preview")
  preview(@Req() req: Request & { user: PublicUser }, @Param("id") id: string) {
    return this.likes.preview(req.user.id, id);
  }

  @Post("users/:id/like")
  like(@Req() req: Request & { user: PublicUser }, @Param("id") id: string, @Body() body: LikeDto) {
    return this.likes.like(req.user.id, id, Boolean(body?.confirmTransfer));
  }

  @Delete("users/:id/like")
  unlike(@Req() req: Request & { user: PublicUser }, @Param("id") id: string) {
    return this.likes.unlike(req.user.id, id);
  }
}
