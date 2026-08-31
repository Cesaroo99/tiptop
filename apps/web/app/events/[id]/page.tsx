"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { EventCard } from "@/components/EventCard";
import { ErrorBanner, Skeleton } from "@/components/ui";
import { api, type EventCard as EventCardType } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

export default function Page() {
  return (
    <AppShell>
      <EventDetail />
    </AppShell>
  );
}

function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const { messages } = useI18n();
  const [event, setEvent] = useState<EventCardType | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setEvent(await api<EventCardType>(`/events/${id}`));
    } catch {
      setError(messages.common.error);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (error) return <ErrorBanner message={error} onRetry={() => void load()} />;
  if (!event) return <Skeleton className="mx-4 mt-4 h-80" />;

  return (
    <div className="space-y-4 px-4 py-4">
      <EventCard event={event} onChanged={setEvent} />
      <div
        className={`grid h-36 place-items-center rounded-2xl text-sm ${event.zone ? "bg-[var(--border)] text-muted" : "bg-accent/10 text-accent"}`}
      >
        {messages.world.approximate}
        <span className="mt-1 block text-xs">
          {event.city}
          {event.zone ? ` - ${event.zone}` : ""}
          {event.venue ? ` · ${event.venue}` : ""}
        </span>
      </div>
      <section className="rounded-card bg-surface p-4 shadow-card">
        <p className="font-semibold">{messages.world.peopleLinked}</p>
        <div className="mt-3 space-y-2">
          {event.people?.map((p) => (
            <Link key={p.id} href={`/u/${p.username}`} className="flex items-center justify-between text-sm">
              <span className="text-accent">
                {p.firstName} {p.lastName} {p.certified ? "✓" : ""}
              </span>
              <span className="text-xs text-muted">{p.status}</span>
            </Link>
          ))}
        </div>
      </section>
      {event.description ? <p className="text-sm leading-6 text-ink">{event.description}</p> : null}
      {event.isHost ? (
        <Link href={`/events/${event.id}/manage`} className="block w-full rounded-pill bg-accent py-3 text-center text-sm font-semibold text-white">
          {messages.booking.manageEvent}
        </Link>
      ) : null}
    </div>
  );
}
