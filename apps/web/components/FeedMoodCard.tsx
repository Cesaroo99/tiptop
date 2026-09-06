"use client";

import Link from "next/link";
import { useState } from "react";
import { api, ApiError, type MoodItem } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { viewerLikeActive } from "@/lib/like-feed";
import { useLikePlacement } from "@/lib/like-placement";
import { Avatar } from "./Avatar";
import { HeartIcon } from "./Icons";

export function FeedMoodCard({
  mood,
  onChanged,
}: {
  mood: MoodItem;
  onChanged?: (next: MoodItem) => void;
}) {
  const { messages } = useI18n();
  const { placement, ready, refresh } = useLikePlacement();
  const [busy, setBusy] = useState(false);
  const liked = viewerLikeActive(placement, "mood", mood.id, Boolean(mood.likedByMe), ready);

  async function like() {
    if (busy) return;
    setBusy(true);
    try {
      if (liked) {
        await api("/likes", { method: "DELETE", body: JSON.stringify({ targetType: "mood", targetId: mood.id }) });
        onChanged?.({ ...mood, likedByMe: false });
      } else {
        await api("/likes", {
          method: "POST",
          body: JSON.stringify({ targetType: "mood", targetId: mood.id, confirmTransfer: true }),
        });
        onChanged?.({ ...mood, likedByMe: true });
      }
      await refresh();
    } catch (e) {
      if (!(e instanceof ApiError)) return;
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="overflow-hidden rounded-card bg-surface shadow-card" data-kind="mood">
      <Link href={`/mood?start=${mood.id}`} className="relative block aspect-[9/14] bg-ink">
        {mood.videoUrl ? (
          <video src={mood.videoUrl} muted loop playsInline autoPlay preload="metadata" className="h-full w-full object-cover" />
        ) : mood.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mood.imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full place-items-center px-6 text-center type-body text-white/80">{mood.body || mood.activity}</div>
        )}
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-black/75 to-transparent px-3 pb-3 pt-10">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Avatar src={mood.author.avatarUrl} firstName={mood.author.firstName} lastName={mood.author.lastName} size={28} />
              <p className="type-caption truncate font-semibold text-white">
                {mood.author.firstName} {mood.author.lastName}
              </p>
            </div>
            {mood.body || mood.activity ? (
              <p className="type-caption mt-1 line-clamp-2 text-white/85">{mood.activity || mood.body}</p>
            ) : null}
          </div>
          <button
            type="button"
            disabled={busy}
            aria-label={liked ? messages.social.likeHere : messages.social.likePlace}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void like();
            }}
            className={`tap-scale grid h-10 w-10 shrink-0 place-items-center rounded-full ${
              liked ? "bg-accent text-on-primary" : "bg-white/20 text-white"
            }`}
          >
            <HeartIcon size={18} filled={liked} />
          </button>
        </div>
      </Link>
    </article>
  );
}
