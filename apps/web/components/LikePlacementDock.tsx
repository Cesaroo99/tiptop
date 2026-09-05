"use client";

import Link from "next/link";
import { formatLikeDuration, type LikeDurationLocale } from "@tiptop/domain";
import { useI18n } from "@/lib/i18n";
import { useLikePlacement } from "@/lib/like-placement";
import { HeartIcon } from "./Icons";
import { useLiveLikeSeconds } from "./LikeTimeBadge";

function compactDuration(seconds: number, locale: LikeDurationLocale) {
  if (seconds < 60) return `${seconds} s`;
  return formatLikeDuration(seconds, locale);
}

export function LikePlacementDock() {
  const { messages, locale } = useI18n();
  const { placement, loadedAt } = useLikePlacement();
  const loc: LikeDurationLocale = locale === "en" ? "en" : "fr";
  const seconds = useLiveLikeSeconds(
    placement
      ? { totalSeconds: placement.seconds, activeCount: 1, likedByMe: true, label: "" }
      : null,
    loadedAt,
  );
  if (!placement) return null;

  const duration = compactDuration(seconds, loc);
  const line = messages.social.likeDockOn.replace("{duration}", duration).replace("{label}", placement.label);
  const aria = messages.social.likeDockAria.replace("{duration}", duration).replace("{label}", placement.label);

  return (
    <Link
      href={placement.href}
      aria-label={aria}
      title={line}
      data-like-dock="active"
      className="flex min-w-0 items-center gap-1.5 border-b border-divider px-3.5 py-1.5"
    >
      <HeartIcon size={12} filled className="shrink-0 text-accent" />
      <span className="type-caption shrink-0 font-bold tabular-nums text-accent">{duration}</span>
      <span className="type-caption min-w-0 truncate text-muted">· {placement.label}</span>
    </Link>
  );
}
