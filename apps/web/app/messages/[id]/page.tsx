"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Avatar } from "@/components/Avatar";
import { EventInvitationSheet } from "@/components/EventInvitationSheet";
import { SocialInviteSheet } from "@/components/SocialInviteSheet";
import {
  ArrowLeftIcon,
  HomeIcon,
  MicIcon,
  MoreIcon,
  PaperclipIcon,
  SendIcon,
  SmileIcon,
} from "@/components/Icons";
import { ReportModal } from "@/components/ReportModal";
import { api, ApiError, type ChatMessage, type ConversationItem, type InvitationItem, type SocialInviteItem } from "@/lib/api";
import { EMOJI_GROUPS, STICKERS } from "@/lib/chat-stickers";
import { uploadChatFile } from "@/lib/chat-upload";
import { useI18n } from "@/lib/i18n";
import { realtimeEmit, useRealtime } from "@/lib/realtime";
import { useSession } from "@/lib/session";
import { formatBubbleClock, formatLastSeen } from "@/lib/time";

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
  const [picker, setPicker] = useState<"off" | "emoji" | "sticker">("off");
  const [reportMessageId, setReportMessageId] = useState<string | null>(null);
  const [eventInvite, setEventInvite] = useState<InvitationItem | null>(null);
  const [socialInvite, setSocialInvite] = useState<SocialInviteItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recMs, setRecMs] = useState(0);
  const bottom = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const typingTimers = useRef<Record<string, number>>({});
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recTimer = useRef<number>(0);
  const recStarted = useRef(0);

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
    return () => {
      realtimeEmit("leave", { conversationId: id });
      stopRecTimer();
      mediaRef.current?.stop();
    };
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

  async function send(payload: Record<string, unknown>) {
    setError(null);
    try {
      const msg = await api<ChatMessage>(`/conversations/${id}/messages`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setItems((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      if (payload.kind === "TEXT") setText("");
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

  async function onPickFile(file: File | undefined) {
    if (!file) return;
    try {
      const up = await uploadChatFile(file);
      if (up.kind === "IMAGE") await send({ kind: "IMAGE", imageUrl: up.url, mimeType: up.mime });
      else if (up.kind === "AUDIO") await send({ kind: "AUDIO", audioUrl: up.url, mimeType: up.mime });
      else await send({ kind: "FILE", fileUrl: up.url, fileName: up.name, mimeType: up.mime });
    } catch {
      setError(messages.chat.attachTooBig);
    }
  }

  function stopRecTimer() {
    window.clearInterval(recTimer.current);
  }

  async function toggleRecord() {
    if (recording) {
      mediaRef.current?.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
        stopRecTimer();
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
        const durationMs = Date.now() - recStarted.current;
        if (blob.size < 800) return;
        const file = new File([blob], "vocal.webm", { type: blob.type });
        void uploadChatFile(file)
          .then((up) => send({ kind: "AUDIO", audioUrl: up.url, mimeType: up.mime, durationMs }))
          .catch(() => setError(messages.chat.attachTooBig));
      };
      mediaRef.current = rec;
      recStarted.current = Date.now();
      rec.start();
      setRecording(true);
      setRecMs(0);
      recTimer.current = window.setInterval(() => setRecMs(Date.now() - recStarted.current), 200);
    } catch {
      setError(messages.common.error);
    }
  }

  function cancelRecord() {
    const rec = mediaRef.current;
    if (!rec) return;
    rec.onstop = () => {
      rec.stream.getTracks().forEach((t) => t.stop());
      setRecording(false);
      stopRecTimer();
    };
    rec.stop();
  }

  async function openInvite(m: ChatMessage) {
    if (!m.inviteId) return;
    try {
      if (m.inviteType === "SOCIAL") setSocialInvite(await api<SocialInviteItem>(`/social-invites/${m.inviteId}`));
      else setEventInvite(await api<InvitationItem>(`/invitations/${m.inviteId}`));
    } catch {
      setError(messages.common.error);
    }
  }

  const title = conv?.title ?? messages.chat.inbox;
  const lastSeen = formatLastSeen(conv?.peer?.lastSeenAt, locale, messages.chat);
  const subtitle =
    conv?.kind === "DIRECT"
      ? conv.online
        ? messages.chat.online
        : lastSeen ?? ""
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
          onClick={() => router.replace("/messages")}
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
          aria-label={messages.chat.home}
          onClick={() => router.replace("/")}
          className="tap-scale grid h-10 w-10 place-items-center rounded-full text-ink"
        >
          <HomeIcon size={18} />
        </button>
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
          <button type="button" className="block w-full rounded-xl px-3 py-2 text-left type-body-sm text-ink" onClick={() => router.replace("/")}>
            {messages.chat.home}
          </button>
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
                {m.kind === "INVITE" ? (
                  <button
                    type="button"
                    onClick={() => void openInvite(m)}
                    className="w-full rounded-[22px] bg-surface p-3.5 text-left shadow-xs"
                  >
                    <p className="type-caption font-semibold text-accent">{messages.chat.inviteCard}</p>
                    <p className="type-body-sm mt-1 font-semibold text-ink">{m.body || messages.social.notifInviteConsult}</p>
                    <p className="type-caption mt-2 font-semibold text-ink">{messages.social.notifInviteConsult}</p>
                  </button>
                ) : m.kind === "STICKER" ? (
                  <p className="px-1 text-5xl leading-none">{m.body}</p>
                ) : (
                  <div
                    className={`type-body-sm overflow-hidden rounded-[22px] px-3.5 py-2.5 ${
                      mine ? "rounded-br-md bg-accent text-on-primary" : "rounded-bl-md bg-surface-sunken text-ink"
                    }`}
                  >
                    {m.kind === "IMAGE" && m.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.imageUrl} alt="" className="mb-1.5 max-h-48 w-full rounded-2xl object-cover" />
                    ) : null}
                    {m.kind === "AUDIO" && m.audioUrl ? (
                      <audio controls src={m.audioUrl} className="max-w-full" />
                    ) : null}
                    {m.kind === "FILE" && m.fileUrl ? (
                      m.mimeType?.startsWith("video/") ? (
                        <video controls src={m.fileUrl} className="mb-1.5 max-h-48 w-full rounded-2xl" />
                      ) : (
                        <a href={m.fileUrl} target="_blank" rel="noreferrer" className="underline">
                          {m.fileName || messages.chat.file}
                        </a>
                      )
                    ) : null}
                    {m.body && m.kind !== "AUDIO" ? <p>{m.body}</p> : null}
                    <p className={`type-caption mt-1 text-right ${mine ? "text-on-primary/70" : "text-muted"}`}>
                      {formatBubbleClock(m.createdAt, locale)}
                      {m.durationMs ? ` · ${Math.max(1, Math.round(m.durationMs / 1000))}s` : ""}
                    </p>
                  </div>
                )}
                {!mine ? (
                  <button type="button" className="type-caption mt-0.5 px-1 text-muted" onClick={() => setReportMessageId(m.id)}>
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

      {picker !== "off" ? (
        <div className="max-h-44 overflow-y-auto border-t border-divider px-3 py-2">
          <div className="mb-2 flex gap-2">
            <button type="button" className={`type-caption rounded-full px-3 py-1 ${picker === "emoji" ? "bg-accent text-on-primary" : "bg-surface"}`} onClick={() => setPicker("emoji")}>
              {messages.chat.emoji}
            </button>
            <button type="button" className={`type-caption rounded-full px-3 py-1 ${picker === "sticker" ? "bg-accent text-on-primary" : "bg-surface"}`} onClick={() => setPicker("sticker")}>
              {messages.chat.sticker}
            </button>
          </div>
          {picker === "emoji"
            ? EMOJI_GROUPS.map((g) => (
                <div key={g.id} className="mb-1 flex flex-wrap gap-1">
                  {g.items.map((e) => (
                    <button key={e} type="button" className="grid h-9 w-9 place-items-center text-lg" onClick={() => onType(text + e)}>
                      {e}
                    </button>
                  ))}
                </div>
              ))
            : (
              <div className="flex flex-wrap gap-2">
                {STICKERS.map((s) => (
                  <button key={s} type="button" className="grid h-14 w-14 place-items-center rounded-2xl bg-surface text-3xl" onClick={() => void send({ kind: "STICKER", body: s })}>
                    {s}
                  </button>
                ))}
              </div>
            )}
        </div>
      ) : null}

      {recording ? (
        <div className="flex items-center justify-between gap-3 px-4 py-2">
          <p className="type-body-sm font-semibold text-danger">
            {messages.chat.recording} {Math.floor(recMs / 1000)}s
          </p>
          <button type="button" className="type-caption font-semibold text-muted" onClick={cancelRecord}>
            {messages.chat.cancelRecord}
          </button>
        </div>
      ) : null}

      <form
        className="flex items-center gap-2 px-3 pb-[max(0.85rem,env(safe-area-inset-bottom))] pt-1"
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim()) void send({ kind: "TEXT", body: text });
        }}
      >
        <div className="flex min-w-0 flex-1 items-center gap-1 rounded-full bg-surface px-2.5 shadow-xs">
          <button
            type="button"
            aria-label={messages.chat.emoji}
            className="grid h-9 w-9 place-items-center text-muted"
            onClick={() => setPicker((v) => (v === "off" ? "emoji" : "off"))}
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
            accept="image/*,audio/*,video/*,.pdf,.txt,.zip,.doc,.docx"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              void onPickFile(file);
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
            aria-label={recording ? messages.chat.stopRecord : messages.chat.voice}
            className={`tap-scale grid h-12 w-12 shrink-0 place-items-center rounded-full text-on-primary shadow-sm ${recording ? "bg-danger" : "bg-accent"}`}
            onClick={() => void toggleRecord()}
          >
            <MicIcon size={18} />
          </button>
        )}
      </form>
      <ReportModal open={Boolean(reportMessageId)} kind="MESSAGE" messageId={reportMessageId ?? undefined} onClose={() => setReportMessageId(null)} />
      <EventInvitationSheet
        invitation={eventInvite}
        open={Boolean(eventInvite)}
        canRespond={eventInvite?.status === "PENDING"}
        busy={busy}
        onClose={() => setEventInvite(null)}
        onAccept={() => {
          if (!eventInvite) return;
          setBusy(true);
          api<InvitationItem & { conversationId?: string; needsPayment?: boolean; reservation?: { id: string } }>(
            `/invitations/${eventInvite.id}/accept`,
            { method: "POST" },
          )
            .then((res) => {
              setEventInvite(null);
              if (res.needsPayment && res.reservation) router.push(`/events/${res.event.id}/pay?reservationId=${res.reservation.id}`);
              else void load();
            })
            .finally(() => setBusy(false));
        }}
        onRefuse={() => {
          if (!eventInvite) return;
          setBusy(true);
          api(`/invitations/${eventInvite.id}/refuse`, { method: "POST" })
            .then(() => {
              setEventInvite(null);
              void load();
            })
            .finally(() => setBusy(false));
        }}
      />
      <SocialInviteSheet
        invitation={socialInvite}
        open={Boolean(socialInvite)}
        canRespond={socialInvite?.status === "SENT"}
        busy={busy}
        onClose={() => setSocialInvite(null)}
        onAccept={() => {
          if (!socialInvite) return;
          setBusy(true);
          api(`/social-invites/${socialInvite.id}/accept`, { method: "POST" })
            .then(() => {
              setSocialInvite(null);
              void load();
            })
            .finally(() => setBusy(false));
        }}
        onRefuse={() => {
          if (!socialInvite) return;
          setBusy(true);
          api(`/social-invites/${socialInvite.id}/refuse`, { method: "POST" })
            .then(() => {
              setSocialInvite(null);
              void load();
            })
            .finally(() => setBusy(false));
        }}
      />
    </main>
  );
}
