"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PostCard } from "@/components/PostCard";
import { EmptyState, ErrorBanner, Skeleton } from "@/components/ui";
import { api, type FeedItem } from "@/lib/api";
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
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const data = await api<{ items: FeedItem[] }>("/feed");
      setItems(data.items);
    } catch {
      setError(messages.auth.networkError);
      setItems([]);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4 px-4 py-4">
      <div className="flex gap-3 overflow-x-auto pb-2">
        <Link href="/compose" className="flex w-16 shrink-0 flex-col items-center gap-1">
          <div className="grid h-16 w-16 place-items-center rounded-full border-2 border-dashed border-accent bg-accent text-2xl text-white">
            +
          </div>
          <span className="text-center text-[11px] text-muted">{messages.home.yourMood}</span>
        </Link>
        {user ? (
          <Link href={`/u/${user.username}`} className="flex w-16 shrink-0 flex-col items-center gap-1">
            <div className="h-16 w-16 rounded-full bg-accent/20 ring-2 ring-accent" />
            <span className="truncate text-[11px] text-muted">{user.firstName}</span>
          </Link>
        ) : null}
      </div>

      {error ? <ErrorBanner message={error} onRetry={() => void load()} /> : null}
      {items === null && !error ? (
        <div className="space-y-3">
          <Skeleton className="h-64" />
          <Skeleton className="h-40" />
        </div>
      ) : null}
      {items && items.length === 0 && !error ? (
        <EmptyState title={messages.home.emptyTitle} body={messages.home.emptyBody} />
      ) : null}
      {items?.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onChanged={(next) => setItems((cur) => cur?.map((p) => (p.id === next.id ? next : p)) ?? null)}
        />
      ))}
    </div>
  );
}
