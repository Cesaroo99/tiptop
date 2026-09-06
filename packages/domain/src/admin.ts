/** Back-office — rôles, remboursements mock, anomalies likes (D30). */

export type StaffRole = "USER" | "MODERATOR" | "ADMIN";

export const REPORT_REASONS = ["SPAM", "ABUSE", "FAKE", "OTHER"] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export function canAccessAdmin(role: string): boolean {
  return role === "ADMIN" || role === "MODERATOR";
}

export function canCertifyUsers(role: string): boolean {
  return role === "ADMIN";
}

export function canRefundPayments(role: string): boolean {
  return role === "ADMIN";
}

export function canChangeRoles(role: string): boolean {
  return role === "ADMIN";
}

export function assertNotSelf(actorId: string, targetId: string): void {
  if (actorId === targetId) throw new Error("ADMIN_SELF");
}

export function refundAllowed(status: string): void {
  if (status !== "SUCCEEDED") throw new Error("PAYMENT_NOT_REFUNDABLE");
}

export function isValidReportReason(reason: string): reason is ReportReason {
  return (REPORT_REASONS as readonly string[]).includes(reason);
}

/** Anti-abus signalements (#56) : un signalement légitime reste rare ; au-delà,
 * c'est soit un abus du système de signalement, soit du harcèlement ciblé. */
export const REPORT_DAILY_LIMIT = 20;

export function canSubmitReport(sentTodayCount: number): "OK" | "RATE_LIMITED" {
  return sentTodayCount >= REPORT_DAILY_LIMIT ? "RATE_LIMITED" : "OK";
}

export type LikeAnomalyFlag = "BURST" | "HIGH_BALANCE" | "UNUSED_PACK";

export function likeAnomalyFlags(input: {
  allocationsLastHour: number;
  totalUnits: number;
  purchasedUnits: number;
  allocatedActive: number;
}): LikeAnomalyFlag[] {
  const flags: LikeAnomalyFlag[] = [];
  if (input.allocationsLastHour >= 8) flags.push("BURST");
  if (input.totalUnits >= 40) flags.push("HIGH_BALANCE");
  if (input.purchasedUnits >= 5 && input.allocatedActive === 0) flags.push("UNUSED_PACK");
  return flags;
}
