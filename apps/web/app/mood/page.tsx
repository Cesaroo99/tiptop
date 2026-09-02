"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Avatar, CertifiedMark } from "@/components/Avatar";
import { CameraIcon, ClockIcon, CommentIcon, FlagIcon, HeartIcon, PinIcon, ShareIcon, SparklesIcon } from "@/components/Icons";
import { LikeDialogs, likeErrorKind } from "@/components/LikeDialogs";
import { ReportModal } from "@/components/ReportModal";
import { SocialInviteModal } from "@/components/SocialInviteModal";
import { EmptyState, Modal, Skeleton, TextInput } from "@/components/ui";
import { api, ApiError, type CommentItem, type MoodItem } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";

/**
 * Flux Mood vertical, immersif (#4-6) : un mood par écran, défilement vertical
 * naturel (scroll-snap, tactile comme au clavier), actions contextuelles
 * superposées, et passerelles explicites vers le monde réel (profil, événement,
 * lieu). Toute vignette de mood ailleurs dans l'app (stories de l'accueil,
 * profil, recherche, notifications, moods liés à un événement) ouvre ce même
 * flux continu via `?start=<id>` plutôt qu'une vue isolée, pour rester
 * cohérent avec l'expérience façon TikTok demandée.
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
            // Mood expiré ou inaccessible : on ignore silencieusement et on garde le flux général.
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
            <Link href="/compose?type=mood" className="type-body-sm font-semibold text-accent">
              {messages.world.moodCreate}
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <p className="type-h4 text-white drop-shadow">{messages.nav.mood}</p>
        <Link
          href="/compose?type=mood"
          className="tap-scale pointer-events-auto flex items-center gap-1.5 rounded-pill bg-white/90 px-3.5 py-2 text-ink shadow-sm backdrop-blur-sm"
        >
          <CameraIcon size={15} />
          <span className="type-caption font-semibold">{messages.world.moodCreate}</span>
        </Link>
      </div>
      <div
        ref={containerRef}
        tabIndex={0}
        onKeyDown={onKeyDown}
        className="no-scrollbar h-full snap-y snap-mandatory overflow-y-scroll scroll-smooth outline-none"
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
  const [transfer, setTransfer] = useState<string | null>(null);
  const [buy, setBuy] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const liked = mood.likeTime?.likedByMe ?? mood.likedByMe ?? false;

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
    <section ref={registerRef} className="relative h-full w-full snap-start snap-always">
      {mood.videoUrl ? (
        <MoodVideo src={mood.videoUrl} />
      ) : mood.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={mood.imageUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="grid h-full w-full place-items-center bg-gradient-to-br from-accent via-accent-hover to-ink px-8 text-center">
          <p className="type-h2 text-on-primary">{mood.body || messages.world.typeMood}</p>
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />

      <div className="absolute bottom-24 right-3 flex flex-col items-center gap-5 text-white md:bottom-8">
        <button type="button" onClick={() => void like(false)} className="tap-scale flex flex-col items-center gap-1" aria-label={messages.social.likePlace}>
          <span className={`grid h-11 w-11 place-items-center rounded-full backdrop-blur-sm ${liked ? "bg-accent" : "bg-black/35"}`}>
            <HeartIcon size={20} filled={liked} />
          </span>
          <span className="type-caption font-semibold drop-shadow">
            {mood.likeTime ? mood.likeTime.label : mood.authorActiveLikes}
          </span>
        </button>
        <button type="button" onClick={() => setCommentsOpen(true)} className="tap-scale flex flex-col items-center gap-1" aria-label={messages.social.comments}>
          <span className="grid h-11 w-11 place-items-center rounded-full bg-black/35 backdrop-blur-sm">
            <CommentIcon size={19} />
          </span>
          <span className="type-caption font-semibold drop-shadow">{mood.commentsCount}</span>
        </button>
        <button type="button" onClick={() => void share()} className="tap-scale flex flex-col items-center gap-1" aria-label={messages.social.share}>
          <span className="grid h-11 w-11 place-items-center rounded-full bg-black/35 backdrop-blur-sm">
            <ShareIcon size={17} />
          </span>
        </button>
        {user && user.id !== mood.author.id ? (
          <button type="button" onClick={() => setReportOpen(true)} className="tap-scale flex flex-col items-center gap-1" aria-label={messages.admin.report}>
            <span className="grid h-11 w-11 place-items-center rounded-full bg-black/35 backdrop-blur-sm">
              <FlagIcon size={16} />
            </span>
          </button>
        ) : null}
      </div>

      <div className="absolute inset-x-0 bottom-[max(5.5rem,calc(5.5rem+env(safe-area-inset-bottom)))] px-4 pr-20 text-white md:bottom-6">
        <div className="flex items-center gap-2.5">
          <Link href={`/u/${mood.author.username}`} className="flex items-center gap-2.5">
            <Avatar src={mood.author.avatarUrl} firstName={mood.author.firstName} lastName={mood.author.lastName} size="sm" ring="accent" />
            <span className="type-body-sm flex items-center gap-1 font-semibold drop-shadow">
              {mood.author.firstName} {mood.author.lastName}
              {mood.author.certified ? <CertifiedMark /> : null}
            </span>
          </Link>
          {mood.companion ? (
            <>
              <span className="type-body-sm opacity-80">·</span>
              <Link href={`/u/${mood.companion.username}`} className="type-body-sm font-semibold opacity-90 drop-shadow">
                {messages.world.moodWith.replace("{name}", mood.companion.firstName)}
              </Link>
            </>
          ) : null}
        </div>
        {mood.activity ? (
          <p className="type-body-sm mt-2 inline-flex rounded-lg bg-white/20 px-2.5 py-1 font-semibold backdrop-blur-sm">
            {mood.activity}
          </p>
        ) : null}
        {mood.body ? <p className="type-body mt-2 line-clamp-3 drop-shadow">{mood.body}</p> : null}
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          {mood.zone ? (
            <span className="type-caption inline-flex items-center gap-1 opacity-90">
              <PinIcon size={12} />
              {mood.city} - {mood.zone}
            </span>
          ) : null}
          <span className="type-caption inline-flex items-center gap-1 opacity-90">
            <ClockIcon size={12} />
            {messages.world.availableUntil.replace("{time}", new Date(mood.expiresAt).toLocaleTimeString())}
          </span>
        </div>
        {mood.event ? (
          <Link
            href={`/events/${mood.event.id}`}
            className="type-body-sm mt-2 inline-flex items-center gap-1.5 rounded-pill bg-white text-ink px-3 py-1.5 font-semibold shadow-sm"
          >
            {messages.world.seeEventFromMood} · {mood.event.title}
          </Link>
        ) : null}
        {user && user.id !== mood.author.id ? (
          <button
            type="button"
            onClick={() => setJoinOpen(true)}
            className="tap-scale type-button mt-3 flex items-center gap-1.5 rounded-pill bg-accent px-4 py-2.5 text-on-primary shadow-sm transition hover:bg-accent-hover"
          >
            <SparklesIcon size={15} />
            {messages.socialInvite.joinNow}
          </button>
        ) : null}
        {copied ? <p className="type-caption mt-2 font-semibold">{messages.social.copied}</p> : null}
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
      <MoodComments moodId={mood.id} open={commentsOpen} onClose={() => setCommentsOpen(false)} onSent={() => onChange({ commentsCount: mood.commentsCount + 1 })} />
    </section>
  );
}

/**
 * Vidéo courte en boucle, muette par défaut (autoplay navigateur), qui ne joue
 * que lorsque son écran est réellement visible dans le flux — comme Reels/TikTok,
 * pour ne pas faire tourner plusieurs vidéos en même temps (#71 performance).
 */
