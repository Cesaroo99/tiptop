"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/ui";
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
  const [items, setItems] = useState<ConversationItem[]>([]);

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
    if (!c.lastMessage) return "";
    if (c.lastMessage.kind === "IMAGE") return messages.chat.image;
    if (c.lastMessage.kind === "AUDIO") return messages.chat.voiceMock;
    return c.lastMessage.body;
  }

  return (
    <div className="px-4 py-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">{messages.chat.inbox}</h1>
        <Link href="/messages/new" className="grid h-10 w-10 place-items-center rounded-full bg-yellow text-lg font-bold text-ink">
          +
        </Link>
      </div>
      {items.length === 0 ? <EmptyState title={messages.chat.empty} body={messages.chat.emptyBody} /> : null}
      <div className="space-y-2">
        {items.map((c) => (
          <Link key={c.id} href={`/messages/${c.id}`} className="flex items-center gap-3 rounded-card bg-surface p-4 shadow-card">
            <div className="relative">
              <div className="h-12 w-12 rounded-full bg-accent/20" />
              {c.online ? <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-success ring-2 ring-surface" /> : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-ink">
                {c.title}
                {c.kind === "EVENT" ? <span className="ml-2 text-xs font-normal text-muted">{messages.chat.channel}</span> : null}
              </p>
              <p className="truncate text-sm text-muted">{preview(c)}</p>
            </div>
            {c.unreadCount > 0 ? (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-yellow px-1 text-[11px] font-bold text-ink">
                {c.unreadCount}
              </span>
            ) : null}
          </Link>
        ))}
      </div>
    </div>
  );
}
