"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PostCard } from "@/components/PostCard";
import { EventCard } from "@/components/EventCard";
import { FeedMoodCard } from "@/components/FeedMoodCard";
import { FeedPersonCard } from "@/components/FeedPersonCard";
import { Avatar } from "@/components/Avatar";
import { PlusIcon } from "@/components/Icons";
import { CardSkeleton, EmptyState, ErrorBanner } from "@/components/ui";
import { api, ApiError, type EventCard as EventCardType, type FeedItem, type MoodItem, type PersonCard } from "@/lib/api";
import { mixHomeFeed, type MixedFeedEntry } from "@/lib/feed-mix";
import {
  captureFeedScroll,
  readFeedCache,
  rebuildStream,
  restoreFeedScroll,
  writeFeedCache,
} from "@/lib/feed-session";
import { applySoleLike, releaseViewerLike, replaceFeedItem } from "@/lib/like-feed";
import { useI18n } from "@/lib/i18n";
import { useLikePlacement } from "@/lib/like-placement";
import Link from "next/link";

type FeedResponse = {
  items: FeedItem[];
  events?: EventCardType[];
  moods: MoodItem[];
  reels?: MoodItem[];
  people?: PersonCard[];
  nextCursor?: string | null;
  hasMore?: boolean;
};

export default function HomePage() {
  return (
    <AppShell>
      <HomeFeed />
    </AppShell>
  );
}

