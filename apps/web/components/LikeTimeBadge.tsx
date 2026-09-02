"use client";

import { useEffect, useState } from "react";
import { formatLikeDuration, liveLikeSeconds, type LikeDurationLocale } from "@tiptop/domain";
import { useI18n } from "@/lib/i18n";

export type LikeTimeView = {
  totalSeconds: number;
  activeCount: number;
  likedByMe?: boolean;
  label: string;
};

export function useLiveLikeLabel(time: LikeTimeView | undefined | null, loadedAt: number) {
  const { locale } = useI18n();
  const loc: LikeDurationLocale = locale === "en" ? "en" : "fr";
  const [now, setNow] = useState(() => Date.now());
  const active = time?.activeCount ?? 0;

  useEffect(() => {
    if (active <= 0) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [active]);

  if (!time) return "0 s";
  const seconds = liveLikeSeconds(time.totalSeconds, active, new Date(loadedAt), new Date(now));
  return formatLikeDuration(seconds, loc);
}

export function LikeTimeBadge({
  time,
  loadedAt,
  className = "",
}: {
  time?: LikeTimeView | null;
  loadedAt: number;
  className?: string;
}) {
  const { messages } = useI18n();
  const label = useLiveLikeLabel(time, loadedAt);
  return (
    <span className={`type-meta text-muted ${className}`}>
      ♥ {messages.likeTime.ofDuration.replace("{duration}", label)}
    </span>
  );
}
