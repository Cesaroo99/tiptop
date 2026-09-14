/** TipTop Intelligence Engine — règles déterministes + contrat IA. */

import { haversineKm } from "./location";
import { isMoodInterest, type MoodInterestId } from "./moods";

export const EXPERIENCE_CATEGORIES = [
  "concert",
  "food",
  "rooftop",
  "piscine",
  "nightlife",
  "sport",
  "culture",
  "travel",
  "fashion",
  "hangout",
  "adventure",
  "wellness",
] as const;

export type ExperienceCategory = (typeof EXPERIENCE_CATEGORIES)[number];

export const PREFERENCE_SIGNAL_KINDS = [
  "VIEW_LONG",
  "SAVED",
  "SHARED",
  "FAVORITED",
  "CLICK_BOOK",
  "BOOKED",
  "ATTENDED",
  "INVITED",
  "POSITIVE_FEEDBACK",
  "REPEAT_CATEGORY",
  "IGNORED",
  "LEFT_QUICK",
  "NOT_INTERESTED",
  "CANCELLED",
  "NO_SHOW",
  "REC_IGNORED",
] as const;

export type PreferenceSignalKind = (typeof PREFERENCE_SIGNAL_KINDS)[number];

export const POSITIVE_SIGNAL_KINDS: PreferenceSignalKind[] = [
  "VIEW_LONG",
  "SAVED",
  "SHARED",
  "FAVORITED",
  "CLICK_BOOK",
  "BOOKED",
  "ATTENDED",
  "INVITED",
  "POSITIVE_FEEDBACK",
  "REPEAT_CATEGORY",
];

export const SIGNAL_WEIGHT: Record<PreferenceSignalKind, number> = {
  VIEW_LONG: 0.15,
  SAVED: 0.35,
  SHARED: 0.25,
  FAVORITED: 0.45,
  CLICK_BOOK: 0.4,
  BOOKED: 0.85,
  ATTENDED: 1.2,
  INVITED: 0.5,
  POSITIVE_FEEDBACK: 0.9,
  REPEAT_CATEGORY: 0.7,
  IGNORED: -0.12,
  LEFT_QUICK: -0.2,
  NOT_INTERESTED: -0.7,
  CANCELLED: -0.45,
  NO_SHOW: -0.8,
  REC_IGNORED: -0.25,
};

export type PreferenceVector = Record<ExperienceCategory, number>;

export function emptyPreferenceVector(): PreferenceVector {
  return Object.fromEntries(EXPERIENCE_CATEGORIES.map((c) => [c, 0])) as PreferenceVector;
}

export function isExperienceCategory(value: unknown): value is ExperienceCategory {
  return typeof value === "string" && (EXPERIENCE_CATEGORIES as readonly string[]).includes(value);
}

export function categoryFromInterest(id: string | null | undefined): ExperienceCategory | null {
  if (!id) return null;
  if (isExperienceCategory(id)) return id;
  if (isMoodInterest(id)) return id as MoodInterestId;
  return null;
}

const CATEGORY_HINTS: Array<{ re: RegExp; category: ExperienceCategory }> = [
  { re: /escalade|climb|randonn|kayak|surf|aventure|adventure/i, category: "adventure" },
  { re: /spa|yoga|wellness|bien[- ]?être|médit/i, category: "wellness" },
  { re: /concert|musique|live|dj/i, category: "concert" },
  { re: /resto|restaurant|food|sushi|brunch|dîner|diner|manger/i, category: "food" },
  { re: /rooftop/i, category: "rooftop" },
  { re: /piscine|pool/i, category: "piscine" },
  { re: /club|nuit|night|after|bar/i, category: "nightlife" },
  { re: /basket|foot|sport|run|gym|padel/i, category: "sport" },
  { re: /théâtre|theatre|expo|musée|musee|opéra|opera|culture/i, category: "culture" },
  { re: /voyage|travel/i, category: "travel" },
  { re: /mode|fashion/i, category: "fashion" },
];

