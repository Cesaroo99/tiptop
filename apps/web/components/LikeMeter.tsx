"use client";

import { useI18n } from "@/lib/i18n";

export type LikeProductionView = {
  active: number;
  perHour: number;
  perDay: number;
  perMonth: number;
  ratio?: { value: number; unit: "hour" | "second" };
};

export function LikeMeter({
  stats,
  hint = true,
  forSelf = false,
}: {
  stats: LikeProductionView;
  hint?: boolean;
  forSelf?: boolean;
}) {
  const { messages } = useI18n();
  const influencer = stats.ratio?.unit === "second";
  const ratioLabel = influencer
    ? `${stats.ratio!.value.toFixed(3)} ${messages.social.perSecond}`
    : null;

  return (
    <section className="rounded-card bg-surface p-4 shadow-card">
      <p className="text-sm font-semibold text-accent">{messages.social.likeProduction}</p>
      <p className="mt-1 text-2xl font-bold text-ink">
        {messages.social.likesNow.replace("{n}", String(stats.active))}
      </p>
      <div className="mt-3 grid grid-cols-3 text-center">
        <div>
          <p className="text-xl font-semibold text-accent">{stats.perHour}</p>
          <p className="text-xs text-muted">{messages.social.perHourLong}</p>
        </div>
        <div>
          <p className="text-xl font-semibold text-accent">{stats.perDay}</p>
          <p className="text-xs text-muted">{messages.social.perDayLong}</p>
        </div>
        <div>
          <p className="text-xl font-semibold text-accent">{stats.perMonth}</p>
          <p className="text-xs text-muted">{messages.social.perMonthLong}</p>
        </div>
      </div>
      {ratioLabel ? <p className="mt-2 text-center text-xs font-semibold text-yellow">{ratioLabel}</p> : null}
      {hint ? (
        <p className="mt-3 text-xs leading-5 text-muted">
          {forSelf ? messages.social.likeMeterHintSelf : messages.social.likeMeterHint}
        </p>
      ) : null}
    </section>
  );
}
