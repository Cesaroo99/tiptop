import { Body, Controller, Delete, Get, Headers, Inject, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
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

class TargetLikeDto {
  @IsIn(["user", "post", "comment", "mood", "wish"])
  targetType!: "user" | "post" | "comment" | "mood" | "wish";

  @IsString()
  targetId!: string;

  @IsOptional()
  @IsBoolean()
  confirmTransfer?: boolean;
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

  @Post("likes")
  place(@Req() req: Request & { user: PublicUser }, @Body() body: TargetLikeDto) {
    return this.likes.placeOn(req.user.id, { type: body.targetType, id: body.targetId }, Boolean(body.confirmTransfer));
  }

  @Delete("likes")
  retract(@Req() req: Request & { user: PublicUser }, @Body() body: TargetLikeDto) {
    return this.likes.retractFrom(req.user.id, { type: body.targetType, id: body.targetId });
  }

  @Get("likes/target/:type/:id")
  targetTime(
    @Param("type") type: "user" | "post" | "comment" | "mood" | "wish",
    @Param("id") id: string,
  ) {
    return this.likes.timeForTarget(type, id);
  }

  @Get("users/:id/like-time")
  userTime(@Param("id") id: string) {
    return this.likes.timeForUser(id);
  }

  @Get("users/:id/like-history")
  history(@Param("id") id: string) {
    return this.likes.historyForUser(id);
  }

  @Get("likes/leaderboard")
  board(
    @Req() req: Request & { user: PublicUser },
    @Query("city") city?: string,
    @Query("window") window?: "all" | "week" | "month",
  ) {
    return this.likes.leaderboard({ city, window: window ?? "all" }, req.user.locale === "en" ? "en" : "fr");
  }

  @Get("likes/milestones")
  milestones(@Req() req: Request & { user: PublicUser }) {
    return this.likes.pendingCelebrations(req.user.id, req.user.locale === "en" ? "en" : "fr");
  }

  @Post("likes/milestones/:id/ack")
  ack(@Req() req: Request & { user: PublicUser }, @Param("id") id: string) {
    return this.likes.ackMilestone(req.user.id, id);
  }
}
