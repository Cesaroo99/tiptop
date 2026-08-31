import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Availability, LocationPrecision, UserStatus } from "@prisma/client";
import {
  DEFAULT_OTP_LENGTH,
  canResendOtp,
  evaluateOtp,
  generateNumericOtp,
  maskPhone,
  parsePhone,
} from "@tiptop/domain";
import { PrismaService } from "../prisma.service";
import { loadEnv } from "../env";
import { hashesEqual, hmac, randomToken, usernameFromName } from "../crypto";

const env = loadEnv();

export type PublicUser = {
  id: string;
  phoneE164: string;
  phoneMasked: string;
  username: string;
  firstName: string;
  lastName: string;
  certified: boolean;
  profileCompleted: boolean;
  locale: string;
  theme: string;
  profession: string | null;
  avatarUrl: string | null;
  city: string | null;
  zone: string | null;
  availability: Availability;
};

@Injectable()
export class AuthService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  toPublic(user: {
    id: string;
    phoneE164: string;
    username: string;
    firstName: string;
    lastName: string;
    certified: boolean;
    profileCompleted: boolean;
    locale: string;
    theme: string;
    profile: {
      profession: string | null;
      avatarUrl: string | null;
      city: string | null;
      zone: string | null;
      availability: Availability;
    } | null;
  }): PublicUser {
    return {
      id: user.id,
      phoneE164: user.phoneE164,
      phoneMasked: maskPhone(user.phoneE164),
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      certified: user.certified,
      profileCompleted: user.profileCompleted,
      locale: user.locale,
      theme: user.theme,
      profession: user.profile?.profession ?? null,
      avatarUrl: user.profile?.avatarUrl ?? null,
      city: user.profile?.city ?? null,
      zone: user.profile?.zone ?? null,
      availability: user.profile?.availability ?? Availability.HIDDEN,
    };
  }

  private parse(phone: string, country?: string) {
    const parsed = parsePhone(phone, country ?? "CM");
    if (!parsed.ok) {
      throw new BadRequestException({ code: "INVALID_PHONE", message: parsed.error });
    }
    return parsed;
  }

  async requestOtp(phone: string, country?: string) {
    const parsed = this.parse(phone, country);
    const latest = await this.prisma.otpChallenge.findFirst({
      where: { phoneE164: parsed.e164 },
      orderBy: { createdAt: "desc" },
    });
    if (latest && !canResendOtp({ lastSentAt: latest.createdAt, cooldownSeconds: 30 })) {
      throw new HttpException({ code: "OTP_COOLDOWN" }, HttpStatus.TOO_MANY_REQUESTS);
    }

    const code =
      env.NODE_ENV === "production" ? generateNumericOtp(DEFAULT_OTP_LENGTH) : env.OTP_MOCK_CODE;
    const expiresAt = new Date(Date.now() + env.OTP_EXPIRY_SECONDS * 1000);
    await this.prisma.otpChallenge.create({
      data: {
        phoneE164: parsed.e164,
        codeHash: hmac(env.SESSION_SECRET, code),
        expiresAt,
      },
    });

    if (env.NODE_ENV !== "production") {
      // Mock SMS — jamais en production
      console.info(`[otp-mock] ${parsed.e164} → ${code}`);
    }

    return {
      phoneMasked: maskPhone(parsed.e164),
      expiresIn: env.OTP_EXPIRY_SECONDS,
      mock: env.NODE_ENV !== "production",
    };
  }

  async verifyOtp(phone: string, code: string, rememberMe: boolean, country?: string, userAgent?: string) {
    const parsed = this.parse(phone, country);
    const challenge = await this.prisma.otpChallenge.findFirst({
      where: { phoneE164: parsed.e164 },
      orderBy: { createdAt: "desc" },
    });
    if (!challenge) {
      throw new UnauthorizedException({ code: "OTP_NOT_FOUND" });
    }

    const providedHash = hmac(env.SESSION_SECRET, code);
    const mockOk = env.NODE_ENV !== "production" && code === env.OTP_MOCK_CODE;
    const status = evaluateOtp({
      expectedHash: challenge.codeHash,
      providedHash: mockOk ? challenge.codeHash : providedHash,
      expiresAt: challenge.expiresAt,
      consumedAt: challenge.consumedAt,
      attempts: challenge.attempts,
      maxAttempts: env.OTP_MAX_ATTEMPTS,
    });

    await this.prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: { attempts: { increment: 1 } },
    });

    if (status !== "valid") {
      throw new UnauthorizedException({ code: `OTP_${status.toUpperCase()}` });
    }

    await this.prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: { consumedAt: new Date() },
    });

    let user = await this.prisma.user.findUnique({
      where: { phoneE164: parsed.e164 },
      include: { profile: true },
    });

    if (!user) {
      const username = usernameFromName("membre", parsed.national.slice(-4));
      user = await this.prisma.user.create({
        data: {
          phoneE164: parsed.e164,
          phoneCountry: parsed.country,
          username,
          firstName: "",
          lastName: "",
          profileCompleted: false,
          profile: {
            create: {
              country: parsed.country,
              availability: Availability.HIDDEN,
              locationPrecision: LocationPrecision.ZONE,
            },
          },
          likeUnits: {
            create: { source: "FREE" },
          },
        },
        include: { profile: true },
      });
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException({ code: "ACCOUNT_DISABLED" });
    }

    const raw = randomToken();
    const days = rememberMe ? 30 : 1;
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    await this.prisma.session.create({
      data: {
        userId: user.id,
        tokenHash: hmac(env.SESSION_SECRET, raw),
        rememberMe,
        userAgent: userAgent?.slice(0, 255),
        expiresAt,
      },
    });

    return {
      token: raw,
      expiresAt: expiresAt.toISOString(),
      rememberMe,
      user: this.toPublic(user),
    };
  }

  async resolveSession(rawToken: string) {
    const tokenHash = hmac(env.SESSION_SECRET, rawToken);
    const session = await this.prisma.session.findUnique({
      where: { tokenHash },
      include: { user: { include: { profile: true } } },
    });
    if (!session || session.revokedAt) return null;
    if (session.expiresAt.getTime() < Date.now()) return null;
    if (session.user.status !== UserStatus.ACTIVE) return null;
    return this.toPublic(session.user);
  }

  async logout(rawToken: string | undefined) {
    if (!rawToken) return;
    const tokenHash = hmac(env.SESSION_SECRET, rawToken);
    await this.prisma.session.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}

export function readToken(cookie: string | undefined, bearer: string | undefined) {
  if (bearer?.startsWith("Bearer ")) return bearer.slice(7);
  return cookie;
}

export function constantTimeToken(a: string, b: string) {
  return hashesEqual(hmac("x", a), hmac("x", b));
}
