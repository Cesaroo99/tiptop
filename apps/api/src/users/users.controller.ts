import { Body, Controller, Get, Inject, Patch, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { SessionGuard } from "../auth/session.guard";
import type { PublicUser } from "../auth/auth.service";
import { UsersService } from "./users.service";
import { UpdateMeDto } from "./dto";

@Controller("users")
@UseGuards(SessionGuard)
export class UsersController {
  constructor(@Inject(UsersService) private readonly users: UsersService) {}

  @Get("me")
  me(@Req() req: Request & { user: PublicUser }) {
    return req.user;
  }

  @Patch("me")
  update(@Req() req: Request & { user: PublicUser }, @Body() body: UpdateMeDto) {
    return this.users.updateMe(req.user.id, body);
  }
}
