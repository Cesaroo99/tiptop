import { Body, Controller, Get, Inject, Param, Post, Req, UseGuards } from "@nestjs/common";
import { IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";
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
  videoUrl?: string;

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
  @MaxLength(120)
  placeName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  address?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsOptional()
  @IsString()
  eventId?: string;

  @IsOptional()
  @IsString()
  companionId?: string;

  @IsOptional()
  @IsString()
  visibility?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(24)
  hours?: number;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  soundKey?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  soundLabel?: string;
}

class CreateCommentDto {
  @IsString()
  @MaxLength(1000)
  body!: string;

  @IsOptional()
  @IsString()
  parentId?: string;
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
  comments(@Req() req: Request & { user: PublicUser }, @Param("id") id: string) {
    return this.moods.comments(req.user.id, id);
  }

  @Post(":id/comments")
  addComment(
    @Req() req: Request & { user: PublicUser },
    @Param("id") id: string,
    @Body() body: CreateCommentDto,
  ) {
    return this.moods.addComment(req.user.id, id, body.body, body.parentId);
  }

  @Get(":id")
  get(@Req() req: Request & { user: PublicUser }, @Param("id") id: string) {
    return this.moods.get(req.user.id, id);
  }
}
