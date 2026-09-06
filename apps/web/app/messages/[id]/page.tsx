"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Avatar } from "@/components/Avatar";
import { ArrowLeftIcon, MicIcon, MoreIcon, PaperclipIcon, SendIcon, SmileIcon } from "@/components/Icons";
import { ReportModal } from "@/components/ReportModal";
import { api, ApiError, type ChatMessage, type ConversationItem } from "@/lib/api";
import { readImageForChat } from "@/lib/chat-image";
import { useI18n } from "@/lib/i18n";
import { realtimeEmit, useRealtime } from "@/lib/realtime";
import { useSession } from "@/lib/session";
import { formatBubbleClock } from "@/lib/time";

const EMOJIS = ["😀", "😍", "😂", "🔥", "👏", "❤️", "😮", "🎉", "⚡", "🙌"];

export default function Page() {
  return (
    <AppShell chrome="none">
      <Thread />
    </AppShell>
  );
}

function Thread() {
  const { id } = useParams<{ id: string }>();
  const { locale, messages } = useI18n();
  const { user } = useSession();
  const router = useRouter();
  const [conv, setConv] = useState<ConversationItem | null>(null);
  const [items, setItems] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [typingIds, setTypingIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [reportMessageId, setReportMessageId] = useState<string | null>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const typingTimers = useRef<Record<string, number>>({});

  async function load() {
    const [c, m] = await Promise.all([
      api<ConversationItem>(`/conversations/${id}`),
      api<{ items: ChatMessage[] }>(`/conversations/${id}/messages`),
    ]);
    setConv(c);
    setItems(m.items);
  }

  useEffect(() => {
    void load().catch(() => setError(messages.common.error));
    realtimeEmit("join", { conversationId: id });
    return () => realtimeEmit("leave", { conversationId: id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [items.length]);

  useRealtime("message", (raw) => {
    const p = raw as { conversationId: string; message: ChatMessage };
    if (p.conversationId !== id) return;
    setItems((prev) => (prev.some((m) => m.id === p.message.id) ? prev : [...prev, p.message]));
  });
  useRealtime("typing", (raw) => {
    const p = raw as { conversationId: string; userId: string };
    if (p.conversationId !== id || p.userId === user?.id) return;
    setTypingIds((cur) => (cur.includes(p.userId) ? cur : [...cur, p.userId]));
    window.clearTimeout(typingTimers.current[p.userId]);
    typingTimers.current[p.userId] = window.setTimeout(() => {
      setTypingIds((cur) => cur.filter((x) => x !== p.userId));
    }, 2500);
  });
  useRealtime("presence", (raw) => {
    const p = raw as { userId: string; online: boolean };
    setConv((c) => {
      if (!c) return c;
      return {
        ...c,
        online: c.peer?.id === p.userId ? p.online : c.online,
        members: c.members.map((m) => (m.id === p.userId ? { ...m, online: p.online } : m)),
        onlineCount: c.members.reduce((n, m) => n + (m.id === p.userId ? (p.online ? 1 : 0) : m.online ? 1 : 0), 0),
      };
    });
  });

  async function send(kind: "TEXT" | "IMAGE" | "AUDIO" = "TEXT", imageUrl?: string) {
    setError(null);
    try {
      const msg = await api<ChatMessage>(`/conversations/${id}/messages`, {
        method: "POST",
        body: JSON.stringify(
          kind === "TEXT"
            ? { kind, body: text }
            : kind === "IMAGE"
              ? { kind, imageUrl }
              : { kind: "AUDIO" },
        ),
      });
      setItems((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      if (kind === "TEXT") setText("");
    } catch (e) {
      setError(e instanceof ApiError && e.code === "BLOCKED" ? messages.chat.blockedPeer : messages.common.error);
    }
  }

  async function block() {
    if (!conv?.peer) return;
    await api(`/users/${conv.peer.id}/block`, { method: "POST" });
    setError(messages.chat.blocked);
    setMenuOpen(false);
  }

  function onType(value: string) {
    setText(value);
    realtimeEmit("typing", { conversationId: id });
  }

  async function onPickImage(file: File | undefined) {
    if (!file) return;
    try {
      const imageUrl = await readImageForChat(file);
      await send("IMAGE", imageUrl);
    } catch {
      setError(messages.chat.attachTooBig);
    }
  }

  const title = conv?.title ?? messages.chat.inbox;
  const subtitle =
    conv?.kind === "DIRECT"
      ? conv.online
        ? messages.chat.online
        : ""
      : conv
        ? conv.onlineCount > 0
          ? messages.chat.onlineOf.replace("{online}", String(conv.onlineCount)).replace("{total}", String(conv.members.length))
          : `${conv.members.length} ${messages.chat.members}`
        : "";
  const typingPeople = (conv?.members ?? []).filter((m) => typingIds.includes(m.id));
  const extraTyping = Math.max(0, typingPeople.length - 2);

  return (
    <main className="mx-auto flex h-full min-h-0 max-w-lg flex-col bg-[var(--bg)]">
      <header className="flex items-center gap-2 px-3 pb-2 pt-2">
        <button
          type="button"
          aria-label="Retour"
          onClick={() => router.push("/messages")}
          className="tap-scale grid h-10 w-10 place-items-center rounded-full text-ink"
        >
          <ArrowLeftIcon size={20} />
        </button>
        <Avatar
          src={conv?.kind === "DIRECT" ? conv.peer?.avatarUrl : conv?.imageUrl}
          firstName={conv?.peer?.firstName ?? conv?.title}
          lastName={conv?.peer?.lastName}
          size="md"
          presence={conv?.kind === "DIRECT"}
          online={Boolean(conv?.online)}
        />
        <div className="min-w-0 flex-1">
          <h1 className="type-body-sm truncate font-bold text-ink">{title}</h1>
          {subtitle ? <p className="type-caption truncate text-muted">{subtitle}</p> : null}
        </div>
        <button
          type="button"
          aria-label={messages.chat.menu}
          onClick={() => setMenuOpen((v) => !v)}
          className="tap-scale grid h-10 w-10 place-items-center rounded-full text-ink"
        >
          <MoreIcon size={18} />
        </button>
      </header>
      {menuOpen && conv ? (
        <div className="mx-4 mt-2 space-y-1 rounded-2xl bg-surface p-2 shadow-elevated">
          {conv.peer ? (
            <Link href={`/u/${conv.peer.username}`} className="block rounded-xl px-3 py-2 type-body-sm text-ink" onClick={() => setMenuOpen(false)}>
              {messages.chat.seeProfile}
            </Link>
          ) : null}
          {conv.eventId ? (
            <Link href={`/events/${conv.eventId}`} className="block rounded-xl px-3 py-2 type-body-sm text-ink" onClick={() => setMenuOpen(false)}>
              {messages.chat.seeEvent}
            </Link>
          ) : null}
          {conv.peer ? (
            <button type="button" className="block w-full rounded-xl px-3 py-2 text-left type-body-sm text-danger" onClick={() => void block()}>
              {messages.chat.block}
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {items.map((m) => {
          const mine = m.sender.id === user?.id;
          const member = conv?.members.find((x) => x.id === m.sender.id);
          return (
            <div key={m.id} className={`flex items-end gap-2 ${mine ? "flex-row-reverse" : ""}`}>
              <Link href={`/u/${m.sender.username}`} className="shrink-0">
                <Avatar
                  src={m.sender.avatarUrl}
                  firstName={m.sender.firstName}
                  lastName={m.sender.lastName}
                  size="sm"
                  presence
                  online={Boolean(member?.online)}
                />
              </Link>
              <div className={`max-w-[78%] ${mine ? "items-end" : ""}`}>
                {!mine ? (
                  <p className="mb-1 flex items-center gap-1.5 px-1">
                    <Link href={`/u/${m.sender.username}`} className="type-caption font-semibold text-yellow">
                      {m.sender.firstName} {m.sender.lastName}
                    </Link>
                    {member?.host ? <span className="type-caption text-muted">{messages.chat.hostBadge}</span> : null}
                  </p>
                ) : null}
                <div
                  className={`type-body-sm overflow-hidden rounded-[22px] px-3.5 py-2.5 ${
                    mine ? "rounded-br-md bg-accent text-on-primary" : "rounded-bl-md bg-surface-sunken text-ink"
                  }`}
                >
                  {m.kind === "IMAGE" && m.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.imageUrl} alt="" className="mb-1.5 max-h-48 w-full rounded-2xl object-cover" />
                  ) : null}
                  {m.kind === "AUDIO" ? (
                    <span className="inline-flex items-center gap-1.5">
                      <MicIcon size={14} />
                      {messages.chat.voiceMock}
                    </span>
                  ) : null}
                  {m.body ? <p>{m.body}</p> : null}
                  <p className={`type-caption mt-1 text-right ${mine ? "text-on-primary/70" : "text-muted"}`}>
                    {formatBubbleClock(m.createdAt, locale)}
                  </p>
                </div>
                {!mine ? (
                  <button
                    type="button"
                    className="type-caption mt-0.5 px-1 text-muted"
                    onClick={() => setReportMessageId(m.id)}
                  >
                    {messages.admin.report}
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
        {typingPeople.length ? (
          <div className="flex items-center gap-2 px-1">
            <span className="grid h-8 w-10 place-items-center rounded-2xl bg-surface-sunken type-caption text-muted">…</span>
            <div className="flex -space-x-1.5">
              {typingPeople.slice(0, 2).map((p) => (
                <Avatar key={p.id} src={p.avatarUrl} firstName={p.firstName} lastName={p.lastName} size="xs" />
              ))}
            </div>
            <p className="type-caption text-muted">
              {typingPeople.length === 1
                ? `${typingPeople[0].firstName} ${messages.chat.typing}`
                : messages.chat.typingOthers.replace("{count}", String(extraTyping || typingPeople.length - 1))}
            </p>
          </div>
        ) : null}
        <div ref={bottom} />
      </div>

      {error ? <p className="type-body-sm px-4 text-danger">{error}</p> : null}

      {conv?.kind === "EVENT" && conv.eventId ? (
        <div className="flex items-center justify-between border-t border-divider px-4 py-2">
          <Link href={`/events/${conv.eventId}`} className="type-caption font-semibold text-muted">
            {messages.chat.channel}
          </Link>
        </div>
      ) : null}

      {emojiOpen ? (
        <div className="flex flex-wrap gap-1.5 px-4 pb-2">
          {EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              className="grid h-9 w-9 place-items-center rounded-full bg-surface text-lg"
              onClick={() => {
                onType(text + e);
                setEmojiOpen(false);
              }}
            >
              {e}
            </button>
          ))}
        </div>
      ) : null}

      <form
        className="flex items-center gap-2 px-3 pb-[max(0.85rem,env(safe-area-inset-bottom))] pt-1"
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim()) void send("TEXT");
        }}
      >
        <div className="flex min-w-0 flex-1 items-center gap-1 rounded-full bg-surface px-2.5 shadow-xs">
          <button
            type="button"
            aria-label={messages.chat.emoji}
            className="grid h-9 w-9 place-items-center text-muted"
            onClick={() => setEmojiOpen((v) => !v)}
          >
            <SmileIcon size={18} />
          </button>
          <input
            value={text}
            onChange={(e) => onType(e.target.value)}
            placeholder={messages.chat.placeholder}
            className="h-11 min-w-0 flex-1 bg-transparent type-body-sm text-ink outline-none"
          />
          <button
            type="button"
            aria-label={messages.chat.attach}
            className="grid h-9 w-9 place-items-center text-muted"
            onClick={() => fileRef.current?.click()}
          >
            <PaperclipIcon size={17} />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              void onPickImage(file);
            }}
          />
        </div>
        {text.trim() ? (
          <button
            type="submit"
            aria-label={messages.chat.send}
            className="tap-scale grid h-12 w-12 shrink-0 place-items-center rounded-full bg-accent text-on-primary shadow-sm"
          >
            <SendIcon size={18} />
          </button>
        ) : (
          <button
            type="button"
            aria-label={messages.chat.voice}
            className="tap-scale grid h-12 w-12 shrink-0 place-items-center rounded-full bg-accent text-on-primary shadow-sm"
            onClick={() => void send("AUDIO")}
          >
            <MicIcon size={18} />
          </button>
        )}
      </form>
      <ReportModal
        open={Boolean(reportMessageId)}
        kind="MESSAGE"
        messageId={reportMessageId ?? undefined}
        onClose={() => setReportMessageId(null)}
      />
    </main>
  );
}