export function inferCategoryFromText(text: string | null | undefined): ExperienceCategory | null {
  const raw = (text ?? "").trim();
  if (!raw) return null;
  for (const hint of CATEGORY_HINTS) {
    if (hint.re.test(raw)) return hint.category;
  }
  return null;
}

export function applyPreferenceSignal(
  vector: PreferenceVector,
  kind: PreferenceSignalKind,
  category: ExperienceCategory,
): PreferenceVector {
  const next = { ...vector };
  next[category] = clampScore((next[category] ?? 0) + SIGNAL_WEIGHT[kind]);
  return next;
}

export function foldPreferenceSignals(
  signals: Array<{ kind: PreferenceSignalKind; category: ExperienceCategory }>,
  interests: string[] = [],
): PreferenceVector {
  let vector = emptyPreferenceVector();
  for (const interest of interests) {
    const cat = categoryFromInterest(interest);
    if (cat) vector[cat] = clampScore(vector[cat] + 0.35);
  }
  for (const signal of signals) {
    vector = applyPreferenceSignal(vector, signal.kind, signal.category);
  }
  return vector;
}

export function clampScore(value: number, min = -2, max = 4): number {
  return Math.max(min, Math.min(max, Number(value.toFixed(3))));
}

export type OutingIntent = {
  rawText: string;
  dateHint: "today" | "tonight" | "tomorrow" | "weekend" | "saturday" | "sunday" | null;
  hour: number | null;
  durationMin: number | null;
  budgetXaf: number | null;
  partySize: number;
  maxKm: number | null;
  category: ExperienceCategory | null;
  vibe: "fun" | "calm" | "social" | "spontaneous" | "new" | "wild" | null;
  surprise: boolean;
};

const DAY_HINTS: Array<{ re: RegExp; hint: OutingIntent["dateHint"] }> = [
  { re: /\bce soir|tonight|this evening\b/i, hint: "tonight" },
  { re: /\bdemain|tomorrow\b/i, hint: "tomorrow" },
  { re: /\bsamedi|saturday\b/i, hint: "saturday" },
  { re: /\bdimanche|sunday\b/i, hint: "sunday" },
  { re: /\bweek[- ]?end|samedi soir\b/i, hint: "weekend" },
  { re: /\baujourd.?hui|today\b/i, hint: "today" },
];

export function parseOutingIntent(text: string): OutingIntent {
  const raw = text.trim();
  const budgetMatch = raw.match(/(\d+(?:[.,]\d+)?)\s*(\$|usd|cad|xaf|fcfa|€|eur)?/i);
  let budgetXaf: number | null = null;
  if (budgetMatch) {
    const amount = Number(budgetMatch[1]!.replace(",", "."));
    const unit = (budgetMatch[2] ?? "").toLowerCase();
    if (unit === "$" || unit === "usd" || unit === "cad" || unit === "€" || unit === "eur") {
      budgetXaf = Math.round(amount * 600);
    } else {
      budgetXaf = Math.round(amount);
    }
  }
  const WORDS: Record<string, number> = {
    deux: 2,
    two: 2,
    trois: 3,
    three: 3,
    quatre: 4,
    four: 4,
    cinq: 5,
    five: 5,
  };
  const party =
    raw.match(/\b(nous|on)\s+(est|sommes|are)\s+(\d+|deux|two|trois|three|quatre|four|cinq|five)\b/i) ??
    raw.match(/\b(\d+|deux|two|trois|three|quatre|four|cinq|five)\s+(personnes|people|amis|friends)\b/i);
  const hourMatch = raw.match(/\b(\d{1,2})\s*h(?:\s*(\d{2}))?\b/i);
  let dateHint: OutingIntent["dateHint"] = null;
  for (const day of DAY_HINTS) {
    if (day.re.test(raw)) {
      dateHint = day.hint;
      break;
    }
  }
  let vibe: OutingIntent["vibe"] = null;
  if (/fou|crazy|wild|surpren/i.test(raw)) vibe = "wild";
  else if (/jamais|never|nouveau|new/i.test(raw)) vibe = "new";
  else if (/calme|chill|quiet/i.test(raw)) vibe = "calm";
  else if (/rencontr|meet|social|nouvelles personnes/i.test(raw)) vibe = "social";
  else if (/spontan/i.test(raw)) vibe = "spontaneous";
  else if (/fun|amus/i.test(raw)) vibe = "fun";

  return {
    rawText: raw,
    dateHint,
    hour: hourMatch ? Number(hourMatch[1]) : /soir|tonight|evening/i.test(raw) ? 19 : null,
    durationMin: /apr[eè]s[- ]?midi|afternoon/i.test(raw) ? 180 : /soir|tonight/i.test(raw) ? 240 : null,
    budgetXaf,
    partySize: (() => {
      if (!party) return /seul|solo|alone/i.test(raw) ? 1 : 2;
      const token = (party[3] ?? party[1] ?? "").toLowerCase();
      const word = WORDS[token];
      if (word) return word;
      const n = Number(token);
      return Number.isFinite(n) && n > 0 ? n : 2;
    })(),
    maxKm: /tr[eè]s proche|very close|walking/i.test(raw) ? 3 : /proche|near/i.test(raw) ? 8 : null,
    category: inferCategoryFromText(raw),
    vibe,
    surprise: /surpris|surprise me|surprends/i.test(raw),
  };
}

