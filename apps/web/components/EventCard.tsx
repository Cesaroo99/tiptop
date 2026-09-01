"use client";

import Link from "next/link";
import { useState } from "react";
import { api, ApiError, type EventCard as EventCardType } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { eventCountdown, formatEventWhen, formatRelative } from "@/lib/time";
import { Avatar, CertifiedMark } from "./Avatar";
import { MapThumb } from "./MapThumb";
import { Modal } from "./ui";

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

  const price = event.priceXaf > 0 ? messages.world.paid.replace("{amount}", String(event.priceXaf)) : messages.world.free;
  const countdown = eventCountdown(event.startsAt);
  const relative = formatRelative(event.createdAt ?? event.startsAt, messages.social);

  return (
    <article className="overflow-hidden rounded-card bg-surface shadow-card">
      <div className="flex items-start gap-3 p-4 pb-0">
        <Link href={`/u/${event.host.username}`}>
          <Avatar src={event.host.avatarUrl} firstName={event.host.firstName} lastName={event.host.lastName} size={44} />
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={`/u/${event.host.username}`} className="flex items-center gap-1 font-semibold text-ink">
            {event.host.firstName} {event.host.lastName}
            {event.host.certified ? <CertifiedMark /> : null}
          </Link>
          <p className="text-xs text-muted">{relative}</p>
        </div>
        {event.minAge ? <span className="rounded-full bg-[#f3b6c8] px-2 py-0.5 text-[11px] font-bold text-ink">-{event.minAge}</span> : null}
        <button type="button" onClick={() => void share()} className="grid h-9 w-9 place-items-center rounded-full bg-[var(--border)] text-accent" aria-label={messages.social.share}>
          ↗
        </button>
      </div>
      <Link href={`/events/${event.id}`} className="mt-3 block px-4">
        <span className="rounded-full bg-yellow px-2 py-0.5 text-[11px] font-bold text-ink">{messages.world.sortie}</span>
        <p className="mt-2 font-semibold text-ink">{event.title}</p>
        <p className="text-xs text-muted">
          {formatEventWhen(event.startsAt, locale)} · {event.city}
          {event.zone ? ` - ${event.zone}` : ""} · {price}
        </p>
      </Link>
      <Link href={`/events/${event.id}`} className="relative mt-3 block">
        {event.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={event.imageUrl} alt="" className="h-48 w-full object-cover" />
        ) : (
          <div className="grid h-28 place-items-center bg-accent/10 text-sm text-accent">{messages.world.sortie}</div>
        )}
        <div className="absolute bottom-2 right-2 h-16 w-24">
          <MapThumb city={event.city} zone={event.zone} className="h-full w-full" />
        </div>
      </Link>
      <div className="p-4">
        <p className="text-xs text-muted">
          {event.reservedCount ?? event.taken} {messages.world.reservationsCount} · {event.interestedCount ?? 0} {messages.world.interestedCount} · {event.hearts} ♥
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-label={messages.world.heartEvent}
            onClick={() => void heart(false)}
            className={`grid h-10 w-10 place-items-center rounded-full ${event.viewerHearted ? "bg-accent text-white" : "bg-[var(--border)] text-muted"}`}
          >
            ♥
          </button>
          {!event.isHost ? (
            <button
              type="button"
              onClick={() => void interested()}
              className={`rounded-pill px-4 py-2 text-sm font-semibold ${event.viewerInterested ? "bg-accent text-white" : "bg-[var(--border)]"}`}
            >
              {event.viewerInterested ? messages.world.notInterested : messages.world.interested}
            </button>
          ) : null}
          {event.canBook ? (
            <Link href={`/events/${event.id}/book`} className="rounded-pill bg-accent px-4 py-2 text-sm font-semibold text-white">
              {messages.booking.reserve}
            </Link>
          ) : null}
          {event.viewerTicketId ? (
            <Link href={`/tickets/${event.viewerTicketId}`} className="rounded-pill bg-[var(--border)] px-4 py-2 text-sm">
              {messages.booking.viewTicket}
            </Link>
          ) : null}
          {event.isHost ? (
            <Link href={`/events/${event.id}/manage`} className="rounded-pill bg-[var(--border)] px-4 py-2 text-sm">
              {messages.booking.manageEvent}
            </Link>
          ) : null}
          {countdown ? (
            <span className="ml-auto rounded-full bg-yellow px-3 py-1.5 text-[11px] font-bold text-ink">
              {messages.world.eventIn.replace(
                "{when}",
                countdown.unit === "min" ? `${countdown.value}min` : countdown.unit === "h" ? `${countdown.value}h` : `${countdown.value}j`,
              )}
            </span>
          ) : null}
        </div>
        {copied ? <p className="mt-2 text-xs text-accent">{messages.social.copied}</p> : null}
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
    </article>
  );
}
