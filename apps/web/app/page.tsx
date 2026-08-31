"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { EmptyState, ErrorBanner, Skeleton } from "@/components/ui";
import { api, type FeedItem } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";

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
        <div className="flex w-16 shrink-0 flex-col items-center gap-1">
          <div className="grid h-16 w-16 place-items-center rounded-full border-2 border-dashed border-accent bg-accent text-2xl text-white">
            +
          </div>
          <span className="text-center text-[11px] text-muted">{messages.home.yourMood}</span>
        </div>
        {user ? (
          <div className="flex w-16 shrink-0 flex-col items-center gap-1">
            <div className="h-16 w-16 rounded-full bg-accent/20 ring-2 ring-accent" />
            <span className="truncate text-[11px] text-muted">{user.firstName}</span>
          </div>
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
        <article key={post.id} className="rounded-card bg-surface p-4 shadow-card">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-accent/20" />
            <div className="flex-1">
              <p className="font-semibold text-accent">
                {post.author.firstName} {post.author.lastName}
              </p>
              <p className="text-xs text-muted">{new Date(post.createdAt).toLocaleString()}</p>
            </div>
          </div>
          <p className="mt-3 text-sm leading-6 text-ink">{post.body}</p>
          {post.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.imageUrl} alt="" className="mt-3 h-44 w-full rounded-2xl object-cover" />
          ) : null}
          <p className="mt-3 text-xs text-muted">
            {post.commentsCount} {messages.nav.home === "Home" ? "commentaires" : "comments"}
            {post.zone ? ` · ${post.city} - ${post.zone}` : ""}
          </p>
        </article>
      ))}
    </div>
  );
}
