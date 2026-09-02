"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { CalendarIcon, HeartIcon, PinIcon, PlusIcon, TicketIcon } from "@/components/Icons";
import { CardSkeleton, Chip, EmptyState, ErrorBanner } from "@/components/ui";
import { api, type EventCard as EventCardType } from "@/lib/api";
import { formatEventWhen } from "@/lib/time";
import { useI18n } from "@/lib/i18n";

/**
 * Événements = espace de GESTION, pas un deuxième fil de publications (#21-22).
 * La découverte de nouveaux événements se fait dans le fil d'accueil ; ici on
 * retrouve uniquement : ce que j'ai créé, ce à quoi je participe (réservé par
 * moi-même ou accepté sur invitation), et les raccourcis vers tout ce qui
 * tourne autour de la gestion d'événements (billets, invitations, favoris).
 */
export default function Page() {
  return (
    <AppShell>
      <EventsHub />
    </AppShell>
  );
}

function EventsHub() {
  const { messages } = useI18n();
  const [items, setItems] = useState<EventCardType[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const data = await api<{ items: EventCardType[] }>("/events?tab=mine");
      setItems(data.items);
    } catch {
      setError(messages.common.error);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hosted = items?.filter((e) => e.isHost) ?? [];
  const attending = items?.filter((e) => !e.isHost) ?? [];

  return (
    <div className="px-4 py-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="type-h1 text-ink">{messages.nav.events}</h1>
        <Link
          href="/compose?type=event"
          className="tap-scale type-button flex items-center gap-1.5 rounded-pill bg-accent px-4 py-2.5 text-on-primary shadow-sm transition hover:bg-accent-hover"
        >
          <PlusIcon size={15} />
          {messages.world.createEvent}
        </Link>
      </div>

      <div className="mb-5 grid grid-cols-3 gap-2">
        <Link href="/tickets" className="tap-scale flex flex-col items-center gap-1.5 rounded-card bg-surface p-3 text-center shadow-xs">
          <TicketIcon size={18} className="text-accent" />
          <span className="type-caption font-semibold text-ink">{messages.menu.tickets}</span>
        </Link>
        <Link href="/tickets?tab=invites" className="tap-scale flex flex-col items-center gap-1.5 rounded-card bg-surface p-3 text-center shadow-xs">
          <CalendarIcon size={18} className="text-accent" />
          <span className="type-caption font-semibold text-ink">{messages.world.eventsInvitesShortcut}</span>
        </Link>
        <Link href="/favorites" className="tap-scale flex flex-col items-center gap-1.5 rounded-card bg-surface p-3 text-center shadow-xs">
          <HeartIcon size={18} className="text-accent" />
          <span className="type-caption font-semibold text-ink">{messages.menu.favorites}</span>
        </Link>
      </div>

      {error ? <ErrorBanner message={error} onRetry={() => void load()} /> : null}
      {items === null && !error ? (
        <div className="space-y-3">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : null}

      {items && items.length === 0 ? (
        <EmptyState title={messages.world.eventsEmpty} body={messages.world.eventsManageEmptyBody} />
      ) : null}

      {hosted.length > 0 ? (
        <section className="mb-6">
          <p className="type-heading mb-3 text-ink">{messages.world.eventsCreatedTitle}</p>
          <div className="space-y-3">
            {hosted.map((e) => (
              <ManageEventCard key={e.id} event={e} />
            ))}
          </div>
        </section>
      ) : null}

      {attending.length > 0 ? (
        <section>
          <p className="type-heading mb-3 text-ink">{messages.world.eventsAttendingTitle}</p>
          <div className="space-y-3">
            {attending.map((e) => (
              <ManageEventCard key={e.id} event={e} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function statusChip(event: EventCardType, messages: ReturnType<typeof useI18n>["messages"]) {
  if (event.status === "CANCELLED") return { label: messages.world.cancelledBadge, tone: "danger" as const };
  if (event.status === "ENDED") return { label: messages.world.endedBadge, tone: "neutral" as const };
  if (event.isHost) return { label: messages.world.eventPublished, tone: "success" as const };
  if (event.viewerStatus === "CONFIRMED" || event.viewerStatus === "PRESENT") {
    return { label: messages.booking.confirmed, tone: "success" as const };
  }
  if (event.viewerStatus === "RESERVED") return { label: messages.booking.tabReserved, tone: "info" as const };
  return { label: messages.booking.tabInterested, tone: "neutral" as const };
}

function ManageEventCard({ event }: { event: EventCardType }) {
  const { locale, messages } = useI18n();
  const chip = statusChip(event, messages);
  const primaryHref = event.isHost
    ? `/events/${event.id}/manage`
    : event.viewerTicketId
      ? `/tickets/${event.viewerTicketId}`
      : `/events/${event.id}`;
  const primaryLabel = event.isHost
    ? messages.booking.manageEvent
    : event.viewerTicketId
      ? messages.booking.viewTicket
      : messages.world.seeEventFromMood;

  return (
    <div className="overflow-hidden rounded-card bg-surface shadow-card transition hover:shadow-sm">
      <Link href={`/events/${event.id}`} className="tap-scale block">
        <div className="relative">
          {event.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={event.imageUrl} alt="" className="h-32 w-full object-cover" />
          ) : (
            <div className="grid h-24 place-items-center bg-gradient-to-br from-accent/15 to-yellow/15" />
          )}
          <span className="type-caption absolute left-2 top-2 rounded-pill bg-surface/90 px-2.5 py-1 font-bold text-ink backdrop-blur-sm">
            {event.reservedCount ?? event.taken} {messages.world.reservationsCount}
          </span>
          <span className="type-caption absolute right-2 top-2 rounded-pill bg-accent px-2.5 py-1 font-bold text-on-primary">
            {event.priceXaf > 0 ? `${event.priceXaf.toLocaleString(locale)} ${event.currency}` : messages.world.free}
          </span>
        </div>
        <div className="px-3.5 pt-3.5">
          <p className="type-body-sm truncate font-semibold text-ink">{event.title}</p>
          <p className="type-caption mt-1 flex items-center gap-1 text-muted">
            <PinIcon size={11} />
            {formatEventWhen(event.startsAt, locale)} · {event.city}
          </p>
        </div>
      </Link>
      <div className="flex items-center justify-between px-3.5 pb-3.5 pt-2.5">
        <Chip tone={chip.tone}>{chip.label}</Chip>
        <Link href={primaryHref} className="type-caption font-semibold text-accent">
          {primaryLabel} →
        </Link>
      </div>
    </div>
  );
}
