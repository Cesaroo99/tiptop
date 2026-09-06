"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AppShell } from "@/components/AppShell";
import { Avatar, CertifiedMark } from "@/components/Avatar";
import { CommentThread } from "@/components/CommentThread";
import { CameraIcon, MusicIcon, PlayIcon, SearchIcon, SendIcon, SmileIcon, SparklesIcon } from "@/components/Icons";
import { LikeDialogs, likeErrorKind } from "@/components/LikeDialogs";
import { MoodLikeRail } from "@/components/MoodLikeRail";
import { MoodPlaceSheet, MoodPlaceTag, moodPlaceFromItem } from "@/components/MoodPlace";
import { ReportModal } from "@/components/ReportModal";
import { SocialInviteModal } from "@/components/SocialInviteModal";
import { EmptyState, Modal, Skeleton } from "@/components/ui";
import { moodSoundSrc } from "@tiptop/domain";
import { api, ApiError, type CommentItem, type MoodItem } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { viewerLikeActive } from "@/lib/like-feed";
import { useLikePlacement } from "@/lib/like-placement";
import { useSession } from "@/lib/session";
import { sheetOverlayClass, useSheetPortal } from "@/lib/sheet-portal";

/**
 * Flux Mood vertical immersif : un mood par écran, média lisible,
 * lieu seulement s’il est renseigné, like = temps qui continue d’avancer.
 */
export default function Page() {
  return (
    <AppShell fullBleed>
      <Suspense>
        <MoodFeed />
      </Suspense>
    </AppShell>
  );
}

