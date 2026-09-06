"use client";

import { formatCompactCount, formatLikeDurationShort, type LikeDurationLocale } from "@tiptop/domain";
import { viewerAwareLikeTime } from "@/lib/like-feed";
import { useLiveLikeSeconds } from "./LikeTimeBadge";
import { CommentIcon, HeartIcon, MoreIcon, ShareIcon } from "./Icons";
import type { LikeTimeSnap } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

export function moodLikeDuration(
  time: LikeTimeSnap | undefined,
  extraSeconds = 0,
  locale: LikeDurationLocale = "fr",
) {
  return formatLikeDurationShort((time?.totalSeconds ?? 0) + Math.max(0, extraSeconds), locale);
}

function RailAction({
  label,
  active,
  onClick,
  children,
  caption,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  caption?: string;
}) {
  return (
    <button type="button" onClick={onClick} aria-label={label} className="tap-scale flex w-12 flex-col items-center gap-1">
      <span className="relative grid h-11 w-11 place-items-center">
        <span
          aria-hidden
          className={`absolute inset-[5px] rounded-full blur-md ${active ? "bg-accent/55" : "bg-black/50"}`}
        />
        <span className={`relative ${active ? "text-accent" : "text-white"}`}>{children}</span>
      </span>
      {caption ? (
        <span className="max-w-[3.25rem] truncate text-center text-[11px] font-bold tabular-nums leading-none text-white [text-shadow:0_1px_4px_rgba(0,0,0,0.85)]">
          {caption}
        </span>
      ) : null}
    </button>
  );
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
  const shown = viewerAwareLikeTime(likeTime, liked);
  const liveTotal = useLiveLikeSeconds(shown, loadedAt);
  const extra = Math.max(0, liveTotal - (shown?.totalSeconds ?? 0));
  const duration = moodLikeDuration(shown ?? undefined, extra, loc);

  return (
    <div className="flex flex-col items-center gap-4 text-white">
      <RailAction
        label={liked ? messages.social.likeHere : messages.social.likePlace}
        active={liked}
        onClick={onLike}
        caption={duration}
      >
        <HeartIcon size={28} filled={liked} />
      </RailAction>
      <RailAction label={messages.social.comments} onClick={onComments} caption={formatCompactCount(commentsCount)}>
        <CommentIcon size={26} />
      </RailAction>
      <RailAction label={messages.social.share} onClick={onShare}>
        <ShareIcon size={24} />
      </RailAction>
      <RailAction label={messages.world.moodActions} onClick={onMore}>
        <MoreIcon size={22} className="rotate-90" />
      </RailAction>
    </div>
  );
}
