"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { EmptyState, Skeleton } from "@/components/ui";
import { api, type MoodItem } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

export default function Page() {
  return (
    <AppShell>
      <MoodRail />
    </AppShell>
  );
}

function MoodRail() {
  const { messages } = useI18n();
  const [items, setItems] = useState<MoodItem[] | null>(null);

  useEffect(() => {
    api<{ items: MoodItem[] }>("/moods")
      .then((d) => setItems(d.items))
      .catch(() => setItems([]));
  }, []);

  if (!items) return <Skeleton className="mx-4 mt-4 h-64" />;
  if (items.length === 0) {
    return (
      <EmptyState
        title={messages.world.moodEmpty}
        body={messages.world.moodEmptyBody}
        action={
          <Link href="/compose?type=mood" className="font-semibold text-accent">
            {messages.world.moodCreate}
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-3 px-4 py-4">
      <Link href="/compose?type=mood" className="block rounded-pill bg-accent py-3 text-center font-semibold text-white">
        {messages.world.moodCreate}
      </Link>
      {items.map((m) => (
        <Link key={m.id} href={`/mood/${m.id}`} className="overflow-hidden rounded-card bg-surface shadow-card">
          {m.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={m.imageUrl} alt="" className="h-40 w-full object-cover" />
          ) : null}
          <div className="p-4">
            <p className="font-semibold text-ink">
              {m.author.firstName} {m.author.lastName}
            </p>
            {m.activity ? <p className="mt-1 type-body-sm font-semibold text-accent">{m.activity}</p> : null}
            <p className="mt-1 text-sm text-ink">{m.body || messages.world.typeMood}</p>
            {m.zone ? <p className="mt-1 type-caption text-muted">📍 {m.city} - {m.zone}</p> : null}
            <p className="mt-2 text-xs text-muted">
              {m.commentsCount} {messages.social.comments}
              {m.likeTime ? ` · ${messages.likeTime.ofDuration.replace("{duration}", m.likeTime.label)}` : ` · ${messages.social.likesNow.replace("{n}", String(m.authorActiveLikes))}`}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
