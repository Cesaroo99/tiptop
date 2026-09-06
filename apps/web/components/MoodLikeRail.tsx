"use client";

import { formatCompactCount, formatLikeDurationShort, type LikeDurationLocale } from "@tiptop/domain";
import { useLiveLikeSeconds } from "./LikeTimeBadge";
import { CommentIcon, HeartIcon, MoreIcon, ShareIcon } from "./Icons";
import type { LikeTimeSnap } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

export function moodLikeMeters(
  time: LikeTimeSnap | undefined,
  extraSeconds = 0,
  locale: LikeDurationLocale = "fr",
) {
  const extra = Math.max(0, extraSeconds);
  return {
    total: formatLikeDurationShort((time?.totalSeconds ?? 0) + extra, locale),
    hour: formatLikeDurationShort((time?.hourSeconds ?? 0) + extra, locale),
    day: formatLikeDurationShort((time?.daySeconds ?? 0) + extra, locale),
    month: formatLikeDurationShort((time?.monthSeconds ?? 0) + extra, locale),
  };
}

export function MoodLikeRail({
  liked,
  likeTime,
  loadedAt,
  commentsCount,
  onLike,
  onComments,
  onShare,
  onMore,
}: {
  liked: boolean;
  likeTime?: LikeTimeSnap;
  loadedAt: number;
  commentsCount: number;
  onLike: () => void;
  onComments: () => void;
  onShare: () => void;
  onMore: () => void;
}) {
  const { messages, locale } = useI18n();
  const loc: LikeDurationLocale = locale === "en" ? "en" : "fr";
  const liveTotal = useLiveLikeSeconds(likeTime, loadedAt);
  const extra = Math.max(0, liveTotal - (likeTime?.totalSeconds ?? 0));
  const meters = moodLikeMeters(likeTime, extra, loc);

  return (
    <div className="flex flex-col items-center gap-3.5 text-white">
      <button
        type="button"
        onClick={onLike}
        className="tap-scale flex flex-col items-center"
        aria-label={liked ? messages.social.likeHere : messages.social.likePlace}
      >
        <span
          className={`grid h-[52px] w-[52px] place-items-center rounded-full shadow-sm ${
            liked ? "bg-accent text-white" : "bg-black/40 text-white backdrop-blur-sm"
          }`}
        >
          <HeartIcon size={22} filled={liked} />
        </span>
      </button>
      <div
        className="flex flex-col items-center leading-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]"
        aria-label={messages.likeTime.capital}
      >
        <span className="text-[13px] font-semibold tabular-nums">{meters.hour}</span>
        <span className="text-[11px] font-semibold opacity-90">{messages.likeTime.perHour}</span>
        <span className="mt-1.5 text-[13px] font-semibold tabular-nums">{meters.day}</span>
        <span className="text-[11px] font-semibold opacity-90">{messages.likeTime.perDay}</span>
        <span className="mt-1.5 text-[13px] font-semibold tabular-nums">{meters.month}</span>
        <span className="text-[11px] font-semibold opacity-90">{messages.likeTime.perMonth}</span>
      </div>
      <button type="button" onClick={onComments} className="tap-scale flex flex-col items-center gap-1" aria-label={messages.social.comments}>
        <span className="grid h-11 w-11 place-items-center">
          <CommentIcon size={26} />
        </span>
        <span className="text-[12px] font-semibold drop-shadow">{formatCompactCount(commentsCount)}</span>
      </button>
      <button type="button" onClick={onShare} className="tap-scale flex flex-col items-center" aria-label={messages.social.share}>
        <span className="grid h-11 w-11 place-items-center">
          <ShareIcon size={22} />
        </span>
      </button>
      <button type="button" onClick={onMore} className="tap-scale grid h-10 w-11 place-items-center" aria-label={messages.world.moodActions}>
        <MoreIcon size={20} />
      </button>
    </div>
  );
}
