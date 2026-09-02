"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Avatar, CertifiedMark } from "@/components/Avatar";
import { ClockIcon, FlagIcon, HeartIcon, PinIcon, SparklesIcon } from "@/components/Icons";
import { LikeDialogs, likeErrorKind } from "@/components/LikeDialogs";
import { ReportModal } from "@/components/ReportModal";
import { SocialInviteModal } from "@/components/SocialInviteModal";
import { ErrorBanner, IconButton, TextInput } from "@/components/ui";
import { api, ApiError, type CommentItem, type MoodItem } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";

export default function Page() {
  return (
    <AppShell>
      <MoodViewer />
    </AppShell>
  );
}

function MoodViewer() {
  const { id } = useParams<{ id: string }>();
  const { messages } = useI18n();
  const { user } = useSession();
  const [mood, setMood] = useState<MoodItem | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [transfer, setTransfer] = useState<string | null>(null);
  const [buy, setBuy] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  async function load() {
    try {
      const [m, c] = await Promise.all([
        api<MoodItem>(`/moods/${id}`),
        api<{ items: CommentItem[] }>(`/moods/${id}/comments`),
      ]);
      setMood(m);
      setComments(c.items);
    } catch {
      setError(messages.world.moodExpired);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function like(confirmTransfer = false) {
    if (!mood) return;
    const liked = mood.likeTime?.likedByMe ?? mood.likedByMe ?? false;
    try {
      if (liked) {
        await api("/likes", {
          method: "DELETE",
          body: JSON.stringify({ targetType: "mood", targetId: mood.id }),
        });
        setMood({
          ...mood,
          likedByMe: false,
          likeTime: {
            totalSeconds: mood.likeTime?.totalSeconds ?? 0,
            activeCount: Math.max(0, (mood.likeTime?.activeCount ?? 1) - 1),
            likedByMe: false,
            label: mood.likeTime?.label ?? "0 s",
          },
        });
        return;
      }
      await api("/likes", {
        method: "POST",
        body: JSON.stringify({ targetType: "mood", targetId: mood.id, confirmTransfer }),
      });
      setMood({
        ...mood,
        likedByMe: true,
        likeTime: {
          totalSeconds: mood.likeTime?.totalSeconds ?? 0,
          activeCount: (mood.likeTime?.activeCount ?? 0) + 1,
          likedByMe: true,
          label: mood.likeTime?.label ?? "0 s",
        },
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
        if (kind === "transfer") {
          setTransfer(messages.social.transferGeneric);
        }
      }
    }
  }

  async function send() {
    if (!body.trim()) return;
    const c = await api<CommentItem>(`/moods/${id}/comments`, {
      method: "POST",
      body: JSON.stringify({ body }),
    });
    setComments((cur) => [...cur, c]);
    setBody("");
  }

  if (error) return <ErrorBanner message={error} />;
  if (!mood) return <p className="p-4 text-sm text-muted">{messages.common.loading}</p>;

  const liked = mood.likeTime?.likedByMe ?? mood.likedByMe;

  return (
    <div className="px-4 py-4">
      <div className="overflow-hidden rounded-card bg-surface shadow-card">
        {mood.videoUrl ? (
          <video src={mood.videoUrl} controls loop muted playsInline className="h-56 w-full object-cover" />
        ) : mood.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mood.imageUrl} alt="" className="h-56 w-full object-cover" />
        ) : (
          <div className="grid h-40 place-items-center bg-gradient-to-br from-accent/15 to-yellow/15 type-h3 text-accent">
            {messages.world.typeMood}
          </div>
        )}
        <div className="p-4">
          <div className="flex items-center gap-2.5">
            <Link href={`/u/${mood.author.username}`} className="flex items-center gap-2.5">
              <Avatar src={mood.author.avatarUrl} firstName={mood.author.firstName} lastName={mood.author.lastName} size="sm" ring="accent" />
              <span className="type-body-sm flex items-center gap-1 font-semibold text-ink">
                {mood.author.firstName} {mood.author.lastName}
                {mood.author.certified ? <CertifiedMark /> : null}
              </span>
            </Link>
            {mood.companion ? (
              <Link href={`/u/${mood.companion.username}`} className="type-body-sm font-semibold text-muted">
                · {messages.world.moodWith.replace("{name}", mood.companion.firstName)}
              </Link>
            ) : null}
          </div>
          {mood.activity ? (
            <p className="type-body-sm mt-3 inline-flex rounded-lg bg-accent-soft px-2.5 py-1.5 font-semibold text-accent">
              {mood.activity}
            </p>
          ) : null}
          <p className="type-body mt-2 text-ink">{mood.body}</p>
          {mood.zone ? (
            <p className="type-caption mt-1 inline-flex items-center gap-1 text-muted">
              <PinIcon size={12} />
              {mood.city} - {mood.zone}
            </p>
          ) : null}
          {mood.event ? (
            <Link href={`/events/${mood.event.id}`} className="type-body-sm mt-2 block font-semibold text-accent">
              {mood.event.title}
            </Link>
          ) : null}
          <p className="type-caption mt-2 inline-flex items-center gap-1.5 text-muted">
            {mood.likeTime
              ? messages.likeTime.ofDuration.replace("{duration}", mood.likeTime.label)
              : messages.social.likesNow.replace("{n}", String(mood.authorActiveLikes))}
            <span className="text-border">·</span>
            <ClockIcon size={12} />
            {messages.world.availableUntil.replace("{time}", new Date(mood.expiresAt).toLocaleTimeString())}
          </p>
          <div className="mt-4 flex items-center gap-2">
            <IconButton label={liked ? messages.social.likeHere : messages.social.likePlace} tone={liked ? "accent" : "neutral"} onClick={() => void like(false)}>
              <HeartIcon size={17} filled={liked} />
            </IconButton>
            {user && user.id !== mood.author.id ? (
              <button
                type="button"
                onClick={() => setJoinOpen(true)}
                className="tap-scale type-button flex items-center gap-1.5 rounded-pill bg-accent px-4 py-2.5 text-on-primary shadow-sm transition hover:bg-accent-hover"
              >
                <SparklesIcon size={15} />
                {messages.socialInvite.joinNow}
              </button>
            ) : null}
            {user && user.id !== mood.author.id ? (
              <IconButton label={messages.admin.report} tone="danger" onClick={() => setReportOpen(true)}>
                <FlagIcon size={14} />
              </IconButton>
            ) : null}
          </div>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {comments.map((c) => (
          <p key={c.id} className="type-body-sm rounded-lg bg-surface px-3.5 py-2.5 shadow-xs">
            <span className="font-semibold text-accent">{c.author.firstName}</span> {c.body}
          </p>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <TextInput value={body} onChange={(e) => setBody(e.target.value)} placeholder={messages.social.addComment} className="flex-1" />
        <button type="button" onClick={() => void send()} className="tap-scale type-button rounded-pill bg-accent px-5 text-on-primary transition hover:bg-accent-hover">
          OK
        </button>
      </div>
      <LikeDialogs
        transferName={transfer}
        buyOpen={buy}
        onCloseTransfer={() => setTransfer(null)}
        onConfirmTransfer={() => void like(true)}
        onCloseBuy={() => setBuy(false)}
      />
      {mood ? (
        <SocialInviteModal
          open={joinOpen}
          inviteeId={mood.author.id}
          defaultContext="MEETUP"
          defaultLabel={mood.activity ?? ""}
          onClose={() => setJoinOpen(false)}
        />
      ) : null}
      <ReportModal open={reportOpen} kind="MOOD" moodId={id} onClose={() => setReportOpen(false)} />
    </div>
  );
}
