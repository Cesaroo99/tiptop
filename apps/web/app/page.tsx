"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PostCard } from "@/components/PostCard";
import { EventCard } from "@/components/EventCard";
import { FeedMoodCard } from "@/components/FeedMoodCard";
import { AvailableInviteCard } from "@/components/AvailableInviteCard";
import { FeedPeopleDeck } from "@/components/FeedPeopleDeck";
import { Avatar } from "@/components/Avatar";
import { PlusIcon } from "@/components/Icons";
import { CardSkeleton, EmptyState, ErrorBanner } from "@/components/ui";
import { api, ApiError, type EventCard as EventCardType, type FeedItem, type MoodItem, type PersonCard } from "@/lib/api";
import { mixHomeFeed, splitFeedPeople, type MixedFeedEntry } from "@/lib/feed-mix";
import {
  captureFeedAnchor,
  leftoverFeedEntries,
  readFeedCache,
  rebuildStream,
  restoreFeedAnchor,
  writeFeedCache,
} from "@/lib/feed-session";
import {
  applyPlacementToMood,
  applyPlacementToPost,
  applySoleLike,
  applySoleMoodLike,
  releaseViewerLike,
  releaseViewerMoodLike,
  replaceFeedItem,
} from "@/lib/like-feed";
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
  const boot = useRef(typeof window !== "undefined" ? readFeedCache() : null);
  const cached = boot.current;
  const [items, setItems] = useState<FeedItem[] | null>(cached?.items ?? null);
  const [events, setEvents] = useState<EventCardType[]>(cached?.events ?? []);
  const [people, setPeople] = useState<PersonCard[]>(cached?.people ?? []);
  const [reels, setReels] = useState<MoodItem[]>(cached?.reels ?? []);
  const [moods, setMoods] = useState<MoodItem[]>(cached?.moods ?? []);
  const [stream, setStream] = useState<MixedFeedEntry[]>(cached ? rebuildStream(cached) : []);
  const [nextCursor, setNextCursor] = useState<string | null>(cached?.nextCursor ?? null);
  const [hasMore, setHasMore] = useState(cached?.hasMore ?? true);
  const [serverHasMore, setServerHasMore] = useState(cached?.hasMore ?? true);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);
  const restored = useRef(false);
  const loadMoreRef = useRef<() => Promise<void>>(async () => undefined);
  const lastContinueAt = useRef(0);

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
        ...captureFeedAnchor(),
        at: Date.now(),
      });
    },
    [],
  );

  async function loadFirst() {
    setError(null);
    try {
      const data = await api<FeedResponse>("/feed");
      const { invitees, deck } = splitFeedPeople(data.people ?? []);
      const mixed = mixHomeFeed({
        posts: data.items,
        events: data.events ?? [],
        people: deck,
        invitees,
        moods: data.reels ?? [],
      });
      setItems(data.items);
      setEvents(data.events ?? []);
      setMoods(data.moods ?? []);
      setReels(data.reels ?? []);
      setPeople(data.people ?? []);
      setStream(mixed);
      setNextCursor(data.nextCursor ?? null);
      setHasMore(true);
      setServerHasMore(Boolean(data.hasMore));
      persist({
        items: data.items,
        events: data.events ?? [],
        people: data.people ?? [],
        reels: data.reels ?? [],
        moods: data.moods ?? [],
        stream: mixed,
        nextCursor: data.nextCursor ?? null,
        hasMore: true,
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

  function appendLocalContinuation(currentStream: MixedFeedEntry[]) {
    if (Date.now() - lastContinueAt.current < 1200) return;
    lastContinueAt.current = Date.now();
    const { invitees, deck } = splitFeedPeople(people);
    const leftover = leftoverFeedEntries(currentStream, { events, people: deck, invitees, moods: reels });
    const extra = leftover;
    if (!extra.length) {
      setHasMore(false);
      return;
    }
    const nextStream = [...currentStream, ...extra];
    setStream(nextStream);
    setHasMore(true);
    persist({
      items: items ?? [],
      events,
      people,
      reels,
      moods,
      stream: nextStream,
      nextCursor,
      hasMore: true,
    });
  }

  async function loadMore() {
    if (loadingMore || !hasMore || !items?.length) return;
    setLoadingMore(true);
    try {
      if (serverHasMore) {
        const exclude = items.map((p) => p.id).join(",");
        const params = new URLSearchParams();
        if (nextCursor) params.set("cursor", nextCursor);
        if (exclude) params.set("exclude", exclude);
        const data = await api<FeedResponse>(`/feed?${params.toString()}`);
        if (data.items.length) {
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
          setServerHasMore(Boolean(data.hasMore));
          setHasMore(true);
          persist({
            items: nextItems,
            events,
            people,
            reels,
            moods,
            stream: nextStream,
            nextCursor: data.nextCursor ?? null,
            hasMore: true,
          });
          return;
        }
        setServerHasMore(false);
      }
      appendLocalContinuation(stream);
    } catch {
      setServerHasMore(false);
      appendLocalContinuation(stream);
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    if (cached) return;
    void loadFirst();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!cached || restored.current || stream.length === 0) return;
    restoreFeedAnchor(cached.scrollTop, cached.lastVisibleId);
    restored.current = true;
  }, [cached, stream.length]);

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
      return cur.map((p) => applyPlacementToPost(p, placement));
    });
    setStream((cur) => {
      let changed = false;
      const next = cur.map((row) => {
        if (row.kind === "post") {
          const post = applyPlacementToPost(row.post, placement);
          if (post === row.post) return row;
          changed = true;
          return { ...row, post };
        }
        if (row.kind === "mood") {
          const mood = applyPlacementToMood(row.mood, placement);
          if (mood === row.mood) return row;
          changed = true;
          return { ...row, mood };
        }
        return row;
      });
      return changed ? next : cur;
    });
    setPeople((cur) =>
      cur.map((p) => ({
        ...p,
        likedByMe: placement?.targetType === "user" && placement.targetId === p.id,
      })),
    );
    setReels((cur) => cur.map((m) => applyPlacementToMood(m, placement)));
  }, [ready, placement?.targetType, placement?.targetId]);

  const inviteIds = new Set(stream.filter((r) => r.kind === "invite").map((r) => r.person.id));
  const firstPersonRowId = stream.find((r) => r.kind === "person")?.id;
  const deckPeople = people.filter((p) => !inviteIds.has(p.id));

  loadMoreRef.current = () => loadMore();

  useEffect(() => {
    const node = sentinel.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) void loadMoreRef.current();
      },
      { root: document.getElementById("tiptop-scroll"), rootMargin: "800px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, stream.length]);

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
              prefetch
              className="tap-scale flex w-[72px] shrink-0 flex-col items-center gap-1.5"
            >
              <span className="grid h-[68px] w-[68px] place-items-center rounded-full bg-accent p-[3px]">
                <span className="block h-full w-full overflow-hidden rounded-full bg-surface">
                  {m.videoUrl ? (
                    <video
                      src={m.videoUrl}
                      poster={m.imageUrl ?? undefined}
                      muted
                      playsInline
                      preload="metadata"
                      className="h-full w-full bg-ink object-cover"
                    />
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
        const feedKey = row.id;
        if (row.kind === "post") {
          return (
            <div key={feedKey} data-feed-key={feedKey}>
            <PostCard
              post={row.post}
              onChanged={(next, meta) => {
                setItems((cur) => {
                  if (!cur) return cur;
                  return meta?.soleLike ? applySoleLike(cur, next) : replaceFeedItem(cur, next);
                });
                if (meta?.soleLike) setReels((cur) => cur.map(releaseViewerMoodLike));
                setStream((cur) =>
                  cur.map((entry) => {
                    if (entry.kind === "mood") {
                      return meta?.soleLike ? { ...entry, mood: releaseViewerMoodLike(entry.mood) } : entry;
                    }
                    if (entry.kind !== "post") return entry;
                    if (entry.post.id === next.id) return { ...entry, post: next };
                    return meta?.soleLike ? { ...entry, post: releaseViewerLike(entry.post) } : entry;
                  }),
                );
              }}
            />
            </div>
          );
        }
        if (row.kind === "invite") {
          return (
            <div key={feedKey} data-feed-key={feedKey}>
              <AvailableInviteCard
                person={people.find((p) => p.id === row.person.id) ?? row.person}
              />
            </div>
          );
        }
        if (row.kind === "event") {
          return (
            <div key={feedKey} data-feed-key={feedKey}>
            <EventCard
              event={row.event}
              onChanged={(next) => {
                setEvents((cur) => cur.map((e) => (e.id === next.id ? next : e)));
                setStream((cur) =>
                  cur.map((row) => (row.kind === "event" && row.event.id === next.id ? { ...row, event: next } : row)),
                );
              }}
            />
            </div>
          );
        }
        if (row.kind === "person") {
          if (row.id !== firstPersonRowId) return null;
          return (
            <div key={feedKey} data-feed-key={feedKey}>
            <FeedPeopleDeck
              people={deckPeople}
              onChanged={(next) => {
                setPeople((cur) => cur.map((p) => (p.id === next.id ? next : p)));
                setStream((cur) =>
                  cur.map((row) => (row.kind === "person" && row.person.id === next.id ? { ...row, person: next } : row)),
                );
              }}
            />
            </div>
          );
        }
        return (
          <div key={feedKey} data-feed-key={feedKey}>
          <FeedMoodCard
            mood={row.mood}
            onChanged={(next, meta) => {
              setReels((cur) => (meta?.soleLike ? applySoleMoodLike(cur, next) : cur.map((m) => (m.id === next.id ? next : m))));
              if (meta?.soleLike) setItems((cur) => cur?.map(releaseViewerLike) ?? cur);
              setStream((cur) =>
                cur.map((row) => {
                  if (row.kind === "mood") {
                    if (row.mood.id === next.id) return { ...row, mood: next };
                    return meta?.soleLike ? { ...row, mood: releaseViewerMoodLike(row.mood) } : row;
                  }
                  if (row.kind === "post" && meta?.soleLike) return { ...row, post: releaseViewerLike(row.post) };
                  return row;
                }),
              );
            }}
          />
          </div>
        );
      })}
      <div ref={sentinel} className="h-8" aria-hidden />
      {loadingMore ? <CardSkeleton /> : null}
    </div>
  );
}
