import { Body, Controller, Get, Headers, Inject, Param, Post, Req, UseGuards } from "@nestjs/common";
import { IsArray, IsBoolean, IsIn, IsOptional, IsString } from "class-validator";
import type { Request } from "express";
import { SessionGuard } from "../auth/session.guard";
import type { PublicUser } from "../auth/auth.service";
import { BookingService } from "./booking.service";

class CreateReservationDto {
  @IsString()
  eventId!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  holderIds?: string[];

  @IsOptional()
  @IsString()
  invitationId?: string;

  @IsOptional()
  @IsBoolean()
  includeSelf?: boolean;
}

class PayDto {
  @IsString()
  reservationId!: string;

  @IsIn(["CARD", "ORANGE_MONEY", "MTN_MOMO"])
  provider!: "CARD" | "ORANGE_MONEY" | "MTN_MOMO";

  @IsOptional()
  @IsBoolean()
  fail?: boolean;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}

class ScanDto {
  @IsString()
  token!: string;
}

class MethodDto {
  @IsIn(["CARD", "ORANGE_MONEY", "MTN_MOMO"])
  provider!: "CARD" | "ORANGE_MONEY" | "MTN_MOMO";

  @IsString()
  label!: string;
}

class WebhookDto {
  @IsString()
  idempotencyKey!: string;

  @IsIn(["SUCCEEDED", "FAILED"])
  status!: "SUCCEEDED" | "FAILED";
}

@Controller()
export class PaymentsWebhookController {
  constructor(@Inject(BookingService) private readonly booking: BookingService) {}

  @Post("payments/webhook")
  webhook(@Body() body: WebhookDto) {
    return this.booking.webhook(body.idempotencyKey, body.status);
  }
}

@Controller()
@UseGuards(SessionGuard)
export class BookingController {
  constructor(@Inject(BookingService) private readonly booking: BookingService) {}

  @Post("reservations")
  create(@Req() req: Request & { user: PublicUser }, @Body() body: CreateReservationDto) {
    return this.booking.create(req.user.id, body);
  }

  @Get("reservations")
  listReservations(@Req() req: Request & { user: PublicUser }) {
    return this.booking.listReservations(req.user.id);
  }

  @Get("tickets")
  listTickets(@Req() req: Request & { user: PublicUser }) {
    return this.booking.listTickets(req.user.id);
  }

  @Post("tickets/scan")
  scan(@Req() req: Request & { user: PublicUser }, @Body() body: ScanDto) {
    return this.booking.scan(req.user.id, body.token);
  }

  @Get("tickets/:id")
  getTicket(@Req() req: Request & { user: PublicUser }, @Param("id") id: string) {
    return this.booking.getTicket(req.user.id, id);
  }

  @Post("tickets/:id/consume")
  consume(@Req() req: Request & { user: PublicUser }, @Param("id") id: string) {
    return this.booking.consume(req.user.id, id);
  }

  @Post("payments")
  pay(
    @Req() req: Request & { user: PublicUser },
    @Body() body: PayDto,
    @Headers("idempotency-key") headerKey?: string,
  ) {
    return this.booking.pay(req.user.id, {
      ...body,
      idempotencyKey: body.idempotencyKey || headerKey || `pay_${body.reservationId}_${Date.now()}`,
    });
  }

  @Get("payments/methods")
  methods(@Req() req: Request & { user: PublicUser }) {
    return this.booking.methods(req.user.id);
  }

  @Post("payments/methods")
  addMethod(@Req() req: Request & { user: PublicUser }, @Body() body: MethodDto) {
    return this.booking.addMethod(req.user.id, body.provider, body.label);
  }

  @Get("events/:id/manage")
  manage(@Req() req: Request & { user: PublicUser }, @Param("id") id: string) {
    return this.booking.hostTickets(req.user.id, id);
  }
}