export function intentWindow(intent: OutingIntent, now = new Date()): { from: Date; to: Date } {
  const start = new Date(now);
  start.setSeconds(0, 0);
  if (intent.dateHint === "tomorrow") start.setDate(start.getDate() + 1);
  if (intent.dateHint === "saturday") start.setDate(start.getDate() + ((6 - start.getDay() + 7) % 7 || 7));
  if (intent.dateHint === "sunday") start.setDate(start.getDate() + ((7 - start.getDay()) % 7 || 7));
  if (intent.dateHint === "weekend") {
    const toSat = (6 - start.getDay() + 7) % 7;
    start.setDate(start.getDate() + (toSat === 0 && start.getHours() > 22 ? 7 : toSat));
  }
  if (intent.hour != null) start.setHours(intent.hour, 0, 0, 0);
  else if (intent.dateHint === "tonight") start.setHours(Math.max(now.getHours() + 1, 18), 0, 0, 0);
  else if (start.getTime() <= now.getTime()) start.setHours(now.getHours() + 1, 0, 0, 0);
  const span = intent.durationMin ?? (intent.dateHint === "weekend" ? 36 * 60 : 8 * 60);
  return { from: start, to: new Date(start.getTime() + span * 60_000) };
}

export type ScoredEventInput = {
  id: string;
  title: string;
  description?: string | null;
  city: string;
  zone?: string | null;
  startsAt: Date | string;
  priceXaf: number;
  latitude?: number | null;
  longitude?: number | null;
  interestedCount?: number;
  reservedCount?: number;
};

export type PreferenceSnapshot = {
  vector: PreferenceVector;
  disliked: ExperienceCategory[];
  typicalBudgetXaf: number | null;
  maxBudgetXaf: number | null;
  maxDistanceKm: number | null;
  preferredHours: { start: number; end: number } | null;
};

export function eventCategoryGuess(event: Pick<ScoredEventInput, "title" | "description">): ExperienceCategory {
  return inferCategoryFromText(`${event.title} ${event.description ?? ""}`) ?? "hangout";
}

