"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Avatar } from "@/components/Avatar";
import { CheckIcon, ImageIcon, MessageIcon, MicIcon, PlusIcon, SearchIcon } from "@/components/Icons";
import { CardSkeleton, EmptyState, ScreenHeader } from "@/components/ui";
import { api, type ConversationItem } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useRealtime } from "@/lib/realtime";
import { useSession } from "@/lib/session";
import { formatInboxClock } from "@/lib/time";

export default function Page() {
  return (
    <AppShell chrome="nav">
      <Inbox />
    </AppShell>
  );
}

function Inbox() {
  const { locale, messages } = useI18n();
  const { user } = useSession();
  const router = useRouter();
  const [items, setItems] = useState<ConversationItem[] | null>(null);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

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

  const filtered = useMemo(() => {
    if (!items) return null;
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((c) => {
      const hay = `${c.title} ${c.lastMessage?.body ?? ""} ${c.peer?.username ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, query]);

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
          <MicIcon size={13} /> {messages.chat.voice}
        </span>
      );
    if (c.lastMessage.kind === "FILE") return messages.chat.file;
    if (c.lastMessage.kind === "STICKER") return c.lastMessage.body || messages.chat.sticker;
    if (c.lastMessage.kind === "INVITE") return messages.chat.inviteCard;
    return c.lastMessage.body;
  }

  return (
    <main className="relative mx-auto max-w-lg bg-[var(--bg)] px-4 pb-8 pt-4">
      <ScreenHeader
        title={messages.chat.inbox}
        onBack={() => router.replace("/")}
        right={
          <button
            type="button"
            aria-label={messages.chat.searchInbox}
            onClick={() => setSearchOpen((v) => !v)}
            className="tap-scale grid h-9 w-9 place-items-center rounded-full bg-surface text-muted shadow-xs"
          >
            <SearchIcon size={16} />
          </button>
        }
      />
      {searchOpen ? (
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={messages.chat.searchInbox}
          className="mb-3 h-11 w-full rounded-full bg-surface px-4 type-body-sm text-ink outline-none shadow-xs"
        />
      ) : null}
      {items === null ? (
        <div className="space-y-2">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : null}
      {filtered && filtered.length === 0 ? (
        <EmptyState title={messages.chat.empty} body={messages.chat.emptyBody} icon={<PlusIcon size={20} />} />
      ) : null}
      <div className="space-y-1">
        {filtered?.map((c) => {
          const unread = c.unreadCount > 0;
          const lastMine = Boolean(c.lastMessage && user && c.lastMessage.senderId === user.id);
          const stamp = c.lastMessage?.createdAt ?? c.updatedAt;
          return (
            <Link
              key={c.id}
              href={`/messages/${c.id}`}
              className={`tap-scale flex items-center gap-3 rounded-[22px] px-3 py-3 ${unread ? "bg-surface shadow-xs" : ""}`}
            >
              <Avatar
                src={c.kind === "DIRECT" ? c.peer?.avatarUrl : c.imageUrl}
                firstName={c.peer?.firstName ?? c.title}
                lastName={c.peer?.lastName}
                size="lg"
                presence={c.kind === "DIRECT"}
                online={c.online}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="type-body-sm truncate font-semibold text-ink">{c.title}</p>
                  <p className="type-caption shrink-0 text-muted">{formatInboxClock(stamp, locale, messages.chat.yesterday)}</p>
                </div>
                <p className="type-body-sm mt-0.5 flex items-center gap-1 truncate text-muted">
                  {lastMine ? (
                    <span className={`inline-flex ${c.lastMessageSeen ? "text-accent" : "text-muted"}`} aria-hidden>
                      <CheckIcon size={12} />
                      <CheckIcon size={12} className="-ml-1.5" />
                    </span>
                  ) : null}
                  <span className="truncate">{preview(c)}</span>
                </p>
              </div>
              {unread ? (
                <span className="type-caption grid h-6 min-w-6 shrink-0 place-items-center rounded-full bg-yellow px-1.5 font-bold text-ink">
                  {c.unreadCount}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
      <Link
        href="/messages/new"
        aria-label={messages.chat.newTitle}
        className="tap-scale fixed bottom-24 right-5 z-30 grid h-14 w-14 place-items-center rounded-full bg-accent text-on-primary shadow-elevated"
      >
        <span className="relative">
          <MessageIcon size={22} />
          <span className="absolute -right-1.5 -top-1.5 grid h-4 w-4 place-items-center rounded-full bg-on-primary text-accent">
            <PlusIcon size={10} />
          </span>
        </span>
      </Link>
    </main>
  );
}
