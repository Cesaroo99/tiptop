import { Body, Controller, Get, Inject, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";
import type { Request } from "express";
import { SessionGuard } from "../auth/session.guard";
import type { PublicUser } from "../auth/auth.service";
import { SocialInvitesService } from "./social-invites.service";

class CreateSocialInviteDto {
  @IsString()
  inviteeId!: string;

  @IsIn(["RESTAURANT", "CAFE", "ACTIVITY", "MEETUP", "WISH"])
  context!: "RESTAURANT" | "CAFE" | "ACTIVITY" | "MEETUP" | "WISH";

  @IsOptional()
  @IsString()
  @MaxLength(120)
  label?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;

  @IsOptional()
  @IsString()
  wishId?: string;
}

@Controller("social-invites")
@UseGuards(SessionGuard)
export class SocialInvitesController {
  constructor(@Inject(SocialInvitesService) private readonly invites: SocialInvitesService) {}

  @Get()
  list(@Req() req: Request & { user: PublicUser }, @Query("box") box = "received") {
    const b = box === "sent" ? "sent" : "received";
    return this.invites.list(req.user.id, b);
  }

  @Post()
  create(@Req() req: Request & { user: PublicUser }, @Body() body: CreateSocialInviteDto) {
    return this.invites.create(req.user.id, body);
  }

  @Post(":id/accept")
  accept(@Req() req: Request & { user: PublicUser }, @Param("id") id: string) {
    return this.invites.accept(req.user.id, id);
  }

  @Post(":id/refuse")
  refuse(@Req() req: Request & { user: PublicUser }, @Param("id") id: string) {
    return this.invites.refuse(req.user.id, id);
  }
}
