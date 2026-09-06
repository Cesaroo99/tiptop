"use client";

import Link from "next/link";
import { useState } from "react";
import { canInteractWithEvent, eventLifecycle, eventSocialProof } from "@tiptop/domain";
import { AgeBadge } from "./AgeBadge";
import { api, ApiError, type EventCard as EventCardType } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { recurrenceCaption } from "@/lib/event-series";
import { formatEventWhen, formatRelative } from "@/lib/time";
import { Avatar, CertifiedMark } from "./Avatar";
import { EventActionRow } from "./EventActionRow";
import { EventPriceBadge } from "./EventPriceBadge";
import { FlagIcon, LinkIcon, MoreIcon, ShareIcon } from "./Icons";
import { BookEventSheet } from "./BookEventSheet";
import { EventPlaceLine } from "./EventPlaceLine";
import { MapThumb } from "./MapThumb";
import { SeatsLeftBadge, seatsRemainingOf } from "./SeatsLeftBadge";
import { OptionsSheet } from "./OptionsSheet";
import { ReportModal } from "./ReportModal";
import { IconButton, Modal } from "./ui";

export function EventCard({
  event,
  onChanged,
}: {
  event: EventCardType;
  onChanged?: (next: EventCardType) => void;
}) {
  const { locale, messages } = useI18n();
  const [transfer, setTransfer] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [bookOpen, setBookOpen] = useState(false);
  const [interestBusy, setInterestBusy] = useState(false);

  async function heart(confirmTransfer = false) {
    try {
      if (event.viewerHearted) {
        await api(`/events/${event.id}/heart`, { method: "DELETE" });
        onChanged?.({ ...event, viewerHearted: false, hearts: Math.max(0, event.hearts - 1) });
        return;
      }
      await api(`/events/${event.id}/heart`, {
        method: "POST",
        body: JSON.stringify({ confirmTransfer }),
      });
      onChanged?.({ ...event, viewerHearted: true, hearts: event.hearts + 1 });
      setTransfer(null);
    } catch (e) {
      if (e instanceof ApiError && String(e.code).includes("TRANSFER")) {
        const preview = await api<{ wouldTransferFrom: { title: string } | null }>(
          `/events/${event.id}/heart/preview`,
        );
        setTransfer(preview.wouldTransferFrom?.title ?? "…");
      }
    }
  }

  async function interested() {
    if (interestBusy || !canInterest) return;
    const was = Boolean(event.viewerInterested);
    const next = !was;
    setInterestBusy(true);
    onChanged?.({
      ...event,
      viewerInterested: next,
      interestedCount: Math.max(0, (event.interestedCount ?? 0) + (next ? 1 : -1)),
    });
    try {
      const res = await api<{ interested: boolean }>(`/events/${event.id}/interested`, { method: "POST" });
      onChanged?.({
        ...event,
        viewerInterested: res.interested,
        interestedCount: Math.max(0, (event.interestedCount ?? 0) + (res.interested === was ? 0 : res.interested ? 1 : -1)),
      });
    } catch {
      onChanged?.({
        ...event,
        viewerInterested: was,
        interestedCount: event.interestedCount,
      });
    } finally {
      setInterestBusy(false);
    }
  }

  async function share() {
    const url = `${window.location.origin}/events/${event.id}`;
    try {
      if (navigator.share) await navigator.share({ title: event.title, url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      }
    } catch {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(`${window.location.origin}/events/${event.id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  const relative = formatRelative(event.createdAt ?? event.startsAt, messages.social);
  const lifecycle = eventLifecycle(
    new Date(event.startsAt),
    event.endsAt ? new Date(event.endsAt) : null,
    new Date(),
    event.status,
  );
  const interactive = canInteractWithEvent(lifecycle.phase);
  const remaining = seatsRemainingOf(event.capacity, event.reservedCount ?? event.taken, event.remaining);
  const seriesLabel = recurrenceCaption(event.recurrence, messages.world);
  const eventFull = remaining != null && remaining <= 0;
  const canReserve = interactive && !event.isHost && !event.wanted && !eventFull;
  const canInterest = interactive && !event.isHost;
  const socialProof = eventSocialProof({
    friendsGoing: event.friendsGoing ?? 0,
    networkGoing: event.networkGoing ?? 0,
  });
  const socialProofLabel =
    socialProof === "friends"
      ? (event.friendsGoing ?? 0) === 1
        ? messages.world.friendsGoingOne
        : messages.world.friendsGoing.replace("{count}", String(event.friendsGoing))
      : socialProof === "network"
        ? (event.networkGoing ?? 0) === 1
          ? messages.world.networkGoingOne
          : messages.world.networkGoing.replace("{count}", String(event.networkGoing))
        : null;

  const phaseBadge =
    lifecycle.phase === "cancelled" ? (
      <span className="type-caption rounded-pill bg-danger px-3 py-1.5 font-bold text-white shadow-sm">
        {messages.world.cancelledBadge}
      </span>
    ) : lifecycle.phase === "ongoing" ? (
      <span className="type-caption inline-flex items-center gap-1 rounded-pill bg-success px-3 py-1.5 font-bold text-white shadow-sm">
        <span className="h-1.5 w-1.5 rounded-full bg-white" /> {messages.world.ongoingBadge}
      </span>
    ) : lifecycle.phase === "ended" ? (
      <span className="type-caption rounded-pill bg-black/55 px-3 py-1.5 font-bold text-white backdrop-blur-sm">
        {messages.world.endedBadge}
      </span>
    ) : lifecycle.phase === "startingSoon" ? (
      <span className="type-caption inline-flex items-center gap-1 rounded-pill bg-yellow px-3 py-1.5 font-bold text-ink shadow-sm">
        {messages.world.startingSoonBadge}
      </span>
    ) : null;

  return (
    <article className="overflow-hidden rounded-card bg-surface shadow-card transition hover:shadow-sm">
      <Link href={`/events/${event.id}`} className="relative block">
        {event.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={event.imageUrl} alt="" className="h-48 w-full object-cover" />
        ) : (
          <div className="grid h-40 place-items-center bg-gradient-to-br from-accent/15 to-yellow/15 type-body-sm text-accent">
            {messages.world.sortie}
          </div>
        )}
        <div className="absolute left-2 top-2 flex flex-col items-start gap-1.5">
          <SeatsLeftBadge remaining={remaining} />
          {seriesLabel ? (
            <span className="type-caption rounded-pill bg-accent px-3 py-1.5 font-bold text-on-primary">
              {seriesLabel}
            </span>
          ) : null}
        </div>
        <div className="absolute right-2 top-2 z-[1] flex flex-col items-end gap-1.5">
          <EventPriceBadge amount={event.priceXaf} className="rounded-lg bg-accent px-2.5 py-1 font-bold text-white shadow-sm" />
          {phaseBadge}
        </div>
        <div className="absolute bottom-2 right-2 h-16 w-24 overflow-hidden rounded-md ring-2 ring-white/70">
          <MapThumb city={event.city} zone={event.zone} lat={event.latitude} lng={event.longitude} className="h-full w-full" />
        </div>
      </Link>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <Link href={`/u/${event.host.username}`} className="shrink-0">
            <Avatar src={event.host.avatarUrl} firstName={event.host.firstName} lastName={event.host.lastName} size="sm" />
          </Link>
          <div className="min-w-0 flex-1">
            <Link href={`/events/${event.id}`} className="type-heading block truncate text-ink">
              {event.title}
            </Link>
            <p className="type-caption text-muted">
              {event.host.firstName} {event.host.lastName}
              {event.host.certified ? <CertifiedMark /> : null} · {relative}
            </p>
          </div>
          <AgeBadge minAge={event.minAge} />
          <IconButton label={messages.social.share} onClick={() => void share()} size={32}>
            <ShareIcon size={15} />
          </IconButton>
          <IconButton label={messages.social.moreOptions} onClick={() => setOptionsOpen(true)} size={32}>
            <MoreIcon size={15} />
          </IconButton>
        </div>
        <p className="type-body-sm mt-3 font-semibold text-ink">{formatEventWhen(event.startsAt, locale)}</p>
        <EventPlaceLine
          city={event.city}
          zone={event.zone}
          venue={event.venue}
          address={event.address}
          latitude={event.latitude}
          longitude={event.longitude}
        />
        {event.paymentRule === "PAY_REQUIRED" && event.priceXaf > 0 ? (
          <p className="type-caption mt-1 font-semibold text-accent">{messages.world.paymentRequired}</p>
        ) : event.paymentRule === "PAY_FIRST" && event.priceXaf > 0 ? (
          <p className="type-caption mt-1 text-muted">{messages.world.paymentFirst}</p>
        ) : null}
        <p className="type-caption mt-2 text-muted">
          {event.reservedCount ?? event.taken} {messages.world.reservationsCount}
          {" · "}
          {event.interestedCount ?? 0} {messages.world.interestedCount} · {event.hearts} {messages.world.heartEvent.toLowerCase()}
        </p>
        {socialProofLabel ? (
          <p className="type-caption mt-1.5 font-medium text-accent">{socialProofLabel}</p>
        ) : null}
        {lifecycle.phase === "cancelled" ? (
          <p className="type-body-sm mt-3 rounded-lg bg-danger-soft px-3 py-2.5 font-semibold text-danger">
            {messages.world.cancelledBody}
          </p>
        ) : null}

        <EventActionRow
          className="mt-4 flex items-center gap-2"
          likeLabel={messages.world.heartEvent}
          liked={event.viewerHearted}
          likeDisabled={!interactive}
          onLike={() => interactive && void heart(false)}
          commentLabel={messages.social.comments}
          commentHref={event.postId ? `/posts/${event.postId}` : `/events/${event.id}`}
          reserveLabel={event.viewerReserved ? messages.booking.reserveOthers : messages.booking.reserve}
          reserveDisabled={!canReserve}
          onReserve={() => setBookOpen(true)}
          interestedLabel={event.viewerInterested ? messages.world.notInterested : messages.world.interested}
          interested={event.viewerInterested}
          interestedDisabled={!canInterest || interestBusy}
          onInterested={() => void interested()}
          startsAt={event.startsAt}
          endsAt={event.endsAt}
          status={event.status}
          extras={
            <>
              {event.viewerTicketId ? (
                <Link
                  href={`/tickets/${event.viewerTicketId}`}
                  className="tap-scale type-caption rounded-pill border border-border bg-surface px-3 py-2 font-semibold text-ink transition hover:bg-surface-sunken"
                >
                  {messages.booking.viewTicket}
                </Link>
              ) : null}
              {event.isHost ? (
                <Link
                  href={`/events/${event.id}/manage`}
                  className="tap-scale type-caption rounded-pill border border-border bg-surface px-3 py-2 font-semibold text-ink transition hover:bg-surface-sunken"
                >
                  {messages.booking.manageEvent}
                </Link>
              ) : null}
            </>
          }
        />
        {copied ? <p className="type-caption mt-2 text-accent">{messages.social.copied}</p> : null}
      </div>
      <Modal
        open={Boolean(transfer)}
        title={messages.world.heartTransferTitle}
        onClose={() => setTransfer(null)}
        onConfirm={() => void heart(true)}
        confirmLabel={messages.common.confirm}
      >
        {messages.world.heartTransferBody.replace("{title}", transfer ?? "")}
      </Modal>
      <OptionsSheet
        open={optionsOpen}
        onClose={() => setOptionsOpen(false)}
        actions={[
          { key: "copy", label: messages.social.copyLink, icon: <LinkIcon size={17} />, onClick: () => void copyLink() },
          ...(event.isHost
            ? []
            : [{ key: "report", label: messages.admin.report, icon: <FlagIcon size={15} />, onClick: () => setReportOpen(true) }]),
        ]}
      />
      <ReportModal open={reportOpen} kind="EVENT" eventId={event.id} onClose={() => setReportOpen(false)} />
      <BookEventSheet
        open={bookOpen}
        onClose={() => setBookOpen(false)}
        onBooked={(seats) => {
          if (seats <= 0) return;
          const nextTaken = (event.reservedCount ?? event.taken) + seats;
          const nextRemaining = remaining != null ? Math.max(0, remaining - seats) : seatsRemainingOf(event.capacity, nextTaken);
          onChanged?.({
            ...event,
            taken: nextTaken,
            reservedCount: nextTaken,
            remaining: nextRemaining,
            viewerReserved: true,
            canBook: nextRemaining == null || nextRemaining > 0,
          });
        }}
        preview={{
          eventId: event.id,
          title: event.title,
          body: event.description ? `${event.title} : ${event.description}` : event.title,
          startsAt: event.startsAt,
          createdAt: event.createdAt,
          minAge: event.minAge,
          author: event.host,
        }}
      />
    </article>
  );
}
