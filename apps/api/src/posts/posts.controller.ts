import { Body, Controller, Delete, Get, Inject, Param, Post, Req, UseGuards } from "@nestjs/common";
import { IsOptional, IsString, MaxLength } from "class-validator";
import type { Request } from "express";
import { SessionGuard } from "../auth/session.guard";
import type { PublicUser } from "../auth/auth.service";
import { PostsService } from "./posts.service";

class CreatePostDto {
  @IsString()
  @MaxLength(2000)
  body!: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  zone?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}

class CreateCommentDto {
  @IsString()
  @MaxLength(1000)
  body!: string;
}

@Controller("posts")
@UseGuards(SessionGuard)
export class PostsController {
  constructor(@Inject(PostsService) private readonly posts: PostsService) {}

  @Post()
  create(@Req() req: Request & { user: PublicUser }, @Body() body: CreatePostDto) {
    return this.posts.create(req.user.id, body);
  }

  @Get(":id/comments")
  comments(@Req() req: Request & { user: PublicUser }, @Param("id") id: string) {
    return this.posts.comments(id, req.user.id);
  }

  @Post(":id/comments")
  addComment(
    @Req() req: Request & { user: PublicUser },
    @Param("id") id: string,
    @Body() body: CreateCommentDto,
  ) {
    return this.posts.addComment(req.user.id, id, body.body);
  }

  @Get(":id")
  get(@Req() req: Request & { user: PublicUser }, @Param("id") id: string) {
    return this.posts.get(req.user.id, id);
  }

  @Delete(":id")
  remove(@Req() req: Request & { user: PublicUser }, @Param("id") id: string) {
    return this.posts.delete(req.user.id, id);
  }
}
