"use client";

import Link from "next/link";
import { useState } from "react";
import { api, ApiError, type FeedItem } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { viewerLikeActive } from "@/lib/like-feed";
import { useLikePlacement } from "@/lib/like-placement";
import { recurrenceCaption } from "@/lib/event-series";
import { formatCompactCount, formatCountdownLabel, formatRelative, splitPostLead } from "@/lib/time";
import { ageCategoryLabel } from "@tiptop/domain";
import { Avatar, CertifiedMark } from "./Avatar";
import {
  CalendarPlusIcon,
  CommentIcon,
  FlagIcon,
  GlobeIcon,
  HeartIcon,
  LinkIcon,
  MoreIcon,
  ShareIcon,
  SlashIcon,
  TrashIcon,
} from "./Icons";
import { BookEventSheet } from "./BookEventSheet";
import { InterestedBadge } from "./InterestedBadge";
import { LikeDialogs, likeErrorKind } from "./LikeDialogs";
import { MapThumb } from "./MapThumb";
import { SeatsLeftBadge, seatsLeftLabel, seatsRemainingOf } from "./SeatsLeftBadge";
import { OptionsSheet } from "./OptionsSheet";
import { ReportModal } from "./ReportModal";
import { IconButton, Modal } from "./ui";

function ActionCircle({
  href,
  label,
  onClick,
  active,
  children,
}: {
  href?: string;
  label: string;
  onClick?: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  const cls = `tap-scale grid h-10 w-10 shrink-0 place-items-center rounded-full transition hover:brightness-95 ${
    active ? "bg-accent text-on-primary" : "bg-surface-sunken text-muted"
  }`;
  if (href) {
    return (
      <Link href={href} aria-label={label} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" aria-label={label} onClick={onClick} className={cls}>
      {children}
    </button>
  );
}

export function PostCard({
  post,
  onChanged,
}: {
  post: FeedItem;
  onChanged?: (next: FeedItem, meta?: { soleLike?: boolean }) => void;
}) {
  const { messages } = useI18n();
  const { user } = useSession();
  const { placement, ready, refresh: refreshPlacement } = useLikePlacement();
  const [transfer, setTransfer] = useState<{ name: string } | null>(null);
  const [soon, setSoon] = useState<string | null>(null);
  const [buy, setBuy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shares, setShares] = useState(post.sharesCount ?? 0);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleted, setDeleted] = useState(false);
  const [bookOpen, setBookOpen] = useState(false);
  const mine = user?.id === post.author.id;
  const event = post.event ?? null;
  const isEvent = Boolean(event);
  const countdown = event ? formatCountdownLabel(event.startsAt) : null;
  const liked = viewerLikeActive(
    placement,
    "post",
    post.id,
    post.likeTime?.likedByMe ?? post.likedByMe ?? false,
    ready,
  );
  const interested = event?.viewerInterested ?? false;
  const remaining = event ? seatsRemainingOf(event.capacity, event.reservedCount, event.remaining) : null;
  const eventFull = remaining != null && remaining <= 0;
  const reserved = Boolean(event?.viewerReserved);
  const seriesLabel = recurrenceCaption(event?.recurrence, messages.world);
  const { lead, rest } = splitPostLead(post.body);
  const age = isEvent ? ageCategoryLabel(event?.minAge) : null;
  const mapCity = event?.city ?? post.city;
  const mapZone = event?.zone ?? post.zone;

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
        await refreshPlacement();
        return;
      }
      await api("/likes", {
        method: "POST",
        body: JSON.stringify({ targetType: "post", targetId: post.id, confirmTransfer }),
      });
      onChanged?.(
        {
          ...post,
          likedByMe: true,
          likeTime: {
            totalSeconds: post.likeTime?.likedByMe ? (post.likeTime.totalSeconds ?? 0) : (post.likeTime?.totalSeconds ?? 0),
            activeCount: (post.likeTime?.likedByMe ? post.likeTime.activeCount : (post.likeTime?.activeCount ?? 0) + 1),
            likedByMe: true,
            label: "0 s",
          },
        },
        { soleLike: true },
      );
      await refreshPlacement();
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

  function shareTarget() {
    return `${window.location.origin}${isEvent && event ? `/events/${event.id}` : `/posts/${post.id}`}`;
  }

  async function share() {
    const url = shareTarget();
    try {
      if (navigator.share) await navigator.share({ title: "TipTop", url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      }
      setShares((n) => n + 1);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
      setShares((n) => n + 1);
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(shareTarget());
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  async function blockAuthor() {
    await api(`/users/${post.author.id}/block`, { method: "POST" });
  }

  async function deletePost() {
    try {
      await api(`/posts/${post.id}`, { method: "DELETE" });
      setDeleted(true);
      setDeleteOpen(false);
    } catch (e) {
      setDeleteError(
        e instanceof ApiError && e.code === "POST_LINKED_TO_EVENT"
          ? messages.social.deletePostLinkedToEvent
          : messages.common.error,
      );
    }
  }

  async function toggleInterested() {
    if (!event) return;
    const res = await api<{ interested: boolean }>(`/events/${event.id}/interested`, { method: "POST" });
    onChanged?.({
      ...post,
      event: {
        ...event,
        viewerInterested: res.interested,
        interestedCount: Math.max(0, event.interestedCount + (res.interested ? 1 : -1)),
      },
    });
  }

  const relative = formatRelative(post.createdAt, messages.social);
  const stats = [
    `${formatCompactCount(post.commentsCount)} ${messages.social.comments}`,
    `${formatCompactCount(shares)} ${messages.social.shares}`,
    isEvent && event ? `${formatCompactCount(event.reservedCount)} ${messages.world.reservationsCount}` : null,
    isEvent && event ? seatsLeftLabel(remaining, messages.world) : null,
    isEvent && event ? `${formatCompactCount(event.interestedCount)} ${messages.world.interestedCount}` : null,
  ].filter(Boolean);

  return (
    <article
      data-kind={isEvent ? "event" : "post"}
      className="overflow-hidden rounded-card bg-surface px-3.5 py-3.5 shadow-card"
    >
      <div className="flex items-start gap-2.5">
        <Link href={`/u/${post.author.username}`} className="shrink-0">
          <Avatar
            src={post.author.avatarUrl}
            firstName={post.author.firstName}
            lastName={post.author.lastName}
            size="md"
            online={post.author.available}
          />
        </Link>
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex items-center gap-1.5">
            <Link href={`/u/${post.author.username}`} className="type-body-sm truncate font-bold text-ink">
              {post.author.firstName} {post.author.lastName}
            </Link>
            {post.author.certified ? <CertifiedMark /> : null}
            {age ? (
              <span className="type-caption shrink-0 rounded-full bg-danger px-2 py-0.5 font-bold leading-none text-white">
                {age}
              </span>
            ) : null}
          </div>
          <p className="type-caption mt-0.5 flex items-center gap-1 text-muted">
            <GlobeIcon size={12} />
            <span>{relative}</span>
          </p>
        </div>
        <button
          type="button"
          aria-label={messages.social.share}
          onClick={() => void share()}
          className="tap-scale mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent-soft text-accent transition hover:brightness-95"
        >
          <ShareIcon size={15} />
        </button>
        <IconButton label={messages.social.moreOptions} onClick={() => setOptionsOpen(true)} size={36} className="mt-0.5">
          <MoreIcon size={16} />
        </IconButton>
      </div>
      {deleted ? (
        <p className="type-body-sm mt-3 text-muted">{messages.social.postDeleted}</p>
      ) : (
        <>
          <p className="type-body-sm mt-3 text-ink">
            {lead ? (
              <>
                <span className="font-bold">{lead}</span>
                {rest ? ` ${rest}` : null}
              </>
            ) : (
              post.body
            )}
          </p>
          {post.imageUrl || isEvent ? (
            <div className="relative mt-3">
              {post.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.imageUrl} alt="" className="h-56 w-full rounded-xl object-cover" />
              ) : (
                <div className="grid h-40 w-full place-items-center rounded-xl bg-gradient-to-br from-accent/15 to-yellow/20 type-body-sm text-accent">
                  {event?.title ?? messages.world.sortie}
                </div>
              )}
              {isEvent && event ? (
                <>
                  <div className="absolute left-2 top-2 flex flex-col items-start gap-1.5">
                    <InterestedBadge
                      variant="stamp"
                      active={interested}
                      count={event.interestedCount}
                    />
                    <SeatsLeftBadge remaining={remaining} />
                  </div>
                  <Link
                    href={`/events/${event.id}`}
                    aria-label={messages.world.sortie}
                    className="absolute bottom-2 right-2 h-[4.25rem] w-[6.25rem]"
                  >
                    <MapThumb city={mapCity} zone={mapZone} className="h-full w-full" />
                  </Link>
                </>
              ) : null}
            </div>
          ) : null}
          <p className="type-caption mt-3 text-muted">{stats.join(" . ")}</p>
          <div className="mt-3 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <ActionCircle
                label={liked ? messages.social.likeHere : messages.social.likePlace}
                active={liked}
                onClick={() => void like(false)}
              >
                <HeartIcon size={17} filled={liked} />
              </ActionCircle>
              <ActionCircle href={`/posts/${post.id}`} label={messages.social.comments}>
                <CommentIcon size={17} />
              </ActionCircle>
              {isEvent && event && !mine ? (
                <>
                  <InterestedBadge
                    active={interested}
                    count={event.interestedCount}
                    onClick={() => void toggleInterested()}
                  />
                  <button
                    type="button"
                    aria-label={reserved ? messages.booking.reserveOthers : messages.booking.reserve}
                    disabled={eventFull}
                    onClick={() => setBookOpen(true)}
                    className="tap-scale type-caption inline-flex h-10 items-center gap-1.5 rounded-pill bg-accent px-3.5 font-semibold text-on-primary shadow-sm disabled:opacity-40"
                  >
                    <CalendarPlusIcon size={15} />
                    {reserved ? messages.booking.reserveOthers : messages.booking.reserve}
                  </button>
                  {eventFull ? (
                    <span className="type-caption rounded-pill bg-danger-soft px-2.5 py-2 font-bold text-danger">
                      {messages.world.seatsFull}
                    </span>
                  ) : null}
                </>
              ) : null}
            </div>
            {isEvent && (countdown || seriesLabel) ? (
              <div className="flex flex-wrap items-center justify-end gap-1.5">
                {seriesLabel ? <span className="type-caption font-semibold text-accent">{seriesLabel}</span> : null}
                {countdown ? (
                  <span className="flex items-center gap-1.5">
                    <span className="type-caption whitespace-nowrap text-muted">{messages.world.eventInLabel}</span>
                    <span className="type-caption shrink-0 rounded-full bg-yellow px-2.5 py-1 font-bold text-ink">{countdown}</span>
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
          {copied ? <p className="type-caption mt-2 text-accent">{messages.social.copied}</p> : null}
        </>
      )}
      <LikeDialogs
        transferName={transfer?.name ?? null}
        buyOpen={buy}
        onCloseTransfer={() => setTransfer(null)}
        onConfirmTransfer={() => void like(true)}
        onCloseBuy={() => setBuy(false)}
      />
      <BookEventSheet
        open={bookOpen}
        onClose={() => setBookOpen(false)}
        onBooked={(seats) => {
          if (!event || seats <= 0) return;
          const nextTaken = event.reservedCount + seats;
          const nextRemaining = remaining != null ? Math.max(0, remaining - seats) : seatsRemainingOf(event.capacity, nextTaken);
          onChanged?.({
            ...post,
            event: {
              ...event,
              reservedCount: nextTaken,
              remaining: nextRemaining,
              viewerReserved: true,
              canBook: nextRemaining == null || nextRemaining > 0,
            },
          });
        }}
        preview={
          event
            ? {
                eventId: event.id,
                title: event.title,
                body: post.body,
                startsAt: event.startsAt,
                createdAt: post.createdAt,
                minAge: event.minAge,
                author: post.author,
              }
            : null
        }
      />
      <Modal open={Boolean(soon)} title={messages.social.likePerson} onClose={() => setSoon(null)}>
        {soon}
      </Modal>
      <OptionsSheet
        open={optionsOpen}
        onClose={() => setOptionsOpen(false)}
        actions={
          mine
            ? [{ key: "delete", label: messages.social.deletePost, icon: <TrashIcon size={17} />, onClick: () => setDeleteOpen(true), danger: true }]
            : [
                { key: "copy", label: messages.social.copyLink, icon: <LinkIcon size={17} />, onClick: () => void copyLink() },
                { key: "report", label: messages.admin.report, icon: <FlagIcon size={15} />, onClick: () => setReportOpen(true) },
                { key: "block", label: messages.social.blockUser, icon: <SlashIcon size={16} />, onClick: () => void blockAuthor(), danger: true },
              ]
        }
      />
      <ReportModal open={reportOpen} kind="POST" postId={post.id} onClose={() => setReportOpen(false)} />
      <Modal
        open={deleteOpen}
        title={messages.social.deletePost}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => void deletePost()}
        confirmLabel={messages.common.confirm}
        danger
      >
        {deleteError ?? messages.social.deletePostConfirm}
      </Modal>
    </article>
  );
}
