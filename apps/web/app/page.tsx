"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PostCard } from "@/components/PostCard";
import { Avatar } from "@/components/Avatar";
import { PlusIcon } from "@/components/Icons";
import { CardSkeleton, EmptyState, ErrorBanner } from "@/components/ui";
import { api, type FeedItem, type MoodItem } from "@/lib/api";
import { applySoleLike, releaseViewerLike, replaceFeedItem } from "@/lib/like-feed";
import { useI18n } from "@/lib/i18n";
import { useLikePlacement } from "@/lib/like-placement";
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
  const { placement, ready } = useLikePlacement();
  const [items, setItems] = useState<FeedItem[] | null>(null);
  const [moods, setMoods] = useState<MoodItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const data = await api<{ items: FeedItem[]; moods: MoodItem[] }>("/feed");
      setItems(data.items);
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

  useEffect(() => {
    if (!ready) return;
    setItems((cur) => {
      if (!cur) return cur;
      if (placement?.targetType === "post") {
        return cur.map((p) => (p.id === placement.targetId ? p : releaseViewerLike(p)));
      }
      return cur.map(releaseViewerLike);
    });
  }, [ready, placement?.targetType, placement?.targetId]);

  return (
    <div className="space-y-4 px-4 py-3">
      <section>
        <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
          <Link href="/mood/create" className="tap-scale flex w-[72px] shrink-0 flex-col items-center gap-1.5">
            <div className="grid h-[68px] w-[68px] place-items-center rounded-full bg-accent text-on-primary shadow-sm">
              <span className="grid h-[58px] w-[58px] place-items-center rounded-full border-[1.5px] border-dashed border-white/90">
                <PlusIcon size={22} />
              </span>
            </div>
            <span className="type-caption w-[72px] truncate text-center font-medium text-muted">{messages.home.yourMood}</span>
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

      {error ? <ErrorBanner message={error} onRetry={() => void load()} /> : null}
      {items === null && !error ? (
        <div className="space-y-3">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : null}
      {items && items.length === 0 && !error ? (
        <EmptyState title={messages.home.emptyTitle} body={messages.home.emptyBody} />
      ) : null}
      {items?.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onChanged={(next, meta) =>
            setItems((cur) => {
              if (!cur) return cur;
              return meta?.soleLike ? applySoleLike(cur, next) : replaceFeedItem(cur, next);
            })
          }
        />
      ))}
    </div>
  );
}
