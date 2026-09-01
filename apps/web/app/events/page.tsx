"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { EventCard } from "@/components/EventCard";
import { EmptyState, ErrorBanner, Skeleton } from "@/components/ui";
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
      <div className="mb-4 flex gap-4 text-sm">
        <button
          type="button"
          onClick={() => setTab("all")}
          className={tab === "all" ? "border-b-2 border-accent font-semibold text-accent" : "text-muted"}
        >
          {messages.world.eventsAll}
        </button>
        <button
          type="button"
          onClick={() => setTab("mine")}
          className={tab === "mine" ? "border-b-2 border-accent font-semibold text-accent" : "text-muted"}
        >
          {messages.world.eventsMine}
        </button>
        <Link href="/compose?type=event" className="ml-auto text-sm font-semibold text-accent">
          + {messages.world.createEvent}
        </Link>
      </div>
      {error ? <ErrorBanner message={error} onRetry={() => void load()} /> : null}
      {items === null && !error ? <Skeleton className="h-64" /> : null}
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