export function scoreEventForUser(
  event: ScoredEventInput,
  prefs: PreferenceSnapshot,
  origin?: { latitude: number; longitude: number } | null,
  now = new Date(),
): { score: number; reasons: string[]; category: ExperienceCategory; distanceKm: number | null } {
  const category = eventCategoryGuess(event);
  const reasons: string[] = [];
  let score = 0.4 + (prefs.vector[category] ?? 0) * 0.55;
  if ((prefs.vector[category] ?? 0) > 0.6) reasons.push("habit_category");
  if (prefs.disliked.includes(category)) return { score: -2, reasons: ["disliked_category"], category, distanceKm: null };

  const price = event.priceXaf ?? 0;
  if (prefs.maxBudgetXaf != null && price > prefs.maxBudgetXaf) {
    return { score: -1.5, reasons: ["over_budget"], category, distanceKm: null };
  }
  if (prefs.typicalBudgetXaf != null && price > 0 && price <= prefs.typicalBudgetXaf * 1.15) {
    score += 0.25;
    reasons.push("budget_fit");
  }

  const starts = new Date(event.startsAt);
  const hoursAhead = (starts.getTime() - now.getTime()) / 3600_000;
  if (hoursAhead < 0) return { score: -3, reasons: ["past"], category, distanceKm: null };
  if (hoursAhead > 0 && hoursAhead < 4) {
    score += 0.3;
    reasons.push("starts_soon");
  }
  if (prefs.preferredHours) {
    const h = starts.getHours();
    if (h >= prefs.preferredHours.start && h <= prefs.preferredHours.end) {
      score += 0.2;
      reasons.push("preferred_hours");
    }
  }

  let distanceKm: number | null = null;
  if (origin && event.latitude != null && event.longitude != null) {
    distanceKm = haversineKm(origin, { latitude: event.latitude, longitude: event.longitude });
    if (prefs.maxDistanceKm != null && distanceKm > prefs.maxDistanceKm) {
      return { score: -1.2, reasons: ["too_far"], category, distanceKm };
    }
    if (distanceKm <= 5) {
      score += 0.2;
      reasons.push("nearby");
    }
  }

  const social = (event.interestedCount ?? 0) + (event.reservedCount ?? 0);
  if (social >= 3) {
    score += 0.12;
    reasons.push("social_proof");
  }

  return { score: clampScore(score, -3, 6), reasons, category, distanceKm };
}

