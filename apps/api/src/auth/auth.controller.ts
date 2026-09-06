import { Body, Controller, Get, Inject, Post, Req, Res, UseGuards } from "@nestjs/common";
import type { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { RequestOtpDto, ResendOtpDto, VerifyOtpDto } from "./dto";
import { SESSION_COOKIE, SessionGuard } from "./session.guard";

const isProd = process.env.NODE_ENV === "production";

@Controller("auth")
export class AuthController {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}

  @Post("otp/request")
  request(@Body() body: RequestOtpDto) {
    return this.auth.requestOtp(body.phone, body.country);
  }

  @Post("otp/resend")
  resend(@Body() body: ResendOtpDto) {
    return this.auth.requestOtp(body.phone, body.country);
  }

  @Post("otp/verify")
  async verify(@Body() body: VerifyOtpDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.verifyOtp(
      body.phone,
      body.code,
      Boolean(body.rememberMe),
      body.country,
      req.headers["user-agent"],
    );
    res.cookie(SESSION_COOKIE, result.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: isProd,
      path: "/",
      expires: new Date(result.expiresAt),
    });
    return result;
  }

  @Post("logout")
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : req.cookies?.[SESSION_COOKIE];
    await this.auth.logout(token);
    res.clearCookie(SESSION_COOKIE, { path: "/" });
    return { ok: true };
  }

  @Get("me")
  @UseGuards(SessionGuard)
  me(@Req() req: Request & { user: unknown }) {
    return req.user;
  }
}
