"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { EventCard } from "@/components/EventCard";
import { PlusIcon } from "@/components/Icons";
import { CardSkeleton, Chip, EmptyState, ErrorBanner } from "@/components/ui";
import { api, type EventCard as EventCardType } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";

export default function Page() {
  return (
    <AppShell>
      <EventsFeed />
    </AppShell>
  );
}

function EventsFeed() {
  const { messages } = useI18n();
  const { user } = useSession();
  const [tab, setTab] = useState<"all" | "mine">("all");
  const [items, setItems] = useState<EventCardType[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load(next = tab) {
    setError(null);
    try {
      const q = next === "all" && user?.city ? `&city=${encodeURIComponent(user.city)}` : "";
      const data = await api<{ items: EventCardType[] }>(`/events?tab=${next}${q}`);
      setItems(data.items);
    } catch {
      setError(messages.common.error);
    }
  }

  useEffect(() => {
    void load(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, user?.city]);

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
      <div className="mb-4 flex gap-2">
        <Chip active={tab === "all"} onClick={() => setTab("all")}>
          {messages.world.eventsAll}
        </Chip>
        <Chip active={tab === "mine"} onClick={() => setTab("mine")}>
          {messages.world.eventsMine}
        </Chip>
      </div>
      {error ? <ErrorBanner message={error} onRetry={() => void load()} /> : null}
      {items === null && !error ? (
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : null}
      {items && items.length === 0 ? (
        <EmptyState title={messages.world.eventsEmpty} body={messages.world.eventsEmptyBody} />
      ) : null}
      <div className="space-y-4">
        {items?.map((ev) => (
          <EventCard
            key={ev.id}
            event={ev}
            onChanged={(next) => setItems((cur) => cur?.map((e) => (e.id === next.id ? next : e)) ?? null)}
          />
        ))}
      </div>
    </div>
  );
}
