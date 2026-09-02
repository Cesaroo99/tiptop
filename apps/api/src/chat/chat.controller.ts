import { Body, Controller, Get, Inject, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { IsBoolean, IsIn, IsOptional, IsString, MaxLength } from "class-validator";
import type { Request } from "express";
import { SessionGuard } from "../auth/session.guard";
import type { PublicUser } from "../auth/auth.service";
import { ChatService } from "./chat.service";
import { PushService } from "./push.service";

class DirectDto {
  @IsString()
  userId!: string;
}

class EventDto {
  @IsString()
  eventId!: string;
}

class SendDto {
  @IsOptional()
  @IsIn(["TEXT", "IMAGE", "AUDIO"])
  kind?: "TEXT" | "IMAGE" | "AUDIO";

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  body?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}

class DeviceDto {
  @IsString()
  platform!: string;

  @IsOptional()
  @IsString()
  pushToken?: string;
}

class PrefsDto {
  @IsOptional()
  @IsBoolean()
  messages?: boolean;

  @IsOptional()
  @IsBoolean()
  social?: boolean;

  @IsOptional()
  @IsBoolean()
  events?: boolean;

  @IsOptional()
  @IsBoolean()
  invitations?: boolean;

  @IsOptional()
  @IsBoolean()
  mood?: boolean;
}

@Controller()
@UseGuards(SessionGuard)
export class ChatController {
  constructor(
    @Inject(ChatService) private readonly chat: ChatService,
    @Inject(PushService) private readonly push: PushService,
  ) {}

  @Get("conversations")
  list(@Req() req: Request & { user: PublicUser }) {
    return this.chat.list(req.user.id);
  }

  @Post("conversations/direct")
  direct(@Req() req: Request & { user: PublicUser }, @Body() body: DirectDto) {
    return this.chat.openDirect(req.user.id, body.userId);
  }

  @Post("conversations/event")
  event(@Req() req: Request & { user: PublicUser }, @Body() body: EventDto) {
    return this.chat.openEvent(req.user.id, body.eventId);
  }

  @Get("conversations/:id")
  get(@Req() req: Request & { user: PublicUser }, @Param("id") id: string) {
    return this.chat.get(req.user.id, id);
  }

  @Get("conversations/:id/messages")
  messages(@Req() req: Request & { user: PublicUser }, @Param("id") id: string) {
    return this.chat.messages(req.user.id, id);
  }

  @Post("conversations/:id/messages")
  send(@Req() req: Request & { user: PublicUser }, @Param("id") id: string, @Body() body: SendDto) {
    return this.chat.send(req.user.id, id, body);
  }

  @Post("conversations/:id/read")
  read(@Req() req: Request & { user: PublicUser }, @Param("id") id: string) {
    return this.chat.read(req.user.id, id);
  }

  @Post("users/:id/block")
  block(@Req() req: Request & { user: PublicUser }, @Param("id") id: string) {
    return this.chat.block(req.user.id, id);
  }

  @Post("devices")
  device(@Req() req: Request & { user: PublicUser }, @Body() body: DeviceDto) {
    return this.push.registerDevice(req.user.id, body.platform, body.pushToken);
  }

  @Get("push/preferences")
  prefs(@Req() req: Request & { user: PublicUser }) {
    return this.push.prefs(req.user.id);
  }

  @Patch("push/preferences")
  updatePrefs(@Req() req: Request & { user: PublicUser }, @Body() body: PrefsDto) {
    return this.push.updatePrefs(req.user.id, body);
  }
}
