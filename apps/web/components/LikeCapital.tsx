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
    <section className="rounded-card bg-surface p-5 shadow-card">
      <p className="type-label text-accent">{messages.likeTime.capital}</p>
      <p className="type-stat mt-2 text-ink">{label}</p>
      <p className="type-caption mt-1 text-muted">{messages.social.ofLikes}</p>
      <p className="type-body-sm mt-3 text-accent">{messages.likeTime.weekPlus.replace("{duration}", week)}</p>
      <p className="mt-2 type-caption text-muted">
        {milestone?.achievedAt
          ? messages.likeTime.lastMilestone
              .replace("{label}", milestone.label)
              .replace("{date}", formatDateTime(milestone.achievedAt, locale))
          : messages.likeTime.noMilestone}
      </p>
      <p className="mt-3 type-caption leading-5 text-muted">
        {forSelf ? messages.social.likeMeterHintSelf : messages.social.likeMeterHint}
      </p>
    </section>
  );
}
