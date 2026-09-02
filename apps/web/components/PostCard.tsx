"use client";

import Link from "next/link";
import { useState } from "react";
import { api, ApiError, type FeedItem } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { eventCountdown, formatRelative } from "@/lib/time";
import { Avatar, CertifiedMark } from "./Avatar";
import { CalendarIcon, CommentIcon, HeartIcon, ShareIcon } from "./Icons";
import { LikeDialogs, likeErrorKind } from "./LikeDialogs";
import { LikeTimeBadge } from "./LikeTimeBadge";
import { MapThumb } from "./MapThumb";
import { IconButton, Modal } from "./ui";

export function PostCard({
  post,
  onChanged,
}: {
  post: FeedItem;
  onChanged?: (next: FeedItem) => void;
}) {
  const { messages } = useI18n();
  const { user } = useSession();
  const [transfer, setTransfer] = useState<{ name: string } | null>(null);
  const [soon, setSoon] = useState<string | null>(null);
  const [buy, setBuy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loadedAt] = useState(() => Date.now());
  const mine = user?.id === post.author.id;
  const event = post.event;
  const countdown = event ? eventCountdown(event.startsAt) : null;
  const liked = post.likeTime?.likedByMe ?? post.likedByMe ?? false;

  async function like(confirmTransfer = false) {
    try {
      if (liked) {
        await api("/likes", {
          method: "DELETE",
          body: JSON.stringify({ targetType: "post", targetId: post.id }),
        });
        const active = Math.max(0, (post.likeTime?.activeCount ?? 1) - 1);
        onChanged?.({
          ...post,
          likedByMe: false,
          likeTime: {
            totalSeconds: post.likeTime?.totalSeconds ?? 0,
            activeCount: active,
            likedByMe: false,
            label: post.likeTime?.label ?? "0 s",
          },
        });
        return;
      }
      await api("/likes", {
        method: "POST",
        body: JSON.stringify({ targetType: "post", targetId: post.id, confirmTransfer }),
      });
      onChanged?.({
        ...post,
        likedByMe: true,
        likeTime: {
          totalSeconds: post.likeTime?.totalSeconds ?? 0,
          activeCount: (post.likeTime?.activeCount ?? 0) + 1,
          likedByMe: true,
          label: post.likeTime?.label ?? "0 s",
        },
      });
      setTransfer(null);
      setBuy(false);
    } catch (e) {
      if (e instanceof ApiError) {
        const kind = likeErrorKind(String(e.code));
        if (kind === "buy") {
          setBuy(true);
          return;
        }
        if (kind === "transfer") {
          setTransfer({ name: messages.social.transferGeneric });
        }
      }
    }
  }

  async function follow() {
    if (mine) return;
    if (post.viewerFollows) {
      await api(`/users/${post.author.id}/follow`, { method: "DELETE" });
      onChanged?.({ ...post, viewerFollows: false });
    } else {
      await api(`/users/${post.author.id}/follow`, { method: "POST" });
      onChanged?.({ ...post, viewerFollows: true });
    }
  }

  async function share() {
    const url = `${window.location.origin}${event ? `/events/${event.id}` : `/posts/${post.id}`}`;
    try {
      if (navigator.share) await navigator.share({ title: "TipTop", url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      }
    } catch {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }
  }

  const relative = formatRelative(post.createdAt, messages.social);

  return (
    <article className="overflow-hidden rounded-card bg-surface p-4 shadow-card transition hover:shadow-sm">
      <div className="flex items-start gap-3">
        <Link href={`/u/${post.author.username}`}>
          <Avatar
            src={post.author.avatarUrl}
            firstName={post.author.firstName}
            lastName={post.author.lastName}
            size="md"
          />
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={`/u/${post.author.username}`} className="type-body-sm flex items-center gap-1 font-semibold text-ink">
            {post.author.firstName} {post.author.lastName}
            {post.author.certified ? <CertifiedMark /> : null}
          </Link>
          <p className="type-caption text-muted">
            {relative} · {post.city}
            {post.zone ? ` - ${post.zone}` : ""}
          </p>
        </div>
        {event?.minAge ? (
          <span className="type-caption rounded-full bg-danger-soft px-2 py-0.5 font-bold text-danger">-{event.minAge}</span>
        ) : null}
        {!mine ? (
          <button type="button" onClick={() => void follow()} className="type-caption font-semibold text-accent">
            {post.viewerFollows ? messages.social.following : messages.social.follow}
          </button>
        ) : null}
        <IconButton label={messages.social.share} onClick={() => void share()} size={36}>
          <ShareIcon size={15} />
        </IconButton>
      </div>
      <p className="type-body mt-3 text-ink">{post.body}</p>
      {post.imageUrl ? (
        <div className="relative mt-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.imageUrl} alt="" className="h-52 w-full rounded-lg object-cover" />
          {event ? (
            <Link href={`/events/${event.id}`} className="absolute bottom-2 right-2 h-16 w-24">
              <MapThumb city={post.city} zone={post.zone} className="h-full w-full" />
            </Link>
          ) : null}
        </div>
      ) : null}
      <p className="type-caption mt-3 text-muted">
        {post.commentsCount} {messages.social.comments}
        {event ? ` · ${event.reservedCount} ${messages.world.reservationsCount} · ${event.interestedCount} ${messages.world.interestedCount}` : null}
        {" · "}
        <LikeTimeBadge time={post.likeTime} loadedAt={loadedAt} />
      </p>
      <div className="mt-3 flex items-center gap-2">
        <IconButton
          label={liked ? messages.social.likeHere : messages.social.likePlace}
          tone={liked ? "accent" : "neutral"}
          onClick={() => void like(false)}
        >
          <HeartIcon size={17} filled={liked} />
        </IconButton>
        <Link
          href={`/posts/${post.id}`}
          className="tap-scale grid h-10 w-10 place-items-center rounded-full bg-surface-sunken text-muted transition hover:brightness-95"
          aria-label={messages.social.comments}
        >
          <CommentIcon size={17} />
        </Link>
        {event ? (
          <Link
            href={`/events/${event.id}`}
            className="tap-scale grid h-10 w-10 place-items-center rounded-full bg-surface-sunken text-muted transition hover:brightness-95"
            aria-label={messages.nav.events}
          >
            <CalendarIcon size={17} />
          </Link>
        ) : null}
        {countdown ? (
          <span className="type-caption ml-auto rounded-full bg-yellow px-3 py-1.5 font-bold text-ink">
            {messages.world.eventIn.replace("{when}", countdown.unit === "min" ? `${countdown.value}min` : countdown.unit === "h" ? `${countdown.value}h` : `${countdown.value}j`)}
          </span>
        ) : null}
      </div>
      {copied ? <p className="type-caption mt-2 text-accent">{messages.social.copied}</p> : null}
      <LikeDialogs
        transferName={transfer?.name ?? null}
        buyOpen={buy}
        onCloseTransfer={() => setTransfer(null)}
        onConfirmTransfer={() => void like(true)}
        onCloseBuy={() => setBuy(false)}
      />
      <Modal open={Boolean(soon)} title={messages.social.likePerson} onClose={() => setSoon(null)}>
        {soon}
      </Modal>
    </article>
  );
}