function MoodFeed() {
  const { messages } = useI18n();
  const { user } = useSession();
  const params = useSearchParams();
  const startId = params.get("start");
  const [items, setItems] = useState<MoodItem[] | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef(new Map<string, HTMLElement>());

  useEffect(() => {
    api<{ items: MoodItem[] }>("/moods")
      .then(async (d) => {
        if (startId && !d.items.some((m) => m.id === startId)) {
          try {
            const single = await api<MoodItem>(`/moods/${startId}`);
            setItems([single, ...d.items]);
            return;
          } catch {
            /* Mood expiré : on garde le flux. */
          }
        }
        setItems(d.items);
      })
      .catch(() => setItems([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startId]);

  useEffect(() => {
    if (!startId || !items) return;
    const el = slideRefs.current.get(startId);
    el?.scrollIntoView({ block: "start" });
  }, [startId, items]);

  function updateMood(id: string, patch: Partial<MoodItem>) {
    setItems((cur) => cur?.map((m) => (m.id === id ? { ...m, ...patch } : m)) ?? cur);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const el = containerRef.current;
    if (!el) return;
    if (e.key === "ArrowDown" || e.key === "PageDown") {
      e.preventDefault();
      el.scrollBy({ top: el.clientHeight, behavior: "smooth" });
    } else if (e.key === "ArrowUp" || e.key === "PageUp") {
      e.preventDefault();
      el.scrollBy({ top: -el.clientHeight, behavior: "smooth" });
    }
  }

  if (items === null) {
    return (
      <div className="flex h-full items-center justify-center bg-ink">
        <Skeleton className="h-1/2 w-4/5 rounded-card" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-surface px-6">
        <EmptyState
          title={messages.world.moodEmpty}
          body={messages.world.moodEmptyBody}
          action={
            <Link href="/mood/create" className="type-body-sm font-semibold text-accent">
              {messages.world.moodCreate}
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-0 w-full">
      <div className="phone-safe-top pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between px-4">
        <p className="text-[22px] font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]">{messages.nav.mood}</p>
        <div className="pointer-events-auto flex items-center gap-2.5">
          <Link
            href="/mood/create"
            aria-label={messages.world.moodCreate}
            className="tap-scale flex items-center gap-1.5 rounded-pill bg-white px-3.5 py-2 text-ink shadow-sm"
          >
            <CameraIcon size={15} />
            <span className="type-caption font-semibold">{messages.world.moodCreateShort}</span>
          </Link>
          <Link
            href="/search"
            aria-label={messages.common.search}
            className="tap-scale grid h-9 w-9 place-items-center text-white drop-shadow"
          >
            <SearchIcon size={20} />
          </Link>
          {user ? (
            <Link href={`/u/${user.username}`} aria-label={user.username} className="tap-scale">
              <Avatar src={user.avatarUrl} firstName={user.firstName} lastName={user.lastName} size={32} />
            </Link>
          ) : null}
        </div>
      </div>
      <div
        ref={containerRef}
        tabIndex={0}
        onKeyDown={onKeyDown}
        className="no-scrollbar absolute inset-0 snap-y snap-mandatory overflow-y-scroll scroll-smooth outline-none"
      >
        {items.map((m) => (
          <MoodSlide
            key={m.id}
            mood={m}
            registerRef={(el) => {
              if (el) slideRefs.current.set(m.id, el);
              else slideRefs.current.delete(m.id);
            }}
            onChange={(patch) => updateMood(m.id, patch)}
          />
        ))}
      </div>
    </div>
  );
}

function MoodSlide({
  mood,
  onChange,
  registerRef,
}: {
  mood: MoodItem;
  onChange: (patch: Partial<MoodItem>) => void;
  registerRef?: (el: HTMLElement | null) => void;
}) {
  const { messages } = useI18n();
  const { user } = useSession();
  const { refresh: refreshPlacement, placement, ready } = useLikePlacement();
  const dock = Boolean(placement);
  const [transfer, setTransfer] = useState<string | null>(null);
  const [buy, setBuy] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [placeOpen, setPlaceOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [captionOpen, setCaptionOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [muted, setMuted] = useState(true);
  const [loadedAt, setLoadedAt] = useState(() => Date.now());
  const place = moodPlaceFromItem(mood);
  const liked = viewerLikeActive(
    placement,
    "mood",
    mood.id,
    mood.likeTime?.likedByMe ?? mood.likedByMe ?? false,
    ready,
  );
  const canJoin = Boolean(user && user.id !== mood.author.id);
  const captionLong = (mood.body ?? "").length > 90;

  useEffect(() => {
    setLoadedAt(Date.now());
  }, [mood.likeTime?.activeCount, mood.likeTime?.totalSeconds]);

  async function like(confirmTransfer = false) {
    try {
      if (liked) {
        await api("/likes", { method: "DELETE", body: JSON.stringify({ targetType: "mood", targetId: mood.id }) });
        onChange({
          likedByMe: false,
          likeTime: mood.likeTime
            ? { ...mood.likeTime, likedByMe: false, activeCount: Math.max(0, mood.likeTime.activeCount - 1) }
            : undefined,
        });
        await refreshPlacement();
        return;
      }
      await api("/likes", {
        method: "POST",
        body: JSON.stringify({ targetType: "mood", targetId: mood.id, confirmTransfer }),
      });
      onChange({
        likedByMe: true,
        likeTime: mood.likeTime
          ? { ...mood.likeTime, likedByMe: true, activeCount: mood.likeTime.activeCount + 1 }
          : undefined,
      });
      await refreshPlacement();
      setTransfer(null);
      setBuy(false);
    } catch (e) {
      if (e instanceof ApiError) {
        const kind = likeErrorKind(String(e.code));
        if (kind === "buy") {
          setBuy(true);
          return;
        }
        if (kind === "transfer") setTransfer(messages.social.transferGeneric);
      }
    }
  }

  async function share() {
    const url = `${window.location.origin}/mood/${mood.id}`;
    try {
      if (navigator.share) await navigator.share({ title: messages.world.typeMood, url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      }
    } catch {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    }
  }

  return (
    <section ref={registerRef} className="relative h-full min-h-full w-full shrink-0 snap-start snap-always">
      {mood.videoUrl ? (
        <MoodVideo
          src={mood.videoUrl}
          muted={muted || mood.soundKey === "off" || Boolean(moodSoundSrc(mood.soundKey))}
          soundSrc={moodSoundSrc(mood.soundKey)}
        />
      ) : mood.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={mood.imageUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="grid h-full w-full place-items-center bg-gradient-to-br from-accent via-accent-hover to-ink px-8 text-center">
          <p className="type-h2 text-on-primary">{mood.body || messages.world.typeMood}</p>
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/75" />

      <div className={`absolute right-2.5 z-10 ${dock ? "bottom-[max(11.75rem,calc(11.25rem+env(safe-area-inset-bottom)))]" : "bottom-[max(8.9rem,calc(8.4rem+env(safe-area-inset-bottom)))]"}`}>
        <MoodLikeRail
          liked={liked}
          likeTime={mood.likeTime}
          loadedAt={loadedAt}
          commentsCount={mood.commentsCount}
          onLike={() => void like(false)}
          onComments={() => setCommentsOpen(true)}
          onShare={() => void share()}
          onMore={() => setMoreOpen(true)}
        />
      </div>

      <div className={`absolute inset-x-0 z-10 px-4 pr-[4.75rem] text-white ${dock ? "bottom-[max(11.75rem,calc(11.25rem+env(safe-area-inset-bottom)))]" : "bottom-[max(8.9rem,calc(8.4rem+env(safe-area-inset-bottom)))]"}`}>
        {place ? (
          <div className="mb-1.5">
            <MoodPlaceTag place={place} onOpen={() => setPlaceOpen(true)} />
          </div>
        ) : null}
        <div className="flex items-center gap-2.5">
          <Link href={`/u/${mood.author.username}`} className="flex min-w-0 items-center gap-2.5">
            <Avatar src={mood.author.avatarUrl} firstName={mood.author.firstName} lastName={mood.author.lastName} size={34} />
            <span className="type-body-sm flex items-center gap-1 font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]">
              {mood.author.firstName} {mood.author.lastName}
              {mood.author.certified ? <CertifiedMark /> : null}
            </span>
          </Link>
          {user && user.id !== mood.author.id ? (
            <FollowAuthor
              authorId={mood.author.id}
              following={Boolean(mood.following)}
              onChange={(following) => onChange({ following })}
            />
          ) : null}
        </div>
        {mood.companion ? (
          <Link
            href={`/u/${mood.companion.username}`}
            className="type-caption mt-1 block font-semibold opacity-95 drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]"
          >
            {messages.world.moodWith.replace("{name}", `${mood.companion.firstName} ${mood.companion.lastName}`)}
          </Link>
        ) : null}
        {mood.body ? (
          <div className={`type-body-sm mt-1.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)] ${captionOpen ? "" : "line-clamp-2"}`}>
            {mood.body}
            {!captionOpen && captionLong ? (
              <>
                {" "}
                <button type="button" onClick={() => setCaptionOpen(true)} className="font-semibold">
                  {messages.world.moodMore}
                </button>
              </>
            ) : null}
          </div>
        ) : null}
        {mood.videoUrl && mood.soundKey !== "off" ? (
          <button
            type="button"
            onClick={() => setMuted((v) => !v)}
            className="type-caption mt-2 inline-flex items-center gap-1.5 font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]"
            aria-label={muted ? "Activer le son" : "Couper le son"}
          >
            <span className="grid h-5 w-5 place-items-center rounded-full bg-white/15">
              <MusicIcon size={11} />
            </span>
            {mood.soundLabel
              ? messages.world.moodAudioNamed.replace("{name}", mood.soundLabel)
              : messages.world.moodAudioOriginal}
          </button>
        ) : null}
        {copied ? <p className="type-caption mt-2 font-semibold">{messages.social.copied}</p> : null}
      </div>

      <div className={`absolute inset-x-0 z-10 px-4 ${dock ? "bottom-[max(8.35rem,calc(7.85rem+env(safe-area-inset-bottom)))]" : "bottom-[max(5.6rem,calc(5.1rem+env(safe-area-inset-bottom)))]"}`}>
        <button
          type="button"
          onClick={() => setCommentsOpen(true)}
          className="flex h-11 w-full items-center justify-between rounded-full bg-white/15 px-4 text-left text-white/90 backdrop-blur-md"
        >
          <span className="type-body-sm">{messages.social.addComment}</span>
          <SmileIcon size={18} />
        </button>
      </div>

      <LikeDialogs
        transferName={transfer}
        buyOpen={buy}
        onCloseTransfer={() => setTransfer(null)}
        onConfirmTransfer={() => void like(true)}
        onCloseBuy={() => setBuy(false)}
      />
      <SocialInviteModal
        open={joinOpen}
        inviteeId={mood.author.id}
        defaultContext="MEETUP"
        defaultLabel={mood.activity ?? ""}
        onClose={() => setJoinOpen(false)}
      />
      <ReportModal open={reportOpen} kind="MOOD" moodId={mood.id} onClose={() => setReportOpen(false)} />
      <MoodPlaceSheet place={place} open={placeOpen} onClose={() => setPlaceOpen(false)} />
      <MoodComments
        moodId={mood.id}
        open={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        onSent={() => onChange({ commentsCount: mood.commentsCount + 1 })}
      />
      <Modal open={moreOpen} title={messages.world.moodActions} onClose={() => setMoreOpen(false)} hideActions>
        <div className="space-y-2">
          {canJoin ? (
            <button
              type="button"
              onClick={() => {
                setMoreOpen(false);
                setJoinOpen(true);
              }}
              className="tap-scale type-body-sm flex w-full items-center gap-2 rounded-xl bg-accent-soft px-3.5 py-3 font-semibold text-accent"
            >
              <SparklesIcon size={15} />
              {messages.socialInvite.joinNow}
            </button>
          ) : null}
          {mood.event ? (
            <Link
              href={`/events/${mood.event.id}`}
              className="type-body-sm block rounded-xl bg-surface-sunken px-3.5 py-3 font-semibold text-ink"
            >
              {messages.world.seeEventFromMood} · {mood.event.title}
            </Link>
          ) : null}
          {canJoin ? (
            <button
              type="button"
              onClick={() => {
                setMoreOpen(false);
                setReportOpen(true);
              }}
              className="type-body-sm w-full rounded-xl px-3.5 py-3 text-left font-semibold text-danger"
            >
              {messages.admin.report}
            </button>
          ) : null}
        </div>
      </Modal>
    </section>
  );
}

/** Vidéo en boucle : joue dès qu’elle est visible, tap pour pause / lecture. */
function MoodVideo({ src, muted, soundSrc }: { src: string; muted: boolean; soundSrc?: string | null }) {
  const { messages } = useI18n();
  const ref = useRef<HTMLVideoElement>(null);
  const pausedRef = useRef(false);
  const [paused, setPaused] = useState(false);
  const [hint, setHint] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        const on = entry.isIntersecting && entry.intersectionRatio > 0.55;
        if (on && !pausedRef.current) void el.play().catch(() => undefined);
        else el.pause();
      },
      { threshold: [0, 0.55, 1] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [src]);

  useEffect(() => {
    const el = ref.current;
    if (!el || paused) return;
    void el.play().catch(() => undefined);
  }, [muted, paused]);

  function toggle() {
    const el = ref.current;
    if (!el) return;
    const next = !pausedRef.current;
    pausedRef.current = next;
    setPaused(next);
    if (next) el.pause();
    else void el.play().catch(() => undefined);
    setHint(true);
    window.setTimeout(() => setHint(false), 700);
  }

  return (
    <div className="absolute inset-0">
      <video
        ref={ref}
        src={src}
        muted={muted}
        loop
        playsInline
        autoPlay
        preload="auto"
        className="h-full w-full object-cover"
        onClick={toggle}
      />
      {soundSrc ? <audio src={soundSrc} loop autoPlay muted={muted} /> : null}
      {hint ? (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-black/45 text-white">
            {paused ? <PlayIcon size={28} /> : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <rect x="6" y="5" width="4.5" height="14" rx="1" />
                <rect x="13.5" y="5" width="4.5" height="14" rx="1" />
              </svg>
            )}
          </span>
        </div>
      ) : null}
      <span className="sr-only">{paused ? messages.world.moodPlay : messages.world.moodPause}</span>
    </div>
  );
}

function FollowAuthor({
  authorId,
  following,
  onChange,
}: {
  authorId: string;
  following: boolean;
  onChange: (following: boolean) => void;
}) {
  const { messages } = useI18n();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    try {
      if (following) {
        await api(`/users/${authorId}/follow`, { method: "DELETE" });
        onChange(false);
      } else {
        await api(`/users/${authorId}/follow`, { method: "POST" });
        onChange(true);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void toggle()}
      disabled={busy}
      className={`tap-scale shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold leading-none shadow-[0_1px_6px_rgba(0,0,0,0.28)] ${
        following
          ? "border border-white/40 bg-white/10 text-white"
          : "bg-accent text-on-primary"
      }`}
    >
      {following ? messages.social.following : messages.social.follow}
    </button>
  );
}

function MoodComments({
  moodId,
  open,
  onClose,
  onSent,
}: {
  moodId: string;
  open: boolean;
  onClose: () => void;
  onSent: () => void;
}) {
  const { messages } = useI18n();
  const portal = useSheetPortal();
  const [comments, setComments] = useState<CommentItem[] | null>(null);
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<CommentItem | null>(null);
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setComments(null);
    setReplyTo(null);
    api<{ items: CommentItem[] }>(`/moods/${moodId}/comments`)
      .then((d) => setComments(d.items))
      .catch(() => setComments([]));
    const t = window.setTimeout(() => inputRef.current?.focus(), 180);
    return () => window.clearTimeout(t);
  }, [open, moodId]);

  async function send() {
    if (!body.trim() || sending) return;
    setSending(true);
    try {
      const c = await api<CommentItem>(`/moods/${moodId}/comments`, {
        method: "POST",
        body: JSON.stringify({ body, parentId: replyTo?.id }),
      });
      setComments((cur) => [...(cur ?? []), c]);
      setBody("");
      setReplyTo(null);
      onSent();
    } finally {
      setSending(false);
    }
  }

  if (!open || !portal) return null;

  return createPortal(
    <div
      className={sheetOverlayClass(portal)}
      role="dialog"
      aria-modal
      aria-label={messages.social.comments}
      onClick={onClose}
    >
      <div
        data-testid="mood-comments-sheet"
        className="sheet-panel flex h-[min(64dvh,488px)] w-full max-w-md flex-col rounded-t-[28px] bg-surface px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 shadow-elevated"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-border" aria-hidden />
        <div className="flex items-center justify-between pb-2">
          <h2 className="type-h3 text-ink">
            {messages.social.comments}
            {comments ? ` · ${comments.length}` : ""}
          </h2>
          <button type="button" onClick={onClose} className="type-caption font-semibold text-muted">
            {messages.common.close}
          </button>
        </div>
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
          {comments === null ? (
            <p className="type-body-sm text-muted">{messages.common.loading}</p>
          ) : comments.length === 0 ? (
            <p className="type-body-sm py-6 text-center text-muted">{messages.world.moodCommentsEmpty}</p>
          ) : (
            <CommentThread
              items={comments}
              onChange={(next) => setComments((cur) => cur?.map((c) => (c.id === next.id ? next : c)) ?? cur)}
              onReply={(c) => {
                setReplyTo(c);
                window.setTimeout(() => inputRef.current?.focus(), 40);
              }}
            />
          )}
        </div>
        {replyTo ? (
          <div className="mt-2 flex items-center justify-between rounded-xl bg-surface-sunken px-3 py-2">
            <p className="type-caption text-muted">
              {messages.social.replyTo.replace("{name}", replyTo.author.firstName)}
            </p>
            <button type="button" onClick={() => setReplyTo(null)} className="type-caption font-semibold text-ink">
              {messages.common.close}
            </button>
          </div>
        ) : null}
        <form
          className="mt-3 flex items-center gap-2 border-t border-divider pt-3"
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          <input
            ref={inputRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={replyTo ? messages.social.replyTo.replace("{name}", replyTo.author.firstName) : messages.social.addComment}
            className="type-body-sm h-11 flex-1 rounded-full bg-surface-sunken px-4 text-ink outline-none"
          />
          <button
            type="submit"
            disabled={!body.trim() || sending}
            aria-label={messages.social.addComment}
            className="tap-scale grid h-11 w-11 place-items-center rounded-full bg-accent text-on-primary disabled:opacity-40"
          >
            <SendIcon size={16} />
          </button>
        </form>
      </div>
    </div>,
    portal,
  );
}
