import { Body, Controller, Get, Inject, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Min } from "class-validator";
import { Type } from "class-transformer";
import type { Request } from "express";
import { SessionGuard } from "../auth/session.guard";
import { AdminGuard } from "../auth/admin.guard";
import type { PublicUser } from "../auth/auth.service";
import { AdminService } from "./admin.service";

class PatchUserDto {
  @IsOptional()
  @IsBoolean()
  certified?: boolean;

  @IsOptional()
  @IsIn(["ACTIVE", "BLOCKED"])
  status?: "ACTIVE" | "BLOCKED";
}

class HideDto {
  @IsBoolean()
  hide!: boolean;
}

class ReviewDto {
  @IsIn(["DISMISSED", "ACTIONED"])
  status!: "DISMISSED" | "ACTIONED";
}

class RefundDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  amountXaf?: number;
}

class CreateReportDto {
  @IsIn(["USER", "POST", "EVENT", "MESSAGE", "MOOD"])
  kind!: "USER" | "POST" | "EVENT" | "MESSAGE" | "MOOD";

  @IsString()
  reason!: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsString()
  targetUserId?: string;

  @IsOptional()
  @IsString()
  postId?: string;

  @IsOptional()
  @IsString()
  eventId?: string;

  @IsOptional()
  @IsString()
  messageId?: string;

  @IsOptional()
  @IsString()
  moodId?: string;
}

@Controller()
@UseGuards(SessionGuard)
export class ReportsController {
  constructor(@Inject(AdminService) private readonly admin: AdminService) {}

  @Post("reports")
  create(@Req() req: Request & { user: PublicUser }, @Body() body: CreateReportDto) {
    return this.admin.createReport(req.user.id, body);
  }
}

@Controller("admin")
@UseGuards(SessionGuard, AdminGuard)
export class AdminController {
  constructor(@Inject(AdminService) private readonly admin: AdminService) {}

  @Get("overview")
  overview() {
    return this.admin.overview();
  }

  @Get("users")
  users(@Query("q") q?: string) {
    return this.admin.users(q ?? "");
  }

  @Patch("users/:id")
  patchUser(
    @Req() req: Request & { user: PublicUser },
    @Param("id") id: string,
    @Body() body: PatchUserDto,
  ) {
    return this.admin.patchUser({ id: req.user.id, role: req.user.role }, id, body);
  }

  @Get("posts")
  posts() {
    return this.admin.posts();
  }

  @Post("posts/:id/hide")
  hide(@Req() req: Request & { user: PublicUser }, @Param("id") id: string, @Body() body: HideDto) {
    return this.admin.hidePost(req.user.id, id, body.hide);
  }

  @Get("events")
  events() {
    return this.admin.events();
  }

  @Post("events/:id/cancel")
  cancel(@Req() req: Request & { user: PublicUser }, @Param("id") id: string) {
    return this.admin.cancelEvent(req.user.id, id);
  }

  @Get("payments")
  payments() {
    return this.admin.payments();
  }

  @Post("payments/:id/refund")
  refund(@Req() req: Request & { user: PublicUser }, @Param("id") id: string, @Body() body: RefundDto) {
    return this.admin.refund({ id: req.user.id, role: req.user.role }, id, body?.amountXaf);
  }

  @Get("likes/anomalies")
  anomalies() {
    return this.admin.likeAnomalies();
  }

  @Get("reports")
  reports() {
    return this.admin.reports();
  }

  @Post("reports/:id/review")
  review(@Req() req: Request & { user: PublicUser }, @Param("id") id: string, @Body() body: ReviewDto) {
    return this.admin.reviewReport(req.user.id, id, body.status);
  }
}
