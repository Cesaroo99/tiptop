"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { eventLifecycle } from "@tiptop/domain";
import { useI18n } from "@/lib/i18n";
import { formatCountdownLabel } from "@/lib/time";
import { CalendarPlusIcon, CommentIcon, HeartIcon, InterestedIcon } from "./Icons";

export function ActionCircle({
  href,
  label,
  onClick,
  active,
  disabled,
  action,
  children,
}: {
  href?: string;
  label: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  action?: string;
  children: ReactNode;
}) {
  const cls = `tap-scale grid h-10 w-10 shrink-0 place-items-center rounded-full transition hover:brightness-95 ${
    active ? "bg-accent text-on-primary shadow-sm ring-2 ring-accent/25" : "bg-surface-sunken text-muted"
  } ${disabled ? "opacity-40" : ""}`;
  if (href && !disabled) {
    return (
      <Link href={href} aria-label={label} data-action={action} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      data-action={action}
      disabled={disabled}
      onClick={onClick}
      className={cls}
    >
      {children}
    </button>
  );
}

export function EventCountdown({
  startsAt,
  endsAt,
  status,
  seriesLabel,
}: {
  startsAt: string;
  endsAt?: string | null;
  status?: string;
  seriesLabel?: string | null;
}) {
  const { messages } = useI18n();
  const lifecycle = eventLifecycle(
    new Date(startsAt),
    endsAt ? new Date(endsAt) : null,
    new Date(),
    status,
  );
  const countdown = formatCountdownLabel(startsAt);

  let badge: ReactNode = null;
  if (lifecycle.phase === "cancelled") {
    badge = (
      <span className="type-caption shrink-0 rounded-full bg-danger px-2.5 py-1 font-bold text-white">
        {messages.world.cancelledBadge}
      </span>
    );
  } else if (lifecycle.phase === "ended") {
    badge = (
      <span className="type-caption shrink-0 rounded-full bg-black/55 px-2.5 py-1 font-bold text-white">
        {messages.world.endedBadge}
      </span>
    );
  } else if (lifecycle.phase === "ongoing") {
    badge = (
      <span className="type-caption shrink-0 rounded-pill bg-success px-2.5 py-1 font-bold text-white">
        {messages.world.ongoingBadge}
      </span>
    );
  } else if (countdown) {
    badge = (
      <span className="flex min-w-0 items-center gap-1.5">
        <span className="type-caption whitespace-nowrap text-muted">{messages.world.eventInLabel}</span>
        <span className="type-caption shrink-0 rounded-full bg-yellow px-2.5 py-1 font-bold text-ink">{countdown}</span>
      </span>
    );
  }

  if (!badge && !seriesLabel) return null;

  return (
    <span data-action="countdown" className="ml-auto flex min-w-0 flex-col items-end gap-0.5">
      {seriesLabel ? <span className="type-caption font-semibold text-accent">{seriesLabel}</span> : null}
      {badge}
    </span>
  );
}

/** Ordre figé : Vie → commentaire → réserver (icône) → intéressé → compte à rebours. */
export function EventActionRow({
  likeLabel,
  liked,
  onLike,
  likeDisabled,
  commentLabel,
  commentHref,
  onComment,
  commentDisabled,
  reserveLabel,
  onReserve,
  reserveDisabled,
  interestedLabel,
  interested,
  onInterested,
  interestedDisabled,
  extras,
  startsAt,
  endsAt,
  status,
  seriesLabel,
  className = "mt-3 flex items-center gap-2",
}: {
  likeLabel: string;
  liked?: boolean;
  onLike?: () => void;
  likeDisabled?: boolean;
  commentLabel: string;
  commentHref?: string;
  onComment?: () => void;
  commentDisabled?: boolean;
  reserveLabel: string;
  onReserve?: () => void;
  reserveDisabled?: boolean;
  interestedLabel: string;
  interested?: boolean;
  onInterested?: () => void;
  interestedDisabled?: boolean;
  extras?: ReactNode;
  startsAt: string;
  endsAt?: string | null;
  status?: string;
  seriesLabel?: string | null;
  className?: string;
}) {
  return (
    <div data-testid="event-actions" className={className}>
      <ActionCircle action="like" label={likeLabel} active={liked} disabled={likeDisabled} onClick={onLike}>
        <HeartIcon size={17} filled={liked} />
      </ActionCircle>
      <ActionCircle
        action="comment"
        href={commentHref}
        label={commentLabel}
        disabled={commentDisabled}
        onClick={onComment}
      >
        <CommentIcon size={17} />
      </ActionCircle>
      <ActionCircle action="reserve" label={reserveLabel} disabled={reserveDisabled} onClick={onReserve}>
        <CalendarPlusIcon size={17} />
      </ActionCircle>
      <ActionCircle
        action="interested"
        label={interestedLabel}
        active={interested}
        disabled={interestedDisabled}
        onClick={onInterested}
      >
        <InterestedIcon size={17} />
      </ActionCircle>
      {extras}
      <EventCountdown startsAt={startsAt} endsAt={endsAt} status={status} seriesLabel={seriesLabel} />
    </div>
  );
}
