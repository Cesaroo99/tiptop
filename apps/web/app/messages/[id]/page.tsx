"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ImageIcon, MicIcon, SendIcon } from "@/components/Icons";
import { ReportModal } from "@/components/ReportModal";
import { IconButton, ScreenHeader, TextInput } from "@/components/ui";
import { api, ApiError, type ChatMessage, type ConversationItem } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { realtimeEmit, useRealtime } from "@/lib/realtime";

const DEMO_IMAGE = "/seed/black-white.svg";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const { messages } = useI18n();
  const { user } = useSession();
  const router = useRouter();
  const [conv, setConv] = useState<ConversationItem | null>(null);
  const [items, setItems] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reportMessageId, setReportMessageId] = useState<string | null>(null);
  const bottom = useRef<HTMLDivElement>(null);

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
    const name = conv?.members.find((m) => m.id === p.userId);
    setTyping(name ? name.firstName : messages.chat.typing);
    window.setTimeout(() => setTyping(null), 2500);
  });
  useRealtime("presence", (raw) => {
    const p = raw as { userId: string; online: boolean };
    setConv((c) => (c && c.peer?.id === p.userId ? { ...c, online: p.online } : c));
  });

  async function send(kind: "TEXT" | "IMAGE" | "AUDIO" = "TEXT") {
    setError(null);
    try {
      const msg = await api<ChatMessage>(`/conversations/${id}/messages`, {
        method: "POST",
        body: JSON.stringify(
          kind === "TEXT"
            ? { kind, body: text }
            : kind === "IMAGE"
              ? { kind, imageUrl: DEMO_IMAGE }
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
  }

  function onType(value: string) {
    setText(value);
    realtimeEmit("typing", { conversationId: id });
  }

  const title = conv?.title ?? messages.chat.inbox;

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col">
      <ScreenHeader
        title={title}
        onBack={() => router.push("/messages")}
        right={
          conv?.peer ? (
            <button type="button" className="text-xs text-danger" onClick={() => void block()}>
              {messages.chat.block}
            </button>
          ) : null
        }
      />
      {conv?.kind === "EVENT" ? (
        <p className="type-caption bg-info-soft px-4 py-2 text-info">
          {messages.chat.channel} · {conv.members.length} {messages.chat.members}
        </p>
      ) : null}
      {conv?.peer && conv.online ? (
        <p className="type-caption inline-flex items-center gap-1.5 px-4 pb-1 text-success">
          <span className="h-1.5 w-1.5 rounded-full bg-success" /> {messages.chat.online}
        </p>
      ) : null}
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {items.map((m) => {
          const mine = m.sender.id === user?.id;
          return (
            <div key={m.id} className={`max-w-[80%] ${mine ? "ml-auto" : ""}`}>
              {!mine ? (
                <Link href={`/u/${m.sender.username}`} className="type-caption text-muted">
                  {m.sender.firstName}
                </Link>
              ) : null}
              <div
                className={`type-body-sm rounded-2xl px-3.5 py-2.5 ${mine ? "rounded-br-md bg-accent text-on-primary" : "rounded-bl-md bg-surface shadow-xs"}`}
              >
                {m.kind === "IMAGE" && m.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.imageUrl} alt="" className="max-h-40 rounded-lg" />
                ) : null}
                {m.kind === "AUDIO" ? (
                  <span className="inline-flex items-center gap-1.5">
                    <MicIcon size={14} />
                    {messages.chat.voiceMock}
                  </span>
                ) : null}
                {m.body ? <p>{m.body}</p> : null}
              </div>
              <div className="mt-0.5 flex items-center gap-2 px-0.5">
                <p className="type-caption text-muted">{new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                {!mine ? (
                  <button
                    type="button"
                    className="type-caption text-muted underline"
                    onClick={() => setReportMessageId(m.id)}
                  >
                    {messages.admin.report}
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
        {typing ? <p className="type-caption text-muted">{typing} {messages.chat.typing}</p> : null}
        <div ref={bottom} />
      </div>
      {error ? <p className="type-body-sm px-4 text-danger">{error}</p> : null}
      <form
        className="flex items-center gap-2 border-t border-divider p-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim()) void send("TEXT");
        }}
      >
        <IconButton label={messages.chat.image} size={38} onClick={() => void send("IMAGE")}>
          <ImageIcon size={16} />
        </IconButton>
        <IconButton label={messages.chat.voice} size={38} onClick={() => void send("AUDIO")}>
          <MicIcon size={16} />
        </IconButton>
        <TextInput
          value={text}
          onChange={(e) => onType(e.target.value)}
          placeholder={messages.chat.placeholder}
          className="!rounded-pill flex-1"
        />
        <IconButton
          label={messages.chat.send}
          tone={text.trim() ? "accent" : "neutral"}
          type="submit"
          disabled={!text.trim()}
        >
          <SendIcon size={16} />
        </IconButton>
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