function HomeFeed() {
  const { messages } = useI18n();
  const { placement, ready } = useLikePlacement();
  const cached = typeof window !== "undefined" ? readFeedCache() : null;
  const [items, setItems] = useState<FeedItem[] | null>(cached?.items ?? null);
  const [events, setEvents] = useState<EventCardType[]>(cached?.events ?? []);
  const [people, setPeople] = useState<PersonCard[]>(cached?.people ?? []);
  const [reels, setReels] = useState<MoodItem[]>(cached?.reels ?? []);
  const [moods, setMoods] = useState<MoodItem[]>(cached?.moods ?? []);
  const [stream, setStream] = useState<MixedFeedEntry[]>(cached ? rebuildStream(cached) : []);
  const [nextCursor, setNextCursor] = useState<string | null>(cached?.nextCursor ?? null);
  const [hasMore, setHasMore] = useState(cached?.hasMore ?? true);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);
  const restored = useRef(Boolean(cached));

  const persist = useCallback(
    (next: {
      items: FeedItem[];
      events: EventCardType[];
      people: PersonCard[];
      reels: MoodItem[];
      moods: MoodItem[];
      stream: MixedFeedEntry[];
      nextCursor: string | null;
      hasMore: boolean;
    }) => {
      writeFeedCache({
        items: next.items,
        events: next.events,
        people: next.people,
        reels: next.reels,
        moods: next.moods,
        order: next.stream.map((row) => ({ kind: row.kind, id: row.id })),
        nextCursor: next.nextCursor,
        hasMore: next.hasMore,
        scrollTop: captureFeedScroll(),
        at: Date.now(),
      });
    },
    [],
  );

  async function loadFirst() {
    setError(null);
    try {
      const data = await api<FeedResponse>("/feed");
      const mixed = mixHomeFeed({
        posts: data.items,
        events: data.events ?? [],
        people: data.people ?? [],
        moods: data.reels ?? [],
      });
      setItems(data.items);
      setEvents(data.events ?? []);
      setMoods(data.moods ?? []);
      setReels(data.reels ?? []);
      setPeople(data.people ?? []);
      setStream(mixed);
      setNextCursor(data.nextCursor ?? null);
      setHasMore(Boolean(data.hasMore));
      persist({
        items: data.items,
        events: data.events ?? [],
        people: data.people ?? [],
        reels: data.reels ?? [],
        moods: data.moods ?? [],
        stream: mixed,
        nextCursor: data.nextCursor ?? null,
        hasMore: Boolean(data.hasMore),
      });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError(messages.auth.connect);
      } else if (err instanceof ApiError && err.status >= 500) {
        setError(messages.common.error);
      } else {
        setError(messages.auth.networkError);
      }
      if (!items) setItems([]);
    }
  }

  async function loadMore() {
    if (loadingMore || !hasMore || !items?.length) return;
    setLoadingMore(true);
    try {
      const exclude = items.map((p) => p.id).join(",");
      const params = new URLSearchParams();
      if (nextCursor) params.set("cursor", nextCursor);
      if (exclude) params.set("exclude", exclude);
      const data = await api<FeedResponse>(`/feed?${params.toString()}`);
      if (!data.items.length) {
        setHasMore(false);
        return;
      }
      const extra = mixHomeFeed({
        posts: data.items,
        events: [],
        people: [],
        moods: [],
      });
      const nextItems = [...items, ...data.items.filter((p) => !items.some((cur) => cur.id === p.id))];
      const nextStream = [...stream, ...extra];
      setItems(nextItems);
      setStream(nextStream);
      setNextCursor(data.nextCursor ?? null);
      setHasMore(Boolean(data.hasMore));
      persist({
        items: nextItems,
        events,
        people,
        reels,
        moods,
        stream: nextStream,
        nextCursor: data.nextCursor ?? null,
        hasMore: Boolean(data.hasMore),
      });
    } catch {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    if (cached) {
      restoreFeedScroll(cached.scrollTop);
      return;
    }
    void loadFirst();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!restored.current) return;
    restoreFeedScroll(cached?.scrollTop ?? captureFeedScroll());
  }, [cached?.scrollTop, stream.length]);

  useEffect(() => {
    function save() {
      if (!items) return;
      persist({ items, events, people, reels, moods, stream, nextCursor, hasMore });
    }
    window.addEventListener("pagehide", save);
    return () => {
      save();
      window.removeEventListener("pagehide", save);
    };
  }, [items, events, people, reels, moods, stream, nextCursor, hasMore, persist]);

  useEffect(() => {
    if (!ready) return;
    setItems((cur) => {
      if (!cur) return cur;
      if (placement?.targetType === "post") {
        return cur.map((p) => (p.id === placement.targetId ? p : releaseViewerLike(p)));
      }
      return cur.map(releaseViewerLike);
    });
    setStream((cur) =>
      cur.map((row) => {
        if (row.kind !== "post") return row;
        const post =
          placement?.targetType === "post" && row.post.id === placement.targetId
            ? row.post
            : releaseViewerLike(row.post);
        return { ...row, post };
      }),
    );
    setPeople((cur) =>
      cur.map((p) => ({
        ...p,
        likedByMe: placement?.targetType === "user" && placement.targetId === p.id,
      })),
    );
    setReels((cur) =>
      cur.map((m) => ({
        ...m,
        likedByMe: placement?.targetType === "mood" && placement.targetId === m.id,
      })),
    );
  }, [ready, placement?.targetType, placement?.targetId]);

  useEffect(() => {
    const node = sentinel.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) void loadMore();
      },
      { root: document.getElementById("tiptop-scroll"), rootMargin: "600px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  });

  return (
    <div className="space-y-4 px-4 py-3">
      <section>
        <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
          <Link href="/status/create" className="tap-scale flex w-[72px] shrink-0 flex-col items-center gap-1.5">
            <div className="grid h-[68px] w-[68px] place-items-center rounded-full bg-accent text-on-primary shadow-sm">
              <span className="grid h-[58px] w-[58px] place-items-center rounded-full border-[1.5px] border-dashed border-white/90">
                <PlusIcon size={22} />
              </span>
            </div>
            <span className="type-caption w-[72px] truncate text-center font-medium text-muted">{messages.home.yourStatus}</span>
          </Link>
          {moods.map((m) => (
            <Link
              key={m.id}
              href={`/mood?start=${m.id}`}
              className="tap-scale flex w-[72px] shrink-0 flex-col items-center gap-1.5"
            >
              <span className="grid h-[68px] w-[68px] place-items-center rounded-full bg-accent p-[3px]">
                <span className="block h-full w-full overflow-hidden rounded-full bg-surface">
                  {m.videoUrl ? (
                    <video src={m.videoUrl} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                  ) : (
                    <Avatar
                      src={m.imageUrl || m.author.avatarUrl}
                      firstName={m.author.firstName}
                      lastName={m.author.lastName}
                      size={62}
                    />
                  )}
                </span>
              </span>
              <span className="type-caption w-[72px] truncate text-center font-medium text-muted">
                {m.author.firstName} {m.author.lastName}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {error ? <ErrorBanner message={error} onRetry={() => void loadFirst()} /> : null}
      {items === null && !error ? (
        <div className="space-y-3">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : null}
      {items && stream.length === 0 && !error ? (
        <EmptyState title={messages.home.emptyTitle} body={messages.home.emptyBody} />
      ) : null}
      {stream.map((row) => {
        if (row.kind === "post") {
          return (
            <PostCard
              key={row.id}
              post={row.post}
              onChanged={(next, meta) => {
                setItems((cur) => {
                  if (!cur) return cur;
                  return meta?.soleLike ? applySoleLike(cur, next) : replaceFeedItem(cur, next);
                });
                setStream((cur) =>
                  cur.map((row) => (row.kind === "post" && row.post.id === next.id ? { ...row, post: next } : row)),
                );
              }}
            />
          );
        }
        if (row.kind === "event") {
          return (
            <EventCard
              key={row.id}
              event={row.event}
              onChanged={(next) => {
                setEvents((cur) => cur.map((e) => (e.id === next.id ? next : e)));
                setStream((cur) =>
                  cur.map((row) => (row.kind === "event" && row.event.id === next.id ? { ...row, event: next } : row)),
                );
              }}
            />
          );
        }
        if (row.kind === "person") {
          return (
            <FeedPersonCard
              key={row.id}
              person={row.person}
              onChanged={(next) => {
                setPeople((cur) => cur.map((p) => (p.id === next.id ? next : p)));
                setStream((cur) =>
                  cur.map((row) => (row.kind === "person" && row.person.id === next.id ? { ...row, person: next } : row)),
                );
              }}
            />
          );
        }
        return (
          <FeedMoodCard
            key={row.id}
            mood={row.mood}
            onChanged={(next) => {
              setReels((cur) => cur.map((m) => (m.id === next.id ? next : m)));
              setStream((cur) =>
                cur.map((row) => (row.kind === "mood" && row.mood.id === next.id ? { ...row, mood: next } : row)),
              );
            }}
          />
        );
      })}
      <div ref={sentinel} className="h-8" aria-hidden />
      {loadingMore ? <CardSkeleton /> : null}
    </div>
  );
}