function MoodVideo({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.6) void el.play().catch(() => undefined);
        else el.pause();
      },
      { threshold: [0, 0.6, 1] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <button
      type="button"
      aria-label={muted ? "Activer le son" : "Couper le son"}
      onClick={() => setMuted((v) => !v)}
      className="relative block h-full w-full"
    >
      <video
        ref={ref}
        src={src}
        muted={muted}
        loop
        playsInline
        preload="metadata"
        className="h-full w-full object-cover"
      />
      {muted ? (
        <span className="absolute left-3 top-[max(1rem,env(safe-area-inset-top))] grid h-8 w-8 place-items-center rounded-full bg-black/35 text-white backdrop-blur-sm">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <path d="M11 5 6 9H3v6h3l5 4V5Z" />
            <line x1="4" y1="4" x2="20" y2="20" />
          </svg>
        </span>
      ) : null}
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
  const [comments, setComments] = useState<CommentItem[] | null>(null);
  const [body, setBody] = useState("");

  useEffect(() => {
    if (!open) return;
    api<{ items: CommentItem[] }>(`/moods/${moodId}/comments`)
      .then((d) => setComments(d.items))
      .catch(() => setComments([]));
  }, [open, moodId]);

  async function send() {
    if (!body.trim()) return;
    const c = await api<CommentItem>(`/moods/${moodId}/comments`, { method: "POST", body: JSON.stringify({ body }) });
    setComments((cur) => [...(cur ?? []), c]);
    setBody("");
    onSent();
  }

  return (
    <Modal open={open} title={messages.social.comments} onClose={onClose}>
      <div className="max-h-[50vh] space-y-2 overflow-y-auto">
        {comments === null ? (
          <p className="type-body-sm text-muted">{messages.common.loading}</p>
        ) : comments.length === 0 ? (
          <p className="type-body-sm text-muted">{messages.reviews.empty}</p>
        ) : (
          comments.map((c) => (
            <p key={c.id} className="type-body-sm rounded-lg bg-surface-sunken px-3.5 py-2.5">
              <span className="font-semibold text-accent">{c.author.firstName}</span> {c.body}
            </p>
          ))
        )}
      </div>
      <div className="mt-3 flex gap-2">
        <TextInput value={body} onChange={(e) => setBody(e.target.value)} placeholder={messages.social.addComment} className="flex-1" />
        <button type="button" onClick={() => void send()} className="tap-scale type-button rounded-pill bg-accent px-5 text-on-primary transition hover:bg-accent-hover">
          OK
        </button>
      </div>
    </Modal>
  );
}
