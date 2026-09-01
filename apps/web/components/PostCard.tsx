"use client";

import Link from "next/link";
import { useState } from "react";
import { api, ApiError, type FeedItem } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { eventCountdown, formatRelative } from "@/lib/time";
import { Avatar, CertifiedMark } from "./Avatar";
import { LikeDialogs, likeErrorKind } from "./LikeDialogs";
import { MapThumb } from "./MapThumb";
import { Modal } from "./ui";

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
  const mine = user?.id === post.author.id;
  const event = post.event;
  const countdown = event ? eventCountdown(event.startsAt) : null;

  async function like(confirmTransfer = false) {
    if (mine) {
      setSoon(messages.social.likeSelf);
      return;
    }
    try {
      if (post.likedAuthor) {
        await api(`/users/${post.author.id}/like`, { method: "DELETE" });
        onChanged?.({ ...post, likedAuthor: false, authorActiveLikes: Math.max(0, post.authorActiveLikes - 1) });
        return;
      }
      await api(`/users/${post.author.id}/like`, {
        method: "POST",
        body: JSON.stringify({ confirmTransfer }),
      });
      onChanged?.({ ...post, likedAuthor: true, authorActiveLikes: post.authorActiveLikes + 1 });
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
          const preview = await api<{ wouldTransferFrom: { firstName: string; lastName: string } | null }>(
            `/users/${post.author.id}/like/preview`,
          );
          const n = preview.wouldTransferFrom
            ? `${preview.wouldTransferFrom.firstName} ${preview.wouldTransferFrom.lastName}`
            : "…";
          setTransfer({ name: n });
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
    <article className="overflow-hidden rounded-card bg-surface p-4 shadow-card">
      <div className="flex items-start gap-3">
        <Link href={`/u/${post.author.username}`}>
          <Avatar
            src={post.author.avatarUrl}
            firstName={post.author.firstName}
            lastName={post.author.lastName}
            size={44}
          />
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={`/u/${post.author.username}`} className="flex items-center gap-1 font-semibold text-ink">
            {post.author.firstName} {post.author.lastName}
            {post.author.certified ? <CertifiedMark /> : null}
          </Link>
          <p className="text-xs text-muted">
            {relative} · {post.city}
            {post.zone ? ` - ${post.zone}` : ""}
          </p>
        </div>
        {event?.minAge ? (
          <span className="rounded-full bg-[#f3b6c8] px-2 py-0.5 text-[11px] font-bold text-ink">-{event.minAge}</span>
        ) : null}
        <button type="button" onClick={() => void share()} className="grid h-9 w-9 place-items-center rounded-full bg-[var(--border)] text-accent" aria-label={messages.social.share}>
          <ShareIcon />
        </button>
        {!mine ? (
          <button type="button" onClick={() => void follow()} className="text-xs font-semibold text-accent">
            {post.viewerFollows ? messages.social.following : messages.social.follow}
          </button>
        ) : null}
      </div>
      <p className="mt-3 text-sm leading-6 text-ink">{post.body}</p>
      {post.imageUrl ? (
        <div className="relative mt-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.imageUrl} alt="" className="h-52 w-full rounded-2xl object-cover" />
          {event ? (
            <Link href={`/events/${event.id}`} className="absolute bottom-2 right-2 h-16 w-24">
              <MapThumb city={post.city} zone={post.zone} className="h-full w-full" />
            </Link>
          ) : null}
        </div>
      ) : null}
      <p className="mt-3 text-xs text-muted">
        {post.commentsCount} {messages.social.comments}
        {event ? ` · ${event.reservedCount} ${messages.world.reservationsCount} · ${event.interestedCount} ${messages.world.interestedCount}` : ` · ${post.authorActiveLikes} likes`}
      </p>
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          aria-label={messages.social.likePerson}
          onClick={() => void like(false)}
          className={`grid h-10 w-10 place-items-center rounded-full ${post.likedAuthor ? "bg-accent text-white" : "bg-[var(--border)] text-muted"}`}
        >
          ♥
        </button>
        <Link
          href={`/posts/${post.id}`}
          className="grid h-10 w-10 place-items-center rounded-full bg-[var(--border)] text-muted"
          aria-label={messages.social.comments}
        >
          💬
        </Link>
        {event ? (
          <Link href={`/events/${event.id}`} className="grid h-10 w-10 place-items-center rounded-full bg-[var(--border)] text-muted" aria-label={messages.nav.events}>
            📅
          </Link>
        ) : null}
        {countdown ? (
          <span className="ml-auto rounded-full bg-yellow px-3 py-1.5 text-[11px] font-bold text-ink">
            {messages.world.eventIn.replace("{when}", countdown.unit === "min" ? `${countdown.value}min` : countdown.unit === "h" ? `${countdown.value}h` : `${countdown.value}j`)}
          </span>
        ) : null}
      </div>
      {copied ? <p className="mt-2 text-xs text-accent">{messages.social.copied}</p> : null}
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

function ShareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
      <path d="M12 16V4M8 8l4-4 4 4" />
    </svg>
  );
}
