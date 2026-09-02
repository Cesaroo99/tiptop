"use client";

import Link from "next/link";
import { useState } from "react";
import { canInteractWithEvent, eventLifecycle } from "@tiptop/domain";
import { api, ApiError, type EventCard as EventCardType } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { eventCountdown, formatEventWhen, formatRelative } from "@/lib/time";
import { Avatar, CertifiedMark } from "./Avatar";
import { FlagIcon, HeartIcon, LinkIcon, MoreIcon, PinIcon, ShareIcon } from "./Icons";
import { MapThumb } from "./MapThumb";
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
    const res = await api<{ interested: boolean }>(`/events/${event.id}/interested`, { method: "POST" });
    onChanged?.({
      ...event,
      viewerInterested: res.interested,
      interestedCount: Math.max(0, (event.interestedCount ?? 0) + (res.interested ? 1 : -1)),
    });
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

  const price = event.priceXaf > 0 ? messages.world.paid.replace("{amount}", String(event.priceXaf)) : messages.world.free;
  const countdown = eventCountdown(event.startsAt);
  const relative = formatRelative(event.createdAt ?? event.startsAt, messages.social);
  const lifecycle = eventLifecycle(
    new Date(event.startsAt),
    event.endsAt ? new Date(event.endsAt) : null,
    new Date(),
    event.status,
  );
  const interactive = canInteractWithEvent(lifecycle.phase);

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
    ) : countdown ? (
      <span className="type-caption rounded-pill bg-yellow px-3 py-1.5 font-bold text-ink shadow-sm">
        {messages.world.eventIn.replace(
          "{when}",
          countdown.unit === "min" ? `${countdown.value}min` : countdown.unit === "h" ? `${countdown.value}h` : `${countdown.value}j`,
        )}
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
        <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2">
          <span className="type-caption rounded-pill bg-surface/90 px-3 py-1.5 font-bold text-ink backdrop-blur-sm">
            {messages.world.sortie}
          </span>
          {phaseBadge}
        </div>
        <div className="absolute bottom-2 right-2 h-16 w-24 overflow-hidden rounded-md ring-2 ring-white/70">
          <MapThumb city={event.city} zone={event.zone} className="h-full w-full" />
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
          {event.minAge ? (
            <span className="type-caption shrink-0 rounded-full bg-danger-soft px-2 py-0.5 font-bold text-danger">-{event.minAge}</span>
          ) : null}
          <IconButton label={messages.social.moreOptions} onClick={() => setOptionsOpen(true)} size={32}>
            <MoreIcon size={15} />
          </IconButton>
        </div>
        <p className="type-body-sm mt-3 inline-flex flex-wrap items-center gap-x-1.5 gap-y-1 text-ink">
          <span className="font-semibold">{formatEventWhen(event.startsAt, locale)}</span>
          <span className="text-muted">·</span>
          <span className="inline-flex items-center gap-1 text-muted">
            <PinIcon size={13} />
            {event.city}
            {event.zone ? ` - ${event.zone}` : ""}
          </span>
          <span className="text-muted">·</span>
          <span className={price === messages.world.free ? "font-semibold text-success" : "font-semibold text-ink"}>{price}</span>
        </p>
        <p className="type-caption mt-2 text-muted">
          {event.reservedCount ?? event.taken} {messages.world.reservationsCount} · {event.interestedCount ?? 0} {messages.world.interestedCount} · {event.hearts} {messages.world.heartEvent.toLowerCase()}
        </p>
        {lifecycle.phase === "cancelled" ? (
          <p className="type-body-sm mt-3 rounded-lg bg-danger-soft px-3 py-2.5 font-semibold text-danger">
            {messages.world.cancelledBody}
          </p>
        ) : null}

        <div className="mt-4 flex items-center gap-2">
          <IconButton
            label={messages.world.heartEvent}
            tone={event.viewerHearted ? "accent" : "neutral"}
            disabled={!interactive}
            onClick={() => interactive && void heart(false)}
            className={!interactive ? "opacity-40" : undefined}
          >
            <HeartIcon size={17} filled={event.viewerHearted} />
          </IconButton>
          <IconButton label={messages.social.share} onClick={() => void share()}>
            <ShareIcon size={15} />
          </IconButton>
          <div className="ml-auto flex items-center gap-2">
            {!event.isHost && !event.canBook && interactive ? (
              <button
                type="button"
                onClick={() => void interested()}
                className={`tap-scale type-button rounded-pill px-4 py-2.5 transition ${event.viewerInterested ? "bg-accent text-on-primary" : "border border-border bg-surface text-ink hover:bg-surface-sunken"}`}
              >
                {event.viewerInterested ? messages.world.notInterested : messages.world.interested}
              </button>
            ) : null}
            {event.canBook ? (
              <Link href={`/events/${event.id}/book`} className="tap-scale type-button rounded-pill bg-accent px-5 py-2.5 text-on-primary shadow-sm transition hover:bg-accent-hover">
                {messages.booking.reserve}
              </Link>
            ) : null}
            {event.viewerTicketId ? (
              <Link href={`/tickets/${event.viewerTicketId}`} className="tap-scale type-button rounded-pill border border-border bg-surface px-4 py-2.5 text-ink transition hover:bg-surface-sunken">
                {messages.booking.viewTicket}
              </Link>
            ) : null}
            {event.isHost ? (
              <Link href={`/events/${event.id}/manage`} className="tap-scale type-button rounded-pill border border-border bg-surface px-4 py-2.5 text-ink transition hover:bg-surface-sunken">
                {messages.booking.manageEvent}
              </Link>
            ) : null}
          </div>
        </div>
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
    </article>
  );
}
