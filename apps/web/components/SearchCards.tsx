"use client";

import Link from "next/link";
import { useState } from "react";
import { api, ApiError, type SearchEvent, type SearchPerson } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { formatEventWhen } from "@/lib/time";
import { Avatar, CertifiedMark } from "./Avatar";
import { CalendarPlusIcon, HeartIcon, LinkIcon, MoreIcon } from "./Icons";
import { BookEventSheet } from "./BookEventSheet";
import { InterestedBadge } from "./InterestedBadge";
import { OptionsSheet } from "./OptionsSheet";
import { IconButton, Modal } from "./ui";
import { recurrenceCaption } from "@/lib/event-series";

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
  const [interested, setInterested] = useState(Boolean(event.viewerInterested));
  const [interestedCount, setInterestedCount] = useState(event.interestedCount ?? 0);
  const place = [event.city, event.zone].filter(Boolean).join(", ");
  const overlayTitle = event.title.includes(event.city) ? event.title : `${event.title}${place ? ` — ${place}` : ""}`;
  const seriesLabel = recurrenceCaption(event.recurrence, messages.world);

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
    setInterested(res.interested);
    setInterestedCount((n) => Math.max(0, n + (res.interested ? 1 : -1)));
    onChanged?.({ ...event, viewerInterested: res.interested, interestedCount: Math.max(0, interestedCount + (res.interested ? 1 : -1)) });
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
        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          <InterestedBadge variant="stamp" active={interested} count={interestedCount} />
          {seriesLabel ? (
            <span className="type-caption rounded-pill bg-accent px-2.5 py-1 font-bold text-on-primary shadow-sm">
              {seriesLabel}
            </span>
          ) : null}
          <span className="type-caption rounded-pill bg-white/90 px-3 py-1.5 font-bold text-ink shadow-sm backdrop-blur-sm">
            {event.taken === 1
              ? messages.world.participantsCountOne
              : messages.world.participantsCount.replace("{n}", String(event.taken))}
          </span>
        </div>
        <button
          type="button"
          aria-label={messages.world.heartEvent}
          onClick={() => void heart(false)}
          className="tap-scale absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white text-accent shadow-sm"
        >
          <HeartIcon size={16} filled={event.viewerHearted} />
        </button>
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
      <div className="flex items-center gap-2 px-3 py-3">
        <InterestedBadge active={interested} count={interestedCount} onClick={() => void toggleInterested()} />
        <button
          type="button"
          aria-label={event.viewerReserved ? messages.booking.reserveOthers : messages.booking.reserve}
          onClick={() => setBookOpen(true)}
          className="tap-scale type-caption inline-flex h-10 items-center gap-1.5 rounded-pill bg-accent px-3.5 font-semibold text-on-primary shadow-sm"
        >
          <CalendarPlusIcon size={15} />
          {event.viewerReserved ? messages.booking.reserveOthers : messages.booking.reserve}
        </button>
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
      <BookEventSheet
        open={bookOpen}
        onClose={() => setBookOpen(false)}
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
    </article>
  );
}
