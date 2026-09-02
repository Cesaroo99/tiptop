"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ReportModal } from "@/components/ReportModal";
import { ScreenHeader, TextInput } from "@/components/ui";
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
        <p className="px-4 text-xs text-muted">
          {messages.chat.channel} · {conv.members.length} {messages.chat.members}
        </p>
      ) : null}
      {conv?.peer && conv.online ? <p className="px-4 text-xs text-success">{messages.chat.online}</p> : null}
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {items.map((m) => {
          const mine = m.sender.id === user?.id;
          return (
            <div key={m.id} className={`max-w-[80%] ${mine ? "ml-auto" : ""}`}>
              {!mine ? (
                <Link href={`/u/${m.sender.username}`} className="text-[11px] text-muted">
                  {m.sender.firstName}
                </Link>
              ) : null}
              <div className={`rounded-2xl px-3 py-2 text-sm ${mine ? "bg-accent text-white" : "bg-surface shadow-card"}`}>
                {m.kind === "IMAGE" && m.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.imageUrl} alt="" className="max-h-40 rounded-xl" />
                ) : null}
                {m.kind === "AUDIO" ? <p>{messages.chat.voiceMock}</p> : null}
                {m.body ? <p>{m.body}</p> : null}
              </div>
              <div className="mt-0.5 flex items-center gap-2">
                <p className="text-[10px] text-muted">{new Date(m.createdAt).toLocaleTimeString()}</p>
                {!mine ? (
                  <button
                    type="button"
                    className="text-[10px] text-muted underline"
                    onClick={() => setReportMessageId(m.id)}
                  >
                    {messages.admin.report}
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
        {typing ? <p className="text-xs text-muted">{typing} {messages.chat.typing}</p> : null}
        <div ref={bottom} />
      </div>
      {error ? <p className="px-4 text-sm text-danger">{error}</p> : null}
      <form
        className="flex gap-2 border-t border-[var(--border)] p-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim()) void send("TEXT");
        }}
      >
        <button type="button" className="text-xs text-muted" onClick={() => void send("IMAGE")}>
          {messages.chat.image}
        </button>
        <button type="button" className="text-xs text-muted" onClick={() => void send("AUDIO")}>
          {messages.chat.voice}
        </button>
        <TextInput
          value={text}
          onChange={(e) => onType(e.target.value)}
          placeholder={messages.chat.placeholder}
          className="flex-1"
        />
        <button type="submit" className="font-semibold text-accent" disabled={!text.trim()}>
          {messages.chat.send}
        </button>
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
