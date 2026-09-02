"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Avatar } from "@/components/Avatar";
import { ImageIcon, MicIcon, PlusIcon } from "@/components/Icons";
import { CardSkeleton, EmptyState } from "@/components/ui";
import { api, type ConversationItem } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useRealtime } from "@/lib/realtime";

export default function Page() {
  return (
    <AppShell>
      <Inbox />
    </AppShell>
  );
}

function Inbox() {
  const { messages } = useI18n();
  const [items, setItems] = useState<ConversationItem[] | null>(null);

  async function load() {
    const data = await api<{ items: ConversationItem[] }>("/conversations");
    setItems(data.items);
  }

  useEffect(() => {
    void load().catch(() => setItems([]));
  }, []);

  useRealtime("message", () => {
    void load().catch(() => undefined);
  });
  useRealtime("presence", () => {
    void load().catch(() => undefined);
  });

  function preview(c: ConversationItem) {
    if (!c.lastMessage) return null;
    if (c.lastMessage.kind === "IMAGE")
      return (
        <span className="inline-flex items-center gap-1">
          <ImageIcon size={13} /> {messages.chat.image}
        </span>
      );
    if (c.lastMessage.kind === "AUDIO")
      return (
        <span className="inline-flex items-center gap-1">
          <MicIcon size={13} /> {messages.chat.voiceMock}
        </span>
      );
    return c.lastMessage.body;
  }

  return (
    <div className="px-4 py-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="type-h1 text-ink">{messages.chat.inbox}</h1>
        <Link
          href="/messages/new"
          aria-label={messages.chat.newTitle}
          className="tap-scale grid h-11 w-11 place-items-center rounded-full bg-accent text-on-primary shadow-sm transition hover:bg-accent-hover"
        >
          <PlusIcon size={18} />
        </Link>
      </div>
      {items === null ? (
        <div className="space-y-2">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : null}
      {items && items.length === 0 ? <EmptyState title={messages.chat.empty} body={messages.chat.emptyBody} icon={<PlusIcon size={20} />} /> : null}
      <div className="space-y-2">
        {items?.map((c) => (
          <Link
            key={c.id}
            href={`/messages/${c.id}`}
            className="tap-scale flex items-center gap-3 rounded-card bg-surface p-4 shadow-xs transition hover:shadow-sm"
          >
            <Avatar
              src={c.peer?.avatarUrl}
              firstName={c.peer?.firstName ?? c.title}
              lastName={c.peer?.lastName}
              size="lg"
              online={c.online}
            />
            <div className="min-w-0 flex-1">
              <p className="type-body-sm flex items-center font-semibold text-ink">
                <span className="truncate">{c.title}</span>
                {c.kind === "EVENT" ? <span className="type-caption ml-2 shrink-0 font-normal text-muted">{messages.chat.channel}</span> : null}
              </p>
              <p className="type-body-sm truncate text-muted">{preview(c)}</p>
            </div>
            {c.unreadCount > 0 ? (
              <span className="type-caption grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-accent px-1.5 font-bold text-on-primary">
                {c.unreadCount}
              </span>
            ) : null}
          </Link>
        ))}
      </div>
    </div>
  );
}
