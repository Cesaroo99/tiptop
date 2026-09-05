"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Avatar, CertifiedMark } from "@/components/Avatar";
import { CameraIcon, MusicIcon, SearchIcon, SmileIcon, SparklesIcon } from "@/components/Icons";
import { LikeDialogs, likeErrorKind } from "@/components/LikeDialogs";
import { MoodLikeRail } from "@/components/MoodLikeRail";
import { MoodPlaceSheet, MoodPlaceTag, moodPlaceFromItem } from "@/components/MoodPlace";
import { ReportModal } from "@/components/ReportModal";
import { SocialInviteModal } from "@/components/SocialInviteModal";
import { EmptyState, Modal, Skeleton, TextInput } from "@/components/ui";
import { api, ApiError, type CommentItem, type MoodItem } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useLikePlacement } from "@/lib/like-placement";
import { useSession } from "@/lib/session";

/**
 * Flux Mood vertical, immersif : un mood par écran, défilement snap,
 * overlay façon Reels/TikTok. Le lieu n’apparaît que s’il a été renseigné.
 * Le like reste unique et transférable : sous le cœur, le temps /H /J /M.
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
      <div className="phone-safe-top pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between px-4">
        <p className="text-[22px] font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]">{messages.nav.mood}</p>
        <div className="pointer-events-auto flex items-center gap-2.5">
          <Link
            href="/compose?type=mood"
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
  const { refresh: refreshPlacement } = useLikePlacement();
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
  const place = moodPlaceFromItem(mood);
  const liked = mood.likeTime?.likedByMe ?? mood.likedByMe ?? false;
  const canJoin = Boolean(user && user.id !== mood.author.id);
  const captionLong = (mood.body ?? "").length > 90;

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
    <section ref={registerRef} className="relative h-full w-full snap-start snap-always">
      {mood.videoUrl ? (
        <MoodVideo src={mood.videoUrl} muted={muted} onToggleMute={() => setMuted((v) => !v)} />
      ) : mood.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={mood.imageUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="grid h-full w-full place-items-center bg-gradient-to-br from-accent via-accent-hover to-ink px-8 text-center">
          <p className="type-h2 text-on-primary">{mood.body || messages.world.typeMood}</p>
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/75" />

      <div className="absolute bottom-[max(8.75rem,calc(8.25rem+env(safe-area-inset-bottom)))] right-2.5 z-10">
        <MoodLikeRail
          liked={liked}
          likeTime={mood.likeTime}
          commentsCount={mood.commentsCount}
          onLike={() => void like(false)}
          onComments={() => setCommentsOpen(true)}
          onShare={() => void share()}
          onMore={() => setMoreOpen(true)}
        />
      </div>

      <div className="absolute inset-x-0 bottom-[max(8.75rem,calc(8.25rem+env(safe-area-inset-bottom)))] z-10 px-4 pr-[4.75rem] text-white">
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
        {mood.videoUrl ? (
          <button
            type="button"
            onClick={() => setMuted((v) => !v)}
            className="type-caption mt-2 inline-flex items-center gap-1.5 font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]"
            aria-label={muted ? "Activer le son" : "Couper le son"}
          >
            <span className="grid h-5 w-5 place-items-center rounded-full bg-white/15">
              <MusicIcon size={11} />
            </span>
            {messages.world.moodAudioOriginal}
          </button>
        ) : null}
        {copied ? <p className="type-caption mt-2 font-semibold">{messages.social.copied}</p> : null}
      </div>

      <div className="absolute inset-x-0 bottom-[max(5.35rem,calc(4.85rem+env(safe-area-inset-bottom)))] z-10 px-4">
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
      <MoodComments moodId={mood.id} open={commentsOpen} onClose={() => setCommentsOpen(false)} onSent={() => onChange({ commentsCount: mood.commentsCount + 1 })} />
      <Modal open={moreOpen} title={messages.world.moodActions} onClose={() => setMoreOpen(false)}>
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

/**
 * Vidéo courte en boucle, muette par défaut (autoplay navigateur), qui ne joue
 * que lorsque son écran est réellement visible dans le flux — comme Reels/TikTok.
 */
function MoodVideo({
  src,
  muted,
  onToggleMute,
}: {
  src: string;
  muted: boolean;
  onToggleMute: () => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);

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
    <button type="button" aria-label={muted ? "Activer le son" : "Couper le son"} onClick={onToggleMute} className="relative block h-full w-full">
      <video
        ref={ref}
        src={src}
        muted={muted}
        loop
        playsInline
        preload="metadata"
        className="h-full w-full object-cover"
      />
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
