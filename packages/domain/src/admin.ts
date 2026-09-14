/** Back-office TipTop — RBAC, audit, drapeaux, sondes de services (D30+). */

export type LegacyStaffRole = "USER" | "MODERATOR" | "ADMIN";

export const STAFF_ROLES = [
  "ADMIN",
  "MODERATOR",
  "FINANCE_ADMIN",
  "SUPPORT_ADMIN",
  "CONTENT_ADMIN",
  "ANALYTICS_ADMIN",
  "TECH_ADMIN",
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

export const ADMIN_PERMISSIONS = [
  "admin.access",
  "users.read",
  "users.write",
  "users.ban",
  "users.roles",
  "users.sensitive",
  "organizers.write",
  "events.read",
  "events.write",
  "events.moderate",
  "tickets.read",
  "finance.read",
  "finance.refund",
  "finance.settings",
  "moderation.read",
  "moderation.write",
  "ai.read",
  "ai.write",
  "notifications.write",
  "analytics.read",
  "settings.write",
  "services.read",
  "services.write",
  "audit.read",
  "support.read",
  "flags.write",
  "world.write",
  "messages.reports",
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

const ALL_PERMISSIONS: readonly AdminPermission[] = ADMIN_PERMISSIONS;

export const ROLE_PERMISSIONS: Record<StaffRole, readonly AdminPermission[]> = {
  ADMIN: ALL_PERMISSIONS,
  MODERATOR: [
    "admin.access",
    "users.read",
    "events.read",
    "events.moderate",
    "tickets.read",
    "moderation.read",
    "moderation.write",
    "ai.read",
    "analytics.read",
    "audit.read",
    "support.read",
    "services.read",
    "messages.reports",
  ],
  FINANCE_ADMIN: [
    "admin.access",
    "users.read",
    "users.sensitive",
    "events.read",
    "tickets.read",
    "finance.read",
    "finance.refund",
    "finance.settings",
    "analytics.read",
    "audit.read",
    "support.read",
    "services.read",
  ],
  SUPPORT_ADMIN: [
    "admin.access",
    "users.read",
    "users.sensitive",
    "users.write",
    "events.read",
    "tickets.read",
    "finance.read",
    "moderation.read",
    "support.read",
    "audit.read",
    "services.read",
  ],
  CONTENT_ADMIN: [
    "admin.access",
    "users.read",
    "events.read",
    "events.write",
    "events.moderate",
    "moderation.read",
    "moderation.write",
    "world.write",
    "ai.read",
    "notifications.write",
    "services.read",
  ],
  ANALYTICS_ADMIN: [
    "admin.access",
    "users.read",
    "events.read",
    "tickets.read",
    "finance.read",
    "analytics.read",
    "ai.read",
    "services.read",
  ],
  TECH_ADMIN: [
    "admin.access",
    "analytics.read",
    "ai.read",
    "ai.write",
    "services.read",
    "services.write",
    "flags.write",
    "settings.write",
    "audit.read",
  ],
};

export function isStaffRole(role: string): role is StaffRole {
  return (STAFF_ROLES as readonly string[]).includes(role);
}

export function canAccessAdmin(role: string): boolean {
  return isStaffRole(role);
}

export function hasPermission(role: string, permission: AdminPermission): boolean {
  if (role === "ADMIN") return true;
  if (!isStaffRole(role)) return false;
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function canCertifyUsers(role: string): boolean {
  return role === "ADMIN";
}

export function canRefundPayments(role: string): boolean {
  return role === "ADMIN" || role === "FINANCE_ADMIN";
}

export function canChangeRoles(role: string): boolean {
  return role === "ADMIN";
}

export function canChangePlatformFee(role: string): boolean {
  return role === "ADMIN";
}

export function assertNotSelf(actorId: string, targetId: string): void {
  if (actorId === targetId) throw new Error("ADMIN_SELF");
}

export function refundAllowed(status: string): void {
  if (status !== "SUCCEEDED") throw new Error("PAYMENT_NOT_REFUNDABLE");
}

export const REPORT_REASONS = ["SPAM", "ABUSE", "FAKE", "OTHER"] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

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

export const PROTECTED_DEMO_USERNAME = "cesar_memoli";
export const PROTECTED_DEMO_PHONE = "+237695214785";

export function isProtectedDemoAccount(user: { username?: string | null; phoneE164?: string | null }): boolean {
  return user.username === PROTECTED_DEMO_USERNAME || user.phoneE164 === PROTECTED_DEMO_PHONE;
}

export function maskSecret(value: string | undefined | null, visible = 4): string {
  if (!value) return "";
  if (value.length <= visible) return "•".repeat(Math.max(4, value.length));
  return `${"•".repeat(8)}${value.slice(-visible)}`;
}

export function maskPhoneE164(phone: string | null | undefined): string {
  if (!phone) return "";
  if (phone.length < 6) return "••••";
  return `${phone.slice(0, 4)}••••${phone.slice(-2)}`;
}

export type ServiceHealthStatus = "ok" | "needs_config" | "error" | "disabled";

export type ServiceProbe = {
  id: string;
  label: string;
  group: "firebase" | "stripe" | "maps" | "ai" | "analytics" | "core";
  status: ServiceHealthStatus;
  configured: boolean;
  tested: boolean;
  message: string;
  hint?: string;
  masked?: string;
};

export function serviceStatus(input: {
  inStack: boolean;
  configured: boolean;
  testedOk?: boolean;
  error?: string;
}): ServiceHealthStatus {
  if (!input.inStack) return "disabled";
  if (!input.configured) return "needs_config";
  if (input.error) return "error";
  if (input.testedOk) return "ok";
  return "needs_config";
}

export type FeatureFlagRule = {
  enabled: boolean;
  percent: number;
  countries: string[];
  testersOnly: boolean;
};

export const FEATURE_FLAG_KEYS = [
  "aiRecommendations",
  "aiAgent",
  "experiencePlanner",
  "matching",
  "monMonde",
  "moods",
  "collectiveVideo",
  "payments",
  "reservations",
  "newSocialUi",
] as const;

export type FeatureFlagKey = (typeof FEATURE_FLAG_KEYS)[number];

export function defaultFlagRule(enabled = true): FeatureFlagRule {
  return { enabled, percent: 100, countries: [], testersOnly: false };
}

export function defaultFeatureFlags(): Record<FeatureFlagKey, FeatureFlagRule> {
  return {
    aiRecommendations: defaultFlagRule(true),
    aiAgent: defaultFlagRule(true),
    experiencePlanner: defaultFlagRule(true),
    matching: defaultFlagRule(true),
    monMonde: defaultFlagRule(true),
    moods: defaultFlagRule(true),
    collectiveVideo: defaultFlagRule(true),
    payments: defaultFlagRule(true),
    reservations: defaultFlagRule(true),
    newSocialUi: defaultFlagRule(true),
  };
}

export function parseFeatureFlags(raw: unknown): Record<FeatureFlagKey, FeatureFlagRule> {
  const base = defaultFeatureFlags();
  if (!raw || typeof raw !== "object") return base;
  const rec = raw as Record<string, unknown>;
  for (const key of FEATURE_FLAG_KEYS) {
    const row = rec[key];
    if (!row || typeof row !== "object") continue;
    const r = row as Partial<FeatureFlagRule>;
    base[key] = {
      enabled: r.enabled !== false,
      percent: typeof r.percent === "number" && r.percent >= 0 && r.percent <= 100 ? r.percent : 100,
      countries: Array.isArray(r.countries) ? r.countries.filter((c): c is string => typeof c === "string") : [],
      testersOnly: r.testersOnly === true,
    };
  }
  return base;
}

export function isFeatureEnabled(
  flags: Record<FeatureFlagKey, FeatureFlagRule>,
  key: FeatureFlagKey,
  ctx?: { country?: string | null; tester?: boolean; bucket?: number },
): boolean {
  const rule = flags[key];
  if (!rule?.enabled) return false;
  if (rule.testersOnly && !ctx?.tester) return false;
  if (rule.countries.length && ctx?.country && !rule.countries.includes(ctx.country)) return false;
  const bucket = ctx?.bucket ?? 0;
  return bucket < rule.percent;
}

export const FEATURE_FLAGS_CONFIG_KEY = "featureFlags";
export const ADMIN_SETTINGS_CONFIG_KEY = "adminSettings";
export const PHONE_AUTH_CONFIG_KEY = "phoneAuth";
export const MAPS_SETTINGS_CONFIG_KEY = "mapsSettings";
export const AI_LIMITS_CONFIG_KEY = "aiLimits";
export const REFUND_RULES_CONFIG_KEY = "refundRules";

export type AdminSettings = {
  appName: string;
  maintenance: boolean;
  maintenanceMessage: string;
  languages: string[];
  countries: string[];
  currencies: string[];
  sessionHours: number;
  payoutDelayDays: number;
  buyerFeeXaf: number;
};

export function defaultAdminSettings(): AdminSettings {
  return {
    appName: "TipTop",
    maintenance: false,
    maintenanceMessage: "",
    languages: ["fr", "en"],
    countries: ["CM", "CA"],
    currencies: ["XAF", "CAD"],
    sessionHours: 24,
    payoutDelayDays: 7,
    buyerFeeXaf: 0,
  };
}

export function parseAdminSettings(raw: unknown): AdminSettings {
  const base = defaultAdminSettings();
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Partial<AdminSettings>;
  return {
    appName: typeof r.appName === "string" && r.appName.trim() ? r.appName.trim() : base.appName,
    maintenance: r.maintenance === true,
    maintenanceMessage: typeof r.maintenanceMessage === "string" ? r.maintenanceMessage : "",
    languages: Array.isArray(r.languages) ? r.languages.filter((x): x is string => typeof x === "string") : base.languages,
    countries: Array.isArray(r.countries) ? r.countries.filter((x): x is string => typeof x === "string") : base.countries,
    currencies: Array.isArray(r.currencies) ? r.currencies.filter((x): x is string => typeof x === "string") : base.currencies,
    sessionHours: typeof r.sessionHours === "number" && r.sessionHours >= 1 ? Math.min(r.sessionHours, 720) : base.sessionHours,
    payoutDelayDays: typeof r.payoutDelayDays === "number" && r.payoutDelayDays >= 0 ? r.payoutDelayDays : base.payoutDelayDays,
    buyerFeeXaf: typeof r.buyerFeeXaf === "number" && r.buyerFeeXaf >= 0 ? Math.round(r.buyerFeeXaf) : 0,
  };
}

export type PhoneAuthSettings = {
  allowedCountries: string[];
  maxPerUserHour: number;
  maxPerIpHour: number;
  cooldownSeconds: number;
  maxAttempts: number;
  expirySeconds: number;
};

export function defaultPhoneAuthSettings(): PhoneAuthSettings {
  return {
    allowedCountries: ["CM", "CA"],
    maxPerUserHour: 5,
    maxPerIpHour: 20,
    cooldownSeconds: 45,
    maxAttempts: 5,
    expirySeconds: 90,
  };
}

export function parsePhoneAuthSettings(raw: unknown): PhoneAuthSettings {
  const base = defaultPhoneAuthSettings();
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Partial<PhoneAuthSettings>;
  return {
    allowedCountries: Array.isArray(r.allowedCountries)
      ? r.allowedCountries.filter((x): x is string => typeof x === "string")
      : base.allowedCountries,
    maxPerUserHour: typeof r.maxPerUserHour === "number" ? r.maxPerUserHour : base.maxPerUserHour,
    maxPerIpHour: typeof r.maxPerIpHour === "number" ? r.maxPerIpHour : base.maxPerIpHour,
    cooldownSeconds: typeof r.cooldownSeconds === "number" ? r.cooldownSeconds : base.cooldownSeconds,
    maxAttempts: typeof r.maxAttempts === "number" ? r.maxAttempts : base.maxAttempts,
    expirySeconds: typeof r.expirySeconds === "number" ? r.expirySeconds : base.expirySeconds,
  };
}

export type AiLimitSettings = {
  recommendationsEnabled: boolean;
  plannerEnabled: boolean;
  matchingEnabled: boolean;
  agentEnabled: boolean;
  maxGenerationsPerUserDay: number;
  maxBudgetXafPerUser: number;
  dailyCallBudget: number;
};

export function defaultAiLimits(): AiLimitSettings {
  return {
    recommendationsEnabled: true,
    plannerEnabled: true,
    matchingEnabled: true,
    agentEnabled: true,
    maxGenerationsPerUserDay: 8,
    maxBudgetXafPerUser: 25000,
    dailyCallBudget: 2000,
  };
}

export function parseAiLimits(raw: unknown): AiLimitSettings {
  const base = defaultAiLimits();
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Partial<AiLimitSettings>;
  return {
    recommendationsEnabled: r.recommendationsEnabled !== false,
    plannerEnabled: r.plannerEnabled !== false,
    matchingEnabled: r.matchingEnabled !== false,
    agentEnabled: r.agentEnabled !== false,
    maxGenerationsPerUserDay:
      typeof r.maxGenerationsPerUserDay === "number" ? r.maxGenerationsPerUserDay : base.maxGenerationsPerUserDay,
    maxBudgetXafPerUser: typeof r.maxBudgetXafPerUser === "number" ? r.maxBudgetXafPerUser : base.maxBudgetXafPerUser,
    dailyCallBudget: typeof r.dailyCallBudget === "number" ? r.dailyCallBudget : base.dailyCallBudget,
  };
}

export type RefundRules = {
  autoRefundOnCancel: boolean;
  allowPartial: boolean;
};

export function defaultRefundRules(): RefundRules {
  return { autoRefundOnCancel: true, allowPartial: true };
}

export function parseRefundRules(raw: unknown): RefundRules {
  const base = defaultRefundRules();
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Partial<RefundRules>;
  return {
    autoRefundOnCancel: r.autoRefundOnCancel !== false,
    allowPartial: r.allowPartial !== false,
  };
}

export type AlertLevel = "INFO" | "WARNING" | "CRITICAL";

export type AdminAlert = {
  id: string;
  level: AlertLevel;
  title: string;
  body: string;
  href?: string;
};

export type OrganizerStatus = "NONE" | "PENDING" | "VERIFIED" | "RESTRICTED" | "SUSPENDED" | "REJECTED";

export const ORGANIZER_STATUSES = ["NONE", "PENDING", "VERIFIED", "RESTRICTED", "SUSPENDED", "REJECTED"] as const;

export function isOrganizerStatus(value: string): value is OrganizerStatus {
  return (ORGANIZER_STATUSES as readonly string[]).includes(value);
}

export type WorldMissionDraft = {
  title: string;
  description: string;
  category: string;
  durationHours: number | null;
  conditions: string;
  reward: string;
  startsAt: string | null;
  endsAt: string | null;
  status: "DRAFT" | "ACTIVE" | "DISABLED" | "ENDED";
};

export function normalizeWorldMission(input: Partial<WorldMissionDraft>): WorldMissionDraft {
  const status = input.status;
  return {
    title: (input.title ?? "").trim().slice(0, 120) || "Mission",
    description: (input.description ?? "").trim().slice(0, 800),
    category: (input.category ?? "discovery").trim().slice(0, 40),
    durationHours: typeof input.durationHours === "number" && input.durationHours > 0 ? Math.round(input.durationHours) : null,
    conditions: (input.conditions ?? "").trim().slice(0, 400),
    reward: (input.reward ?? "").trim().slice(0, 120),
    startsAt: input.startsAt ?? null,
    endsAt: input.endsAt ?? null,
    status: status === "ACTIVE" || status === "DISABLED" || status === "ENDED" || status === "DRAFT" ? status : "DRAFT",
  };
}

export const ADMIN_SENSITIVE_RATE_LIMIT = 30;

export function canPerformSensitiveAdminAction(recentCount: number): "OK" | "RATE_LIMITED" {
  return recentCount >= ADMIN_SENSITIVE_RATE_LIMIT ? "RATE_LIMITED" : "OK";
}
