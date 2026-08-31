import { Controller, Get, Inject, Param, Post, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { SessionGuard } from "../auth/session.guard";
import type { PublicUser } from "../auth/auth.service";
import { NotificationsService } from "./notifications.service";

@Controller("notifications")
@UseGuards(SessionGuard)
export class NotificationsController {
  constructor(@Inject(NotificationsService) private readonly notifications: NotificationsService) {}

  @Get()
  list(@Req() req: Request & { user: PublicUser }) {
    return this.notifications.list(req.user.id);
  }

  @Post("read-all")
  readAll(@Req() req: Request & { user: PublicUser }) {
    return this.notifications.markAllRead(req.user.id);
  }

  @Post(":id/read")
  read(@Req() req: Request & { user: PublicUser }, @Param("id") id: string) {
    return this.notifications.markRead(req.user.id, id);
  }
}
