"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Avatar } from "@/components/Avatar";
import { CommentIcon, PinIcon, PlusIcon } from "@/components/Icons";
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

  return (
    <div className="px-4 py-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="type-h1 text-ink">{messages.nav.mood}</h1>
        <Link
          href="/compose?type=mood"
          className="tap-scale type-button flex items-center gap-1.5 rounded-pill bg-accent px-4 py-2.5 text-on-primary shadow-sm transition hover:bg-accent-hover"
        >
          <PlusIcon size={15} />
          {messages.world.moodCreate}
        </Link>
      </div>
      {items.length === 0 ? (
        <EmptyState
          title={messages.world.moodEmpty}
          body={messages.world.moodEmptyBody}
          action={
            <Link href="/compose?type=mood" className="type-body-sm font-semibold text-accent">
              {messages.world.moodCreate}
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {items.map((m) => (
            <Link
              key={m.id}
              href={`/mood/${m.id}`}
              className="tap-scale block overflow-hidden rounded-card bg-gradient-to-br from-accent-soft/60 via-surface to-surface shadow-card transition hover:shadow-elevated"
            >
              {m.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.imageUrl} alt="" className="h-40 w-full object-cover" />
              ) : null}
              <div className="p-4">
                <div className="flex items-center gap-2.5">
                  <Avatar src={m.author.avatarUrl} firstName={m.author.firstName} lastName={m.author.lastName} size="sm" ring="accent" />
                  <p className="type-body-sm font-semibold text-ink">
                    {m.author.firstName} {m.author.lastName}
                  </p>
                </div>
                {m.activity ? (
                  <p className="type-body-sm mt-2 inline-flex rounded-lg bg-accent-soft px-2.5 py-1 font-semibold text-accent">
                    {m.activity}
                  </p>
                ) : null}
                <p className="type-body mt-2 text-ink">{m.body || messages.world.typeMood}</p>
                {m.zone ? (
                  <p className="type-caption mt-1 inline-flex items-center gap-1 text-muted">
                    <PinIcon size={12} />
                    {m.city} - {m.zone}
                  </p>
                ) : null}
                <p className="type-caption mt-2 inline-flex items-center gap-1 text-muted">
                  <CommentIcon size={13} />
                  {m.commentsCount} {messages.social.comments}
                  {m.likeTime ? ` · ${messages.likeTime.ofDuration.replace("{duration}", m.likeTime.label)}` : ` · ${messages.social.likesNow.replace("{n}", String(m.authorActiveLikes))}`}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
