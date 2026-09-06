"use client";

import Link from "next/link";
import { useState } from "react";
import { api, ApiError, type SearchEvent, type SearchPerson } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { formatEventWhen } from "@/lib/time";
import { Avatar, CertifiedMark } from "./Avatar";
import { BookEventSheet } from "./BookEventSheet";
import { EventActionRow } from "./EventActionRow";
import { EventPriceBadge } from "./EventPriceBadge";
import { LinkIcon, MoreIcon } from "./Icons";
import { OptionsSheet } from "./OptionsSheet";
import { IconButton, Modal } from "./ui";
import { recurrenceCaption } from "@/lib/event-series";
import { MapThumb } from "./MapThumb";
import { SeatsLeftBadge, seatsRemainingOf } from "./SeatsLeftBadge";

export function SearchPersonCard({ person }: { person: SearchPerson }) {
  const { messages } = useI18n();
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const name = `${person.firstName} ${person.lastName}`.trim();

  async function copyLink() {
    await navigator.clipboard.writeText(`${window.location.origin}/u/${person.username}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <article className="flex items-center gap-3 rounded-card bg-surface px-3 py-3 shadow-card">
      <Link href={`/u/${person.username}`} className="min-w-0 flex-1">
        <div className="flex items-center gap-3">
          <Avatar
            src={person.avatarUrl}
            firstName={person.firstName}
            lastName={person.lastName}
            size="md"
            online={person.available}
          />
          <div className="min-w-0 flex-1">
            <p className="type-heading flex items-center gap-1 truncate text-ink">
              {name}
              {person.certified ? <CertifiedMark /> : null}
            </p>
            <p className="type-caption truncate text-muted">{person.profession || `@${person.username}`}</p>
          </div>
        </div>
      </Link>
      <IconButton label={messages.social.moreOptions} onClick={() => setOptionsOpen(true)} size={36}>
        <MoreIcon size={16} />
      </IconButton>
      {copied ? <p className="sr-only">{messages.social.copied}</p> : null}
      <OptionsSheet
        open={optionsOpen}
        onClose={() => setOptionsOpen(false)}
        actions={[
          { key: "copy", label: messages.social.copyLink, icon: <LinkIcon size={17} />, onClick: () => void copyLink() },
          {
            key: "profile",
            label: messages.world.seeProfile,
            onClick: () => {
              window.location.href = `/u/${person.username}`;
            },
          },
        ]}
      />
    </article>
  );
}

export function SearchEventCard({
  event,
  onChanged,
}: {
  event: SearchEvent;
  onChanged?: (next: SearchEvent) => void;
}) {
  const { locale, messages } = useI18n();
  const [transfer, setTransfer] = useState<string | null>(null);
  const [bookOpen, setBookOpen] = useState(false);
  const place = [event.city, event.zone].filter(Boolean).join(", ");
  const overlayTitle = event.title.includes(event.city) ? event.title : `${event.title}${place ? ` — ${place}` : ""}`;
  const seriesLabel = recurrenceCaption(event.recurrence, messages.world);
  const interested = event.viewerInterested ?? false;
  const reserved = event.viewerReserved ?? false;

  async function heart(confirmTransfer = false) {
    try {
      if (event.viewerHearted) {
        await api(`/events/${event.id}/heart`, { method: "DELETE" });
        onChanged?.({ ...event, viewerHearted: false });
        return;
      }
      await api(`/events/${event.id}/heart`, {
        method: "POST",
        body: JSON.stringify({ confirmTransfer }),
      });
      onChanged?.({ ...event, viewerHearted: true });
      setTransfer(null);
    } catch (e) {
      if (e instanceof ApiError && String(e.code).includes("TRANSFER")) {
        const preview = await api<{ wouldTransferFrom: { title: string } | null }>(`/events/${event.id}/heart/preview`);
        setTransfer(preview.wouldTransferFrom?.title ?? "…");
      }
    }
  }

  async function toggleInterested() {
    const res = await api<{ interested: boolean }>(`/events/${event.id}/interested`, { method: "POST" });
    onChanged?.({
      ...event,
      viewerInterested: res.interested,
      interestedCount: Math.max(0, (event.interestedCount ?? 0) + (res.interested ? 1 : -1)),
    });
  }

  return (
    <article className="overflow-hidden rounded-card bg-surface shadow-card">
      <div className="relative">
        <Link href={`/events/${event.id}`} className="block">
          {event.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={event.imageUrl} alt="" className="h-52 w-full object-cover" />
          ) : (
            <div className="grid h-52 place-items-center bg-gradient-to-br from-accent/15 to-yellow/15 type-body-sm text-accent">
              {messages.world.sortie}
            </div>
          )}
        </Link>
        <div className="absolute left-2 top-2 z-[1] flex flex-wrap items-center gap-1.5">
          <SeatsLeftBadge remaining={seatsRemainingOf(event.capacity, event.reservedCount ?? event.taken, event.remaining)} />
          {seriesLabel ? (
            <span className="type-caption rounded-pill bg-accent px-2.5 py-1 font-bold text-on-primary shadow-sm">
              {seriesLabel}
            </span>
          ) : null}
        </div>
        <EventPriceBadge amount={event.priceXaf} className="absolute right-2 top-2 z-[1] rounded-lg bg-accent px-2.5 py-1 font-bold text-white shadow-sm" />
        <div className="absolute bottom-2 right-2 z-[1] h-16 w-24 overflow-hidden rounded-md ring-2 ring-white/70">
          <MapThumb city={event.city} zone={event.zone} lat={event.latitude} lng={event.longitude} className="h-full w-full" />
        </div>
        <Link
          href={`/events/${event.id}`}
          className="absolute inset-x-3 bottom-3 rounded-2xl bg-white/95 px-3 py-2.5 shadow-sm backdrop-blur-sm"
        >
          <p className="type-heading truncate text-ink">{overlayTitle}</p>
          <div className="mt-1.5 flex items-center gap-2">
            <Avatar src={event.host.avatarUrl} firstName={event.host.firstName} lastName={event.host.lastName} size="xs" />
            <p className="type-caption min-w-0 flex-1 truncate text-muted">
              {event.host.firstName} {event.host.lastName}
            </p>
            <p className="type-caption shrink-0 font-semibold" style={{ color: "#B39400" }}>
              {formatEventWhen(event.startsAt, locale)}
            </p>
          </div>
        </Link>
      </div>
      <div className="px-3 pb-3">
        <EventActionRow
          likeLabel={messages.world.heartEvent}
          liked={event.viewerHearted}
          onLike={() => void heart(false)}
          commentLabel={messages.social.comments}
          commentHref={`/events/${event.id}`}
          reserveLabel={reserved ? messages.booking.reserveOthers : messages.booking.reserve}
          onReserve={() => setBookOpen(true)}
          interestedLabel={interested ? messages.world.notInterested : messages.world.interested}
          interested={interested}
          onInterested={() => void toggleInterested()}
          startsAt={event.startsAt}
          seriesLabel={seriesLabel}
        />
      </div>
      <BookEventSheet
        open={bookOpen}
        onClose={() => setBookOpen(false)}
        onBooked={(seats) => {
          if (seats <= 0) return;
          const nextTaken = (event.reservedCount ?? event.taken) + seats;
          const currentRemaining = seatsRemainingOf(event.capacity, event.reservedCount ?? event.taken, event.remaining);
          onChanged?.({
            ...event,
            taken: nextTaken,
            reservedCount: nextTaken,
            remaining: currentRemaining != null ? Math.max(0, currentRemaining - seats) : seatsRemainingOf(event.capacity, nextTaken),
            viewerReserved: true,
          });
        }}
        preview={{
          eventId: event.id,
          title: event.title,
          body: event.title,
          startsAt: event.startsAt,
          author: {
            firstName: event.host.firstName,
            lastName: event.host.lastName,
            avatarUrl: event.host.avatarUrl,
          },
        }}
      />
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
