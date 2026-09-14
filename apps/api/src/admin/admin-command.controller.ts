import { Body, Controller, Get, Inject, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { IsBoolean, IsIn, IsObject, IsOptional, IsString } from "class-validator";
import type { Request } from "express";
import { SessionGuard } from "../auth/session.guard";
import { AdminGuard } from "../auth/admin.guard";
import { AdminPermissionGuard, RequirePermission } from "../auth/admin-permission.guard";
import type { PublicUser } from "../auth/auth.service";
import { AdminCommandService } from "./admin-command.service";

class StaffPatchDto {
  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsIn(["ACTIVE", "BLOCKED", "DELETED"])
  status?: "ACTIVE" | "BLOCKED" | "DELETED";

  @IsOptional()
  @IsBoolean()
  certified?: boolean;

  @IsOptional()
  @IsString()
  organizerStatus?: string;

  @IsOptional()
  @IsBoolean()
  salesBlocked?: boolean;

  @IsOptional()
  @IsBoolean()
  revokeSessions?: boolean;
}

class EventActionDto {
  @IsIn(["approve", "refuse", "suspend", "restore", "feature", "unfeature", "cancel"])
  action!: "approve" | "refuse" | "suspend" | "restore" | "feature" | "unfeature" | "cancel";

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

class CampaignDto {
  @IsString()
  title!: string;

  @IsString()
  body!: string;

  @IsIn(["all", "organizers", "active", "inactive"])
  audience!: "all" | "organizers" | "active" | "inactive";

  @IsOptional()
  @IsBoolean()
  confirmBroadcast?: boolean;

  @IsOptional()
  @IsString()
  testUserId?: string;
}

class FlagsDto {
  @IsObject()
  flags!: Record<string, unknown>;
}

@Controller("admin")
@UseGuards(SessionGuard, AdminGuard, AdminPermissionGuard)
export class AdminCommandController {
  constructor(@Inject(AdminCommandService) private readonly command: AdminCommandService) {}

  @Get("command")
  commandOverview() {
    return this.command.commandOverview();
  }

  @Get("services")
  @RequirePermission("services.read")
  services() {
    return this.command.probeServices();
  }

  @Get("setup")
  @RequirePermission("services.read")
  setup() {
    return this.command.envChecklist();
  }

  @Get("search")
  search(@Req() req: Request & { user: PublicUser }, @Query("q") q?: string) {
    return this.command.search(q ?? "", req.user.role);
  }

  @Get("users/:id/dossier")
  @RequirePermission("users.read")
  userDetail(@Req() req: Request & { user: PublicUser }, @Param("id") id: string) {
    return this.command.userDetail(req.user.role, id);
  }

  @Patch("users/:id/staff")
  staffPatch(
    @Req() req: Request & { user: PublicUser },
    @Param("id") id: string,
    @Body() body: StaffPatchDto,
  ) {
    return this.command.patchStaffUser({ id: req.user.id, role: req.user.role }, id, body);
  }

  @Get("organizers")
  @RequirePermission("users.read")
  organizers() {
    return this.command.organizers();
  }

  @Get("catalog/events")
  @RequirePermission("events.read")
  catalogEvents(
    @Query("status") status?: string,
    @Query("city") city?: string,
    @Query("host") host?: string,
    @Query("paid") paid?: string,
    @Query("q") q?: string,
  ) {
    return this.command.events({ status, city, host, paid, q });
  }

  @Get("catalog/events/:id")
  @RequirePermission("events.read")
  eventDetail(@Param("id") id: string) {
    return this.command.eventDetail(id);
  }

  @Post("catalog/events/:id")
  mutateEvent(
    @Req() req: Request & { user: PublicUser },
    @Param("id") id: string,
    @Body() body: EventActionDto,
  ) {
    return this.command.mutateEvent({ id: req.user.id, role: req.user.role }, id, body.action, {
      title: body.title,
      description: body.description,
    });
  }

  @Post("catalog/events/:id/refund-all")
  @RequirePermission("finance.refund")
  refundAll(@Req() req: Request & { user: PublicUser }, @Param("id") id: string) {
    return this.command.refundEventTickets({ id: req.user.id, role: req.user.role }, id);
  }

  @Get("tickets")
  @RequirePermission("tickets.read")
  tickets(@Query("q") q?: string, @Query("status") status?: string) {
    return this.command.tickets(q ?? "", status);
  }

  @Get("finance")
  @RequirePermission("finance.read")
  finance() {
    return this.command.finance();
  }

  @Get("refunds")
  @RequirePermission("finance.read")
  refunds() {
    return this.command.refundCenter();
  }

  @Get("feature-flags")
  featureFlags() {
    return this.command.featureFlags();
  }

  @Patch("feature-flags")
  @RequirePermission("flags.write")
  patchFlags(@Req() req: Request & { user: PublicUser }, @Body() body: FlagsDto) {
    return this.command.updateFeatureFlags({ id: req.user.id, role: req.user.role }, body.flags);
  }

  @Get("command-settings")
  settings() {
    return this.command.settings();
  }

  @Patch("command-settings")
  @RequirePermission("settings.write")
  patchSettings(@Req() req: Request & { user: PublicUser }, @Body() body: Record<string, unknown>) {
    return this.command.updateSettings({ id: req.user.id, role: req.user.role }, body);
  }

  @Get("phone-auth")
  @RequirePermission("services.read")
  phoneAuth() {
    return this.command.phoneAuth();
  }

  @Patch("phone-auth")
  @RequirePermission("settings.write")
  patchPhone(@Req() req: Request & { user: PublicUser }, @Body() body: Record<string, unknown>) {
    return this.command.updatePhoneAuth({ id: req.user.id, role: req.user.role }, body);
  }

  @Get("maps")
  @RequirePermission("services.read")
  maps() {
    return this.command.mapsSettings();
  }

  @Get("ai")
  @RequirePermission("ai.read")
  ai() {
    return this.command.aiControl();
  }

  @Patch("ai")
  @RequirePermission("ai.write")
  patchAi(@Req() req: Request & { user: PublicUser }, @Body() body: Record<string, unknown>) {
    return this.command.updateAiLimits({ id: req.user.id, role: req.user.role }, body);
  }

  @Get("analytics")
  @RequirePermission("analytics.read")
  analytics() {
    return this.command.analytics();
  }

  @Get("audit")
  @RequirePermission("audit.read")
  audit(@Query("q") q?: string) {
    return this.command.auditLogs(q ?? "");
  }

  @Get("support")
  @RequirePermission("support.read")
  support(@Query("q") q?: string) {
    return this.command.supportLookup(q ?? "");
  }

  @Get("moderation")
  @RequirePermission("moderation.read")
  moderation() {
    return this.command.moderationQueue();
  }

  @Get("messaging")
  @RequirePermission("messages.reports")
  messaging() {
    return this.command.messagingSafety();
  }

  @Get("campaigns")
  @RequirePermission("notifications.write")
  campaigns() {
    return this.command.campaigns();
  }

  @Post("campaigns")
  @RequirePermission("notifications.write")
  sendCampaign(@Req() req: Request & { user: PublicUser }, @Body() body: CampaignDto) {
    return this.command.sendCampaign({ id: req.user.id, role: req.user.role }, body);
  }

  @Get("world-missions")
  worldMissions() {
    return this.command.worldMissions();
  }

  @Post("world-missions")
  @RequirePermission("world.write")
  upsertMission(@Req() req: Request & { user: PublicUser }, @Body() body: Record<string, unknown>) {
    return this.command.upsertWorldMission({ id: req.user.id, role: req.user.role }, body);
  }

  @Get("webhooks")
  @RequirePermission("services.read")
  webhooks() {
    return this.command.webhooks();
  }

  @Get("refund-rules")
  @RequirePermission("finance.read")
  refundRules() {
    return this.command.refundRules();
  }

  @Patch("refund-rules")
  @RequirePermission("finance.settings")
  patchRefundRules(@Req() req: Request & { user: PublicUser }, @Body() body: Record<string, unknown>) {
    return this.command.updateRefundRules({ id: req.user.id, role: req.user.role }, body);
  }
}
