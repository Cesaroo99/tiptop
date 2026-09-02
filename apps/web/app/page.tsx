"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { EventCard } from "@/components/EventCard";
import { PostCard } from "@/components/PostCard";
import { Avatar } from "@/components/Avatar";
import { PlusIcon } from "@/components/Icons";
import { CardSkeleton, EmptyState, ErrorBanner } from "@/components/ui";
import { api, type EventCard as EventCardType, type FeedItem, type MoodItem } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import Link from "next/link";

export default function HomePage() {
  return (
    <AppShell>
      <HomeFeed />
    </AppShell>
  );
}

function HomeFeed() {
  const { messages } = useI18n();
  const { user } = useSession();
  const [items, setItems] = useState<FeedItem[] | null>(null);
  const [events, setEvents] = useState<EventCardType[]>([]);
  const [moods, setMoods] = useState<MoodItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const data = await api<{ items: FeedItem[]; events: EventCardType[]; moods: MoodItem[] }>("/feed");
      setItems(data.items);
      setEvents(data.events ?? []);
      setMoods(data.moods ?? []);
    } catch {
      setError(messages.auth.networkError);
      setItems([]);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const linked = new Set(items?.map((p) => p.event?.id).filter(Boolean));
  const extraEvents = events.filter((e) => !linked.has(e.id));

  return (
    <div className="space-y-4 px-4 py-4">
      <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2">
        <Link href="/compose?type=mood" className="tap-scale flex w-16 shrink-0 flex-col items-center gap-1.5">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-accent text-on-primary shadow-sm">
            <PlusIcon size={22} />
          </div>
          <span className="type-caption w-16 truncate text-center text-muted">{messages.home.yourMood}</span>
        </Link>
        {user ? (
          <Link href={`/u/${user.username}`} className="tap-scale flex w-16 shrink-0 flex-col items-center gap-1.5">
            <Avatar src={user.avatarUrl} firstName={user.firstName} lastName={user.lastName} size="lg" ring="accent" />
            <span className="type-caption w-16 truncate text-center text-muted">{user.firstName}</span>
          </Link>
        ) : null}
        {moods.map((m) => (
          <Link key={m.id} href={`/mood/${m.id}`} className="tap-scale flex w-16 shrink-0 flex-col items-center gap-1.5">
            <Avatar
              src={m.imageUrl || m.author.avatarUrl}
              firstName={m.author.firstName}
              lastName={m.author.lastName}
              size="lg"
              ring="yellow"
            />
            <span className="type-caption w-16 truncate text-center text-muted">{m.author.firstName}</span>
          </Link>
        ))}
      </div>

      {error ? <ErrorBanner message={error} onRetry={() => void load()} /> : null}
      {items === null && !error ? (
        <div className="space-y-3">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : null}
      {items && items.length === 0 && events.length === 0 && !error ? (
        <EmptyState title={messages.home.emptyTitle} body={messages.home.emptyBody} />
      ) : null}
      {items?.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onChanged={(next) => setItems((cur) => cur?.map((p) => (p.id === next.id ? next : p)) ?? null)}
        />
      ))}
      {extraEvents.map((ev) => (
        <EventCard
          key={ev.id}
          event={ev}
          onChanged={(next) => setEvents((cur) => cur.map((e) => (e.id === next.id ? next : e)))}
        />
      ))}
    </div>
  );
}
