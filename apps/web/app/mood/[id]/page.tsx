"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ErrorBanner, Modal, TextInput } from "@/components/ui";
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
    if (!mood || user?.id === mood.author.id) return;
    try {
      if (mood.likedAuthor) {
        await api(`/users/${mood.author.id}/like`, { method: "DELETE" });
        setMood({ ...mood, likedAuthor: false });
        return;
      }
      await api(`/users/${mood.author.id}/like`, {
        method: "POST",
        body: JSON.stringify({ confirmTransfer }),
      });
      setMood({ ...mood, likedAuthor: true });
      setTransfer(null);
    } catch (e) {
      if (e instanceof ApiError && String(e.code).includes("TRANSFER")) {
        const preview = await api<{ wouldTransferFrom: { firstName: string; lastName: string } | null }>(
          `/users/${mood.author.id}/like/preview`,
        );
        setTransfer(
          preview.wouldTransferFrom
            ? `${preview.wouldTransferFrom.firstName} ${preview.wouldTransferFrom.lastName}`
            : "…",
        );
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
          <p className="mt-2 text-ink">{mood.body}</p>
          {mood.event ? (
            <Link href={`/events/${mood.event.id}`} className="mt-2 block text-sm text-accent">
              {mood.event.title}
            </Link>
          ) : null}
          <p className="mt-2 text-xs text-muted">
            {mood.authorActiveLikes} likes · {messages.world.availableUntil.replace("{time}", new Date(mood.expiresAt).toLocaleTimeString())}
          </p>
          <button
            type="button"
            onClick={() => void like(false)}
            className={`mt-3 rounded-full px-4 py-2 ${mood.likedAuthor ? "bg-accent text-white" : "bg-[var(--border)]"}`}
          >
            ♥ {messages.social.likePerson}
          </button>
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
      <Modal
        open={Boolean(transfer)}
        title={messages.social.transferTitle}
        onClose={() => setTransfer(null)}
        onConfirm={() => void like(true)}
        confirmLabel={messages.common.confirm}
      >
        {messages.social.transferBody.replace("{name}", transfer ?? "")}
      </Modal>
    </div>
  );
}
