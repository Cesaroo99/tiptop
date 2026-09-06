import { Body, Controller, Delete, Get, Inject, Param, Post, Req, UseGuards } from "@nestjs/common";
import { IsBoolean, IsOptional, IsString, MaxLength } from "class-validator";
import type { Request } from "express";
import { SessionGuard } from "../auth/session.guard";
import type { PublicUser } from "../auth/auth.service";
import { EventGroupsService } from "./groups.service";

class CreateGroupDto {
  @IsString()
  @MaxLength(60)
  name!: string;
}

class InviteDto {
  @IsString()
  userId!: string;
}

class AdminDto {
  @IsString()
  userId!: string;

  @IsOptional()
  @IsBoolean()
  admin?: boolean;
}

@Controller()
@UseGuards(SessionGuard)
export class EventGroupsController {
  constructor(@Inject(EventGroupsService) private readonly groups: EventGroupsService) {}

  @Get("events/:id/groups")
  list(@Req() req: Request & { user: PublicUser }, @Param("id") id: string) {
    return this.groups.list(req.user.id, id);
  }

  @Post("events/:id/groups")
  create(@Req() req: Request & { user: PublicUser }, @Param("id") id: string, @Body() body: CreateGroupDto) {
    return this.groups.create(req.user.id, id, body.name);
  }

  @Get("events/:id/groups/:groupId/candidates")
  candidates(
    @Req() req: Request & { user: PublicUser },
    @Param("id") id: string,
    @Param("groupId") groupId: string,
  ) {
    return this.groups.candidates(req.user.id, id, groupId);
  }

  @Post("events/:id/groups/:groupId/invite")
  invite(
    @Req() req: Request & { user: PublicUser },
    @Param("id") id: string,
    @Param("groupId") groupId: string,
    @Body() body: InviteDto,
  ) {
    return this.groups.invite(req.user.id, id, groupId, body.userId);
  }

  @Post("events/:id/groups/:groupId/accept")
  accept(
    @Req() req: Request & { user: PublicUser },
    @Param("id") id: string,
    @Param("groupId") groupId: string,
  ) {
    return this.groups.accept(req.user.id, id, groupId);
  }

  @Post("events/:id/groups/:groupId/decline")
  decline(
    @Req() req: Request & { user: PublicUser },
    @Param("id") id: string,
    @Param("groupId") groupId: string,
  ) {
    return this.groups.decline(req.user.id, id, groupId);
  }

  @Post("events/:id/groups/:groupId/leave")
  leave(
    @Req() req: Request & { user: PublicUser },
    @Param("id") id: string,
    @Param("groupId") groupId: string,
  ) {
    return this.groups.leave(req.user.id, id, groupId);
  }

  @Post("events/:id/groups/:groupId/admins")
  setAdmin(
    @Req() req: Request & { user: PublicUser },
    @Param("id") id: string,
    @Param("groupId") groupId: string,
    @Body() body: AdminDto,
  ) {
    return this.groups.setAdmin(req.user.id, id, groupId, body.userId, body.admin !== false);
  }

  @Post("events/:id/groups/:groupId/conversation")
  conversation(
    @Req() req: Request & { user: PublicUser },
    @Param("id") id: string,
    @Param("groupId") groupId: string,
  ) {
    return this.groups.conversation(req.user.id, id, groupId);
  }

  @Delete("events/:id/groups/:groupId")
  remove(
    @Req() req: Request & { user: PublicUser },
    @Param("id") id: string,
    @Param("groupId") groupId: string,
  ) {
    return this.groups.remove(req.user.id, id, groupId);
  }
}