export function filterScoredRecommendations<T extends { score: number; reasons: string[] }>(
  items: T[],
  limit = 3,
): T[] {
  return items
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export type PlanStepDraft = {
  order: number;
  startsAt: string;
  title: string;
  category: ExperienceCategory;
  eventId: string | null;
  costXaf: number;
  travelMin: number;
  bookable: boolean;
  hint: boolean;
  revealed: boolean;
};

export function buildExperiencePlan(input: {
  intent: OutingIntent;
  events: ScoredEventInput[];
  prefs: PreferenceSnapshot;
  origin?: { latitude: number; longitude: number } | null;
  now?: Date;
  surprise?: boolean;
}): { steps: PlanStepDraft[]; totalCostXaf: number; constraints: OutingIntent } {
  const now = input.now ?? new Date();
  const window = intentWindow(input.intent, now);
  const scored = input.events
    .map((event) => ({ event, ...scoreEventForUser(event, input.prefs, input.origin, now) }))
    .filter((row) => {
      const start = new Date(row.event.startsAt).getTime();
      if (start < window.from.getTime() - 60 * 60_000 || start > window.to.getTime()) return false;
      if (input.intent.budgetXaf != null && row.event.priceXaf > input.intent.budgetXaf) return false;
      if (input.intent.category && row.category !== input.intent.category && input.intent.vibe !== "wild") return false;
      if (input.intent.maxKm != null && row.distanceKm != null && row.distanceKm > input.intent.maxKm) return false;
      return row.score > 0;
    })
    .sort((a, b) => a.event.startsAt.toString().localeCompare(b.event.startsAt.toString()))
    .slice(0, 3);

  const surprise = Boolean(input.surprise ?? input.intent.surprise);
  const steps: PlanStepDraft[] = [];
  let cursor = new Date(window.from);
  if (scored.length === 0) {
    steps.push({
      order: 1,
      startsAt: cursor.toISOString(),
      title: input.intent.category === "food" ? "Dîner de quartier" : "Balade / apéro local",
      category: input.intent.category ?? "hangout",
      eventId: null,
      costXaf: Math.min(input.intent.budgetXaf ?? 8000, 8000),
      travelMin: 10,
      bookable: false,
      hint: true,
      revealed: true,
    });
  }
  scored.forEach((row, index) => {
    const start = new Date(row.event.startsAt);
    if (index === 0 && start.getTime() - cursor.getTime() > 90 * 60_000) {
      steps.push({
        order: steps.length + 1,
        startsAt: cursor.toISOString(),
        title: "Premier arrêt — boire un verre / manger",
        category: "food",
        eventId: null,
        costXaf: Math.min(5000, input.intent.budgetXaf ?? 5000),
        travelMin: 12,
        bookable: false,
        hint: true,
        revealed: true,
      });
    }
    steps.push({
      order: steps.length + 1,
      startsAt: start.toISOString(),
      title: row.event.title,
      category: row.category,
      eventId: row.event.id,
      costXaf: row.event.priceXaf,
      travelMin: row.distanceKm != null ? Math.max(8, Math.round(row.distanceKm * 4)) : 15,
      bookable: true,
      hint: false,
      revealed: !surprise || index === 0,
    });
    cursor = new Date(start.getTime() + 90 * 60_000);
  });

  const totalCostXaf = steps.reduce((sum, step) => sum + step.costXaf, 0);
  return { steps: steps.map((step, i) => ({ ...step, order: i + 1 })), totalCostXaf, constraints: input.intent };
}

export function refineExperiencePlan(
  current: PlanStepDraft[],
  tweak: "cheaper" | "closer" | "calmer" | "social" | "spontaneous" | "replace" | number,
  pool: PlanStepDraft[],
): PlanStepDraft[] {
  if (typeof tweak === "number") {
    const replacement = pool.find((step) => step.order !== tweak && step.eventId !== current[tweak - 1]?.eventId);
    if (!replacement) return current;
    return current.map((step) => (step.order === tweak ? { ...replacement, order: tweak, revealed: true } : step));
  }
  if (tweak === "cheaper") {
    const cheaper = [...pool].sort((a, b) => a.costXaf - b.costXaf);
    return current.map((step, i) => (step.bookable && cheaper[i] ? { ...cheaper[i]!, order: step.order } : step));
  }
  if (tweak === "calmer") {
    return current.filter((step) => step.category !== "nightlife").map((step, i) => ({ ...step, order: i + 1 }));
  }
  if (tweak === "spontaneous") {
    return current.slice(0, Math.max(1, current.length - 1)).map((step, i) => ({ ...step, order: i + 1 }));
  }
  return current;
}

export type MatchCandidate = {
  id: string;
  interests: string[];
  available: boolean;
  distanceKm: number | null;
  sameCategory: boolean;
  seeking: boolean;
};

export function scoreSocialMatch(candidate: MatchCandidate, category: ExperienceCategory): number {
  let score = 0.2;
  if (candidate.sameCategory || candidate.interests.includes(category)) score += 0.45;
  if (candidate.available) score += 0.35;
  if (candidate.seeking) score += 0.2;
  if (candidate.distanceKm != null) score += Math.max(0, 0.25 - candidate.distanceKm / 40);
  return clampScore(score, 0, 3);
}

export function publicMatchDistance(distanceKm: number | null): string | null {
  if (distanceKm == null) return null;
  if (distanceKm < 1) return "<1 km";
  return `${Math.round(distanceKm)} km`;
}

export const WORLD_WEIGHTS = {
  diversity: 0.35,
  attendance: 0.3,
  venues: 0.2,
  regularity: 0.15,
} as const;

export function cityDiscoveryPercent(input: {
  categoriesTried: number;
  categoriesTotal?: number;
  attendedCount: number;
  uniqueVenues: number;
  activeWeeks: number;
}): number {
  const total = input.categoriesTotal ?? EXPERIENCE_CATEGORIES.length;
  const diversity = clamp01(input.categoriesTried / Math.max(1, total));
  const attendance = clamp01(input.attendedCount / 8);
  const venues = clamp01(input.uniqueVenues / 10);
  const regularity = clamp01(input.activeWeeks / 4);
  const raw =
    WORLD_WEIGHTS.diversity * diversity +
    WORLD_WEIGHTS.attendance * attendance +
    WORLD_WEIGHTS.venues * venues +
    WORLD_WEIGHTS.regularity * regularity;
  return Math.round(clamp01(raw) * 100);
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export type MissionKind = "WEEKEND" | "SOCIAL" | "DISCOVERY" | "FIRST_TIME";

export function pickAdaptiveMissions(input: {
  triedCategories: ExperienceCategory[];
  attendedWithOthers: number;
  uniqueVenuesInCity: number;
}): MissionKind[] {
  const out: MissionKind[] = [];
  if (input.triedCategories.length < 4) out.push("FIRST_TIME");
  if (input.attendedWithOthers < 2) out.push("SOCIAL");
  if (input.uniqueVenuesInCity < 3) out.push("DISCOVERY");
  if (!out.includes("FIRST_TIME")) out.push("WEEKEND");
  return out.slice(0, 3);
}

export function achievementForProgress(input: {
  firstTimeCategory: boolean;
  uniqueVenues: number;
  socialAttend: boolean;
}): Array<"FIRST_TIME" | "LOCAL_EXPLORER" | "SOCIAL_FIRST"> {
  const badges: Array<"FIRST_TIME" | "LOCAL_EXPLORER" | "SOCIAL_FIRST"> = [];
  if (input.firstTimeCategory) badges.push("FIRST_TIME");
  if (input.uniqueVenues >= 3) badges.push("LOCAL_EXPLORER");
  if (input.socialAttend) badges.push("SOCIAL_FIRST");
  return badges;
}

export type AiConsent = {
  personalizedRecs: boolean;
  useHistory: boolean;
  socialMatch: boolean;
  agentEnabled: boolean;
};

export const DEFAULT_AI_CONSENT: AiConsent = {
  personalizedRecs: true,
  useHistory: true,
  socialMatch: false,
  agentEnabled: false,
};

export function canUsePersonalizedRecs(consent: AiConsent): boolean {
  return consent.personalizedRecs;
}

export function canUseHistory(consent: AiConsent): boolean {
  return consent.personalizedRecs && consent.useHistory;
}

export function canSocialMatch(consent: AiConsent): boolean {
  return consent.personalizedRecs && consent.socialMatch;
}

export function canRunAgent(consent: AiConsent): boolean {
  return consent.personalizedRecs && consent.agentEnabled;
}

export function agentMayContactPeer(): false {
  return false;
}

export const INTEL_RATE_LIMITS = {
  planPerHour: 8,
  agentPerHour: 12,
  signalsPerHour: 40,
} as const;

export function allowRate(count: number, max: number): boolean {
  return count < max;
}

export function feedbackToSignal(
  kind: "LIKE" | "NOT_INTERESTED" | "HIDE_TYPE" | "WHY",
): PreferenceSignalKind | null {
  if (kind === "LIKE") return "POSITIVE_FEEDBACK";
  if (kind === "NOT_INTERESTED") return "NOT_INTERESTED";
  if (kind === "HIDE_TYPE") return "NOT_INTERESTED";
  return null;
}

export function experienceMoodToSignal(mood: "LOVED" | "GOOD" | "OK" | "DISLIKED"): PreferenceSignalKind {
  if (mood === "LOVED" || mood === "GOOD") return "POSITIVE_FEEDBACK";
  if (mood === "OK") return "VIEW_LONG";
  return "NOT_INTERESTED";
}

export function typicalBudgetFromPrices(prices: number[]): number | null {
  const paid = prices.filter((p) => p > 0).sort((a, b) => a - b);
  if (paid.length === 0) return null;
  return paid[Math.floor(paid.length / 2)] ?? null;
}

export function dayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}
