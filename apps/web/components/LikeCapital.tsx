"use client";

import { formatLikeDuration, type LikeDurationLocale } from "@tiptop/domain";
import { useI18n } from "@/lib/i18n";
import { formatDateTime } from "@/lib/time";

export type LikeTimeStats = {
  totalSeconds: number;
  historicalSeconds?: number;
  activeSeconds?: number;
  weekSeconds?: number;
  label: string;
  weekLabel?: string;
  lastMilestone?: { id: string; label: string; achievedAt: string | null } | null;
};

export function LikeCapital({
  time,
  forSelf = false,
}: {
  time?: LikeTimeStats | null;
  forSelf?: boolean;
}) {
  const { locale, messages } = useI18n();
  const loc: LikeDurationLocale = locale === "en" ? "en" : "fr";
  const total = time?.totalSeconds ?? 0;
  const label = time?.label ?? formatLikeDuration(total, loc);
  const week = time?.weekLabel ?? formatLikeDuration(time?.weekSeconds ?? 0, loc);
  const milestone = time?.lastMilestone;

  return (
    <section className="relative overflow-hidden rounded-card bg-gradient-to-br from-accent-soft via-surface to-surface p-5 shadow-card">
      <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-accent/10" aria-hidden />
      <div className="relative flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-accent text-on-primary" aria-hidden>
          <HeartMini />
        </span>
        <p className="type-label text-accent">{messages.likeTime.capital}</p>
      </div>
      <p className="type-stat relative mt-3 text-ink">{label}</p>
      <p className="type-caption relative mt-1 text-muted">{messages.social.ofLikes}</p>
      <p className="type-body-sm relative mt-3 font-semibold text-accent">{messages.likeTime.weekPlus.replace("{duration}", week)}</p>
      <p className="relative mt-2 type-caption text-muted">
        {milestone?.achievedAt
          ? messages.likeTime.lastMilestone
              .replace("{label}", milestone.label)
              .replace("{date}", formatDateTime(milestone.achievedAt, locale))
          : messages.likeTime.noMilestone}
      </p>
      <p className="relative mt-3 type-caption leading-5 text-muted">
        {forSelf ? messages.social.likeMeterHintSelf : messages.social.likeMeterHint}
      </p>
    </section>
  );
}

function HeartMini() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 20.5s-7.5-4.6-10-9.3C.6 8 2 4.5 5.4 3.7c2-.5 4 .3 5.1 2 .3.5.9.5 1.2 0 1.1-1.7 3.1-2.5 5.1-2 3.4.8 4.8 4.3 3.4 7.5-2.5 4.7-10 9.3-10 9.3Z" />
    </svg>
  );
}
