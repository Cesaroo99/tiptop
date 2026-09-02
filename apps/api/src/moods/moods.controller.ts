import { Body, Controller, Get, Inject, Param, Post, Req, UseGuards } from "@nestjs/common";
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";
import { Type } from "class-transformer";
import type { Request } from "express";
import { SessionGuard } from "../auth/session.guard";
import type { PublicUser } from "../auth/auth.service";
import { MoodsService } from "./moods.service";

class CreateMoodDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  body?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  activity?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  zone?: string;

  @IsOptional()
  @IsString()
  eventId?: string;

  @IsOptional()
  @IsString()
  visibility?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(24)
  hours?: number;
}

class CreateCommentDto {
  @IsString()
  @MaxLength(1000)
  body!: string;
}

@Controller("moods")
@UseGuards(SessionGuard)
export class MoodsController {
  constructor(@Inject(MoodsService) private readonly moods: MoodsService) {}

  @Post()
  create(@Req() req: Request & { user: PublicUser }, @Body() body: CreateMoodDto) {
    return this.moods.create(req.user.id, body);
  }

  @Get()
  list(@Req() req: Request & { user: PublicUser }) {
    return this.moods.list(req.user.id);
  }

  @Get(":id/comments")
  comments(@Param("id") id: string) {
    return this.moods.comments(id);
  }

  @Post(":id/comments")
  addComment(
    @Req() req: Request & { user: PublicUser },
    @Param("id") id: string,
    @Body() body: CreateCommentDto,
  ) {
    return this.moods.addComment(req.user.id, id, body.body);
  }

  @Get(":id")
  get(@Req() req: Request & { user: PublicUser }, @Param("id") id: string) {
    return this.moods.get(req.user.id, id);
  }
}
