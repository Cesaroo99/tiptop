/**
 * Like TipTop = durée, pas un compteur.
 *
 * Source de vérité : périodes { startedAt, endedAt }.
 * Jamais d’incrément +1 / seconde en base.
 * Durée active = now - startedAt (calculée).
 *
 * Unités d’affichage (pas un calendrier civil) :
 * - 1 mois affiché = 30 × 86400 s
 * - 1 an affiché = 365 × 86400 s
 * Internes : toujours des secondes entières.
 */

export const LIKE_DAY_SECONDS = 86_400;
export const LIKE_MONTH_SECONDS = 30 * LIKE_DAY_SECONDS;
export const LIKE_YEAR_SECONDS = 365 * LIKE_DAY_SECONDS;

export type LikeTargetType = "user" | "post" | "comment" | "mood" | "wish";

export type LikePeriodSlice = {
  startedAt: Date;
  endedAt: Date | null;
  weight?: number;
};

export function periodDurationSeconds(period: LikePeriodSlice, now: Date): number {
  const weight = Math.max(1, period.weight ?? 1);
  const stop = period.endedAt ?? now;
  const ms = stop.getTime() - period.startedAt.getTime();
  return Math.max(0, Math.floor(ms / 1000)) * weight;
}

export function sumLikeSeconds(periods: LikePeriodSlice[], now: Date) {
  let historicalSeconds = 0;
  let activeSeconds = 0;
  for (const p of periods) {
    const s = periodDurationSeconds(p, now);
    if (p.endedAt) historicalSeconds += s;
    else activeSeconds += s;
  }
  return {
    historicalSeconds,
    activeSeconds,
    totalSeconds: historicalSeconds + activeSeconds,
  };
}

export type LikeDurationLocale = "fr" | "en";

function plural(n: number, one: string, many: string) {
  return n <= 1 ? one : many;
}

export function formatLikeDuration(seconds: number, locale: LikeDurationLocale = "fr"): string {
  const s = Math.max(0, Math.floor(seconds));
  const fr = locale === "fr";

  if (s < 60) {
    return fr ? `${s} ${plural(s, "seconde", "secondes")}` : `${s} ${plural(s, "second", "seconds")}`;
  }
  if (s < 3600) {
    const m = Math.floor(s / 60);
    return fr ? `${m} min` : `${m} min`;
  }
  if (s < LIKE_DAY_SECONDS) {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (!m) return `${h} h`;
    return `${h} h ${m} min`;
  }
  if (s < LIKE_MONTH_SECONDS) {
    const d = Math.floor(s / LIKE_DAY_SECONDS);
    const h = Math.floor((s % LIKE_DAY_SECONDS) / 3600);
    const day = fr ? plural(d, "jour", "jours") : plural(d, "day", "days");
    if (!h) return `${d} ${day}`;
    return `${d} ${day} ${h} h`;
  }
  if (s < LIKE_YEAR_SECONDS) {
    const mo = Math.floor(s / LIKE_MONTH_SECONDS);
    const d = Math.floor((s % LIKE_MONTH_SECONDS) / LIKE_DAY_SECONDS);
    const month = fr ? "mois" : plural(mo, "month", "months");
    if (!d) return `${mo} ${month}`;
    const day = fr ? plural(d, "jour", "jours") : plural(d, "day", "days");
    return `${mo} ${month} ${d} ${day}`;
  }
  const y = Math.floor(s / LIKE_YEAR_SECONDS);
  const mo = Math.floor((s % LIKE_YEAR_SECONDS) / LIKE_MONTH_SECONDS);
  const year = fr ? plural(y, "an", "ans") : plural(y, "year", "years");
  if (!mo) return `${y} ${year}`;
  const month = fr ? "mois" : plural(mo, "month", "months");
  return `${y} ${year} ${mo} ${month}`;
}

export type LikeMilestoneDef = {
  id: string;
  seconds: number;
  fr: string;
  en: string;
};

