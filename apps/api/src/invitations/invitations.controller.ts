import { Body, Controller, Get, Inject, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
import { IsOptional, IsString } from "class-validator";
import type { Request } from "express";
import { SessionGuard } from "../auth/session.guard";
import type { PublicUser } from "../auth/auth.service";
import { InvitationsService } from "./invitations.service";

class CreateInviteDto {
  @IsString()
  inviteeId!: string;

  @IsString()
  eventId!: string;

  @IsOptional()
  @IsString()
  payer?: string;
}

@Controller()
@UseGuards(SessionGuard)
export class InvitationsController {
  constructor(@Inject(InvitationsService) private readonly invitations: InvitationsService) {}

  @Get("invitations/events-for/:userId")
  relevant(@Req() req: Request & { user: PublicUser }, @Param("userId") userId: string) {
    return this.invitations.relevantEvents(req.user.id, userId);
  }

  @Get("invitations")
  list(@Req() req: Request & { user: PublicUser }, @Query("box") box = "received") {
    const b = box === "sent" ? "sent" : "received";
    return this.invitations.list(req.user.id, b);
  }

  @Post("invitations")
  create(@Req() req: Request & { user: PublicUser }, @Body() body: CreateInviteDto) {
    return this.invitations.create(req.user.id, body.inviteeId, body.eventId, body.payer);
  }

  @Post("invitations/:id/accept")
  accept(@Req() req: Request & { user: PublicUser }, @Param("id") id: string) {
    return this.invitations.accept(req.user.id, id);
  }

  @Post("invitations/:id/refuse")
  refuse(@Req() req: Request & { user: PublicUser }, @Param("id") id: string) {
    return this.invitations.refuse(req.user.id, id);
  }
}
