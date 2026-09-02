"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { LikeDialogs, likeErrorKind } from "@/components/LikeDialogs";
import { ReportModal } from "@/components/ReportModal";
import { SocialInviteModal } from "@/components/SocialInviteModal";
import { ErrorBanner, TextInput } from "@/components/ui";
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

  return (
    <div className="px-4 py-4">
      <div className="overflow-hidden rounded-card bg-surface shadow-card">
        {mood.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mood.imageUrl} alt="" className="h-56 w-full object-cover" />
        ) : (
          <div className="grid h-40 place-items-center bg-accent/10 text-accent">{messages.world.typeMood}</div>
        )}
        <div className="p-4">
          <Link href={`/u/${mood.author.username}`} className="font-semibold text-accent">
            {mood.author.firstName} {mood.author.lastName} {mood.author.certified ? "✓" : ""}
          </Link>
          {mood.activity ? <p className="mt-1 type-body-sm font-semibold text-accent">{mood.activity}</p> : null}
          <p className="mt-2 text-ink">{mood.body}</p>
          {mood.zone ? (
            <p className="mt-1 type-caption text-muted">
              📍 {mood.city} - {mood.zone}
            </p>
          ) : null}
          {mood.event ? (
            <Link href={`/events/${mood.event.id}`} className="mt-2 block text-sm text-accent">
              {mood.event.title}
            </Link>
          ) : null}
          <p className="mt-2 text-xs text-muted">
            {mood.likeTime
              ? messages.likeTime.ofDuration.replace("{duration}", mood.likeTime.label)
              : messages.social.likesNow.replace("{n}", String(mood.authorActiveLikes))}{" "}
            · {messages.world.availableUntil.replace("{time}", new Date(mood.expiresAt).toLocaleTimeString())}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void like(false)}
              className={`rounded-full px-4 py-2 ${(mood.likeTime?.likedByMe ?? mood.likedByMe) ? "bg-accent text-white" : "bg-[var(--border)]"}`}
            >
              ♥ {(mood.likeTime?.likedByMe ?? mood.likedByMe) ? messages.social.likeHere : messages.social.likePlace}
            </button>
            {user && user.id !== mood.author.id ? (
              <button
                type="button"
                onClick={() => setJoinOpen(true)}
                className="rounded-full bg-accent px-4 py-2 font-semibold text-white"
              >
                {messages.socialInvite.joinNow}
              </button>
            ) : null}
            {user && user.id !== mood.author.id ? (
              <button
                type="button"
                onClick={() => setReportOpen(true)}
                className="rounded-full bg-[var(--border)] px-4 py-2 text-sm"
              >
                {messages.admin.report}
              </button>
            ) : null}
          </div>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {comments.map((c) => (
          <p key={c.id} className="rounded-2xl bg-surface px-3 py-2 text-sm shadow-card">
            <span className="font-semibold text-accent">{c.author.firstName}</span> {c.body}
          </p>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <TextInput value={body} onChange={(e) => setBody(e.target.value)} placeholder={messages.social.addComment} />
        <button type="button" onClick={() => void send()} className="rounded-pill bg-accent px-4 font-semibold text-white">
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
