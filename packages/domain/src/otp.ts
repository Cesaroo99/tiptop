export const DEFAULT_OTP_LENGTH = 4;
export const DEFAULT_OTP_EXPIRY_SECONDS = 90;
export const DEFAULT_OTP_MAX_ATTEMPTS = 5;

export type OtpStatus = "valid" | "invalid" | "expired" | "consumed" | "locked";

export function generateNumericOtp(length = DEFAULT_OTP_LENGTH): string {
  const max = 10 ** length;
  return String(Math.floor(Math.random() * max)).padStart(length, "0");
}

export function evaluateOtp(params: {
  expectedHash: string;
  providedHash: string;
  expiresAt: Date;
  consumedAt: Date | null;
  attempts: number;
  maxAttempts?: number;
  now?: Date;
}): OtpStatus {
  const now = params.now ?? new Date();
  if (params.consumedAt) return "consumed";
  if (now.getTime() > params.expiresAt.getTime()) return "expired";
  if (params.attempts >= (params.maxAttempts ?? DEFAULT_OTP_MAX_ATTEMPTS)) return "locked";
  if (params.providedHash !== params.expectedHash) return "invalid";
  return "valid";
}

export function canResendOtp(params: {
  lastSentAt: Date;
  cooldownSeconds: number;
  now?: Date;
}): boolean {
  const now = params.now ?? new Date();
  return now.getTime() - params.lastSentAt.getTime() >= params.cooldownSeconds * 1000;
}
