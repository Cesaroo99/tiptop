import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { IsArray, IsBoolean, IsIn, IsOptional, IsString, MaxLength } from "class-validator";
import type { Request } from "express";
import { SessionGuard } from "../auth/session.guard";
import type { PublicUser } from "../auth/auth.service";
import { IntelligenceService } from "./intelligence.service";

class ConsentDto {
  @IsOptional()
  @IsBoolean()
  personalizedRecs?: boolean;

  @IsOptional()
  @IsBoolean()
  useHistory?: boolean;

  @IsOptional()
  @IsBoolean()
  socialMatch?: boolean;

  @IsOptional()
  @IsBoolean()
  agentEnabled?: boolean;
}

class FeedbackDto {
  @IsOptional()
  @IsString()
  recommendationId?: string;

  @IsOptional()
  @IsString()
  eventId?: string;

  @IsIn(["LIKE", "NOT_INTERESTED", "HIDE_TYPE", "WHY"])
  kind!: "LIKE" | "NOT_INTERESTED" | "HIDE_TYPE" | "WHY";
}

class PlanDto {
  @IsString()
  @MaxLength(500)
  text!: string;

  @IsOptional()
  @IsBoolean()
  surprise?: boolean;
}

class TweakDto {
  @IsIn(["cheaper", "closer", "calmer", "social", "spontaneous", "replace"])
  tweak!: "cheaper" | "closer" | "calmer" | "social" | "spontaneous" | "replace";

  @IsOptional()
  step?: number;
}

class MeetupDto {
  @IsString()
  @MaxLength(120)
  title!: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsString()
  startsAt!: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  zone?: string;

  @IsArray()
  @IsString({ each: true })
  peerIds!: string[];
}

class AskDto {
  @IsString()
  @MaxLength(500)
  text!: string;
}

class ExperienceFeedbackDto {
  @IsOptional()
  @IsString()
  eventId?: string;

  @IsOptional()
  @IsString()
  planId?: string;

  @IsIn(["LOVED", "GOOD", "OK", "DISLIKED"])
  mood!: "LOVED" | "GOOD" | "OK" | "DISLIKED";

  @IsOptional()
  @IsString()
  @MaxLength(400)
  comment?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

class SignalDto {
  @IsIn([
    "VIEW_LONG",
    "SAVED",
    "SHARED",
    "FAVORITED",
    "CLICK_BOOK",
    "BOOKED",
    "ATTENDED",
    "INVITED",
    "IGNORED",
    "LEFT_QUICK",
    "REC_IGNORED",
  ])
  kind!: "VIEW_LONG" | "CLICK_BOOK" | "SHARED" | "IGNORED" | "LEFT_QUICK" | "REC_IGNORED";

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  eventId?: string;
}

@Controller("intelligence")
@UseGuards(SessionGuard)
export class IntelligenceController {
  constructor(@Inject(IntelligenceService) private readonly intel: IntelligenceService) {}

  @Get("consent")
  consent(@Req() req: Request & { user: PublicUser }) {
    return this.intel.consent(req.user.id);
  }

  @Patch("consent")
  updateConsent(@Req() req: Request & { user: PublicUser }, @Body() body: ConsentDto) {
    return this.intel.updateConsent(req.user.id, body);
  }

  @Delete("learning")
  forget(@Req() req: Request & { user: PublicUser }) {
    return this.intel.forgetLearning(req.user.id);
  }

  @Get("today")
  today(@Req() req: Request & { user: PublicUser }) {
    return this.intel.today(req.user.id, req.user.locale);
  }

  @Post("feedback")
  feedback(@Req() req: Request & { user: PublicUser }, @Body() body: FeedbackDto) {
    return this.intel.feedback(req.user.id, body);
  }

  @Post("signals")
  signal(@Req() req: Request & { user: PublicUser }, @Body() body: SignalDto) {
    return this.intel.recordSignal(req.user.id, body);
  }

  @Post("plans")
  plan(@Req() req: Request & { user: PublicUser }, @Body() body: PlanDto) {
    return this.intel.plan(req.user.id, body.text, Boolean(body.surprise), req.user.locale);
  }

  @Post("plans/:id/tweak")
  tweak(@Req() req: Request & { user: PublicUser }, @Param("id") id: string, @Body() body: TweakDto) {
    return this.intel.tweakPlan(req.user.id, id, body.tweak, body.step);
  }

  @Post("plans/:id/reveal/:order")
  reveal(@Req() req: Request & { user: PublicUser }, @Param("id") id: string, @Param("order") order: string) {
    return this.intel.revealStep(req.user.id, id, Number(order));
  }

  @Get("matches")
  matches(
    @Req() req: Request & { user: PublicUser },
    @Query("category") category?: string,
    @Query("eventId") eventId?: string,
  ) {
    return this.intel.matches(req.user.id, { category, eventId });
  }

  @Post("meetups")
  meetup(@Req() req: Request & { user: PublicUser }, @Body() body: MeetupDto) {
    return this.intel.proposeMeetup(req.user.id, body);
  }

  @Get("agent")
  agent(@Req() req: Request & { user: PublicUser }) {
    return this.intel.agentInbox(req.user.id, req.user.locale);
  }

  @Post("agent/ask")
  ask(@Req() req: Request & { user: PublicUser }, @Body() body: AskDto) {
    return this.intel.agentAsk(req.user.id, body.text, req.user.locale);
  }

  @Get("world")
  world(@Req() req: Request & { user: PublicUser }) {
    return this.intel.world(req.user.id);
  }

  @Post("experience-feedback")
  experienceFeedback(@Req() req: Request & { user: PublicUser }, @Body() body: ExperienceFeedbackDto) {
    return this.intel.experienceFeedback(req.user.id, body);
  }
}
