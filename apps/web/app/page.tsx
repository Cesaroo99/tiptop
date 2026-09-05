"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { EventCard } from "@/components/EventCard";
import { PostCard } from "@/components/PostCard";
import { Avatar } from "@/components/Avatar";
import { PlusIcon } from "@/components/Icons";
import { CardSkeleton, EmptyState, ErrorBanner } from "@/components/ui";
import { api, type EventCard as EventCardType, type FeedItem, type MoodItem, type PersonCard } from "@/lib/api";
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
  const [outNow, setOutNow] = useState<PersonCard[]>([]);
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
    try {
      const params = new URLSearchParams();
      params.set("city", user?.city ?? "Yaoundé");
      if (user?.zone) params.set("zone", user.zone);
      params.set("available", "1");
      const people = await api<{ items: PersonCard[] }>(`/discovery/people?${params.toString()}`);
      setOutNow(people.items.slice(0, 12));
    } catch {
      setOutNow([]);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.city, user?.zone]);

  const linked = new Set(items?.map((p) => p.event?.id).filter(Boolean));
  const extraEvents = events.filter((e) => !linked.has(e.id));

  return (
    <div className="space-y-5 px-4 py-4">
      <section>
        <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
          <Link href="/compose?type=mood" className="tap-scale flex w-[72px] shrink-0 flex-col items-center gap-1.5">
            <div className="grid h-[72px] w-[72px] place-items-center rounded-full bg-accent text-on-primary shadow-sm">
              <PlusIcon size={24} />
            </div>
            <span className="type-caption w-[72px] truncate text-center text-muted">{messages.home.yourMood}</span>
          </Link>
          {moods.map((m) => (
            <Link
              key={m.id}
              href={`/mood?start=${m.id}`}
              className="tap-scale flex w-[72px] shrink-0 flex-col items-center gap-1.5"
            >
              <span className="mood-ring relative grid h-[72px] w-[72px] place-items-center rounded-full bg-gradient-to-br from-yellow to-accent p-[3px]">
                {m.videoUrl ? (
                  <video src={m.videoUrl} muted playsInline preload="metadata" className="h-full w-full rounded-full object-cover" />
                ) : (
                  <Avatar
                    src={m.imageUrl || m.author.avatarUrl}
                    firstName={m.author.firstName}
                    lastName={m.author.lastName}
                    size={66}
                    className="overflow-hidden rounded-full"
                  />
                )}
              </span>
              <span className="type-caption w-[72px] truncate text-center text-muted">{m.author.firstName}</span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-2.5 flex items-center justify-between">
          <p className="type-heading text-ink">{messages.home.outNow}</p>
          <Link href="/people" className="type-caption font-semibold text-accent">
            {messages.home.seeAll}
          </Link>
        </div>
        {outNow.length === 0 ? (
          <Link
            href="/people"
            className="tap-scale block rounded-card bg-surface px-4 py-3.5 text-left shadow-xs"
          >
            <p className="type-body-sm text-muted">{messages.home.outNowEmpty}</p>
          </Link>
        ) : (
          <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
            {outNow.map((p) => (
              <Link
                key={p.id}
                href={p.activeMood ? `/mood?start=${p.activeMood.id}` : `/u/${p.username}`}
                className="tap-scale flex w-16 shrink-0 flex-col items-center gap-1.5"
              >
                <span className="relative">
                  <Avatar
                    src={p.avatarUrl}
                    firstName={p.firstName}
                    lastName={p.lastName}
                    size="lg"
                    ring="accent"
                  />
                  <span className="out-dot absolute bottom-0.5 right-0.5 h-2.5 w-2.5 rounded-full bg-success ring-2 ring-[var(--bg)]" />
                </span>
                <span className="type-caption w-16 truncate text-center text-muted">{p.firstName}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

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