/** Paliers par défaut — surchargeables via AppConfig `likeMilestones`. */
export const DEFAULT_LIKE_MILESTONES: readonly LikeMilestoneDef[] = [
  { id: "1m", seconds: 60, fr: "🎉 Bravo ! Vous avez désormais plus d’une minute de likes !", en: "🎉 You now have more than a minute of likes!" },
  { id: "1h", seconds: 3600, fr: "🎉 Bravo ! Vous avez désormais plus d’une heure de likes !", en: "🎉 You now have more than an hour of likes!" },
  { id: "1d", seconds: LIKE_DAY_SECONDS, fr: "🎉 Félicitations ! Vous avez désormais 1 jour de likes !", en: "🎉 Congratulations! You now have 1 day of likes!" },
  { id: "1w", seconds: 7 * LIKE_DAY_SECONDS, fr: "🎉 Félicitations ! Vous avez désormais 1 semaine de likes !", en: "🎉 You now have 1 week of likes!" },
  { id: "1mo", seconds: LIKE_MONTH_SECONDS, fr: "🎉 Félicitations ! Vous avez désormais 1 mois de likes !", en: "🎉 You now have 1 month of likes!" },
  { id: "1y", seconds: LIKE_YEAR_SECONDS, fr: "🏆 Félicitations ! Vous venez d’atteindre 1 an de likes sur TipTop !", en: "🏆 You just reached 1 year of likes on TipTop!" },
  { id: "5y", seconds: 5 * LIKE_YEAR_SECONDS, fr: "🏆 Félicitations ! 5 ans de likes sur TipTop !", en: "🏆 5 years of likes on TipTop!" },
  { id: "10y", seconds: 10 * LIKE_YEAR_SECONDS, fr: "🏆 Félicitations ! 10 ans de likes sur TipTop !", en: "🏆 10 years of likes on TipTop!" },
];

export function parseMilestones(raw: unknown): LikeMilestoneDef[] {
  if (!Array.isArray(raw) || raw.length === 0) return [...DEFAULT_LIKE_MILESTONES];
  const parsed: LikeMilestoneDef[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    if (typeof r.id !== "string" || typeof r.seconds !== "number" || r.seconds <= 0) continue;
    parsed.push({
      id: r.id,
      seconds: Math.floor(r.seconds),
      fr: typeof r.fr === "string" ? r.fr : DEFAULT_LIKE_MILESTONES.find((m) => m.id === r.id)?.fr ?? "",
      en: typeof r.en === "string" ? r.en : DEFAULT_LIKE_MILESTONES.find((m) => m.id === r.id)?.en ?? "",
    });
  }
  return parsed.length ? parsed.sort((a, b) => a.seconds - b.seconds) : [...DEFAULT_LIKE_MILESTONES];
}

export function crossedMilestones(
  fromSeconds: number,
  toSeconds: number,
  milestones: readonly LikeMilestoneDef[] = DEFAULT_LIKE_MILESTONES,
): LikeMilestoneDef[] {
  if (toSeconds < fromSeconds) return [];
  return milestones.filter((m) => fromSeconds < m.seconds && toSeconds >= m.seconds);
}

export function highestMilestone(
  totalSeconds: number,
  milestones: readonly LikeMilestoneDef[] = DEFAULT_LIKE_MILESTONES,
): LikeMilestoneDef | null {
  let best: LikeMilestoneDef | null = null;
  for (const m of milestones) {
    if (totalSeconds >= m.seconds) best = m;
  }
  return best;
}

export function targetKey(type: LikeTargetType, id: string) {
  return `${type}:${id}`;
}

/** Progression live côté client : N likes actifs × secondes écoulées depuis le fetch. */
export function liveLikeSeconds(
  totalAtFetch: number,
  activeCount: number,
  fetchedAt: Date,
  now: Date,
): number {
  const extra = Math.max(0, activeCount) * Math.max(0, Math.floor((now.getTime() - fetchedAt.getTime()) / 1000));
  return Math.max(0, Math.floor(totalAtFetch)) + extra;
}

export function parseTargetKey(key: string): { type: LikeTargetType; id: string } | null {
  const i = key.indexOf(":");
  if (i <= 0) return null;
  const type = key.slice(0, i) as LikeTargetType;
  const id = key.slice(i + 1);
  if (!id) return null;
  if (!["user", "post", "comment", "mood", "wish"].includes(type)) return null;
  return { type, id };
}

/** Certifié : poids du like — à valider. V1 = 1 (pas de double temps silencieux). */
export const CERTIFIED_LIKE_WEIGHT = 1;
