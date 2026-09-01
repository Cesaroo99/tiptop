"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { EventCard } from "@/components/EventCard";
import { ErrorBanner, Skeleton } from "@/components/ui";
import { api, type EventCard as EventCardType } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

export default function Page() {
  return (
    <AppShell>
      <EventDetail />
    </AppShell>
  );
}

function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const { messages } = useI18n();
  const router = useRouter();
  const [event, setEvent] = useState<EventCardType | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setEvent(await api<EventCardType>(`/events/${id}`));
    } catch {
      setError(messages.common.error);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (error) return <ErrorBanner message={error} onRetry={() => void load()} />;
  if (!event) return <Skeleton className="mx-4 mt-4 h-80" />;

  return (
    <div className="space-y-4 px-4 py-4">
      <EventCard event={event} onChanged={setEvent} />
      <div
        className={`grid h-36 place-items-center rounded-2xl text-sm ${event.zone ? "bg-[var(--border)] text-muted" : "bg-accent/10 text-accent"}`}
      >
        {messages.world.approximate}
        <span className="mt-1 block text-xs">
          {event.city}
          {event.zone ? ` - ${event.zone}` : ""}
          {event.venue ? ` · ${event.venue}` : ""}
        </span>
      </div>
      <section className="rounded-card bg-surface p-4 shadow-card">
        <p className="font-semibold">{messages.world.peopleLinked}</p>
        <div className="mt-3 space-y-2">
          {event.people?.map((p) => (
            <Link key={p.id} href={`/u/${p.username}`} className="flex items-center justify-between text-sm">
              <span className="text-accent">
                {p.firstName} {p.lastName} {p.certified ? "✓" : ""}
              </span>
              <span className="text-xs text-muted">{p.status}</span>
            </Link>
          ))}
        </div>
      </section>
      {event.description ? <p className="text-sm leading-6 text-ink">{event.description}</p> : null}
      <EventReviews eventId={event.id} />
      {event.isHost ? (
        <Link href={`/events/${event.id}/manage`} className="block w-full rounded-pill bg-accent py-3 text-center text-sm font-semibold text-white">
          {messages.booking.manageEvent}
        </Link>
      ) : null}
      {event.canChatGroup ? (
        <button
          type="button"
          className="w-full rounded-pill bg-[var(--border)] py-3 text-sm font-semibold"
          onClick={async () => {
            const conv = await api<{ id: string }>("/conversations/event", {
              method: "POST",
              body: JSON.stringify({ eventId: event.id }),
            });
            router.push(`/messages/${conv.id}`);
          }}
        >
          {messages.chat.groupFromEvent}
        </button>
      ) : null}
    </div>
  );
}

type ReviewItem = {
  id: string;
  body: string;
  createdAt: string;
  author: { firstName: string; lastName: string; username: string; certified: boolean };
};

function EventReviews({ eventId }: { eventId: string }) {
  const { messages } = useI18n();
  const [items, setItems] = useState<ReviewItem[] | null>(null);
  const [canReview, setCanReview] = useState(false);
  const [reason, setReason] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function load() {
    const [list, gate] = await Promise.all([
      api<{ items: ReviewItem[] }>(`/events/${eventId}/reviews`),
      api<{ canReview: boolean; reason: string }>(`/events/${eventId}/reviews/gate`),
    ]);
    setItems(list.items);
    setCanReview(gate.canReview);
    setReason(gate.reason);
  }

  useEffect(() => {
    void load().catch(() => setItems([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  async function submit() {
    setBusy(true);
    try {
      await api(`/events/${eventId}/reviews`, { method: "POST", body: JSON.stringify({ body }) });
      setBody("");
      setSent(true);
      setCanReview(false);
      await load();
    } catch {
      setSent(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-card bg-surface p-4 shadow-card">
      <p className="font-semibold">{messages.reviews.title}</p>
      {items && items.length === 0 ? <p className="mt-2 text-sm text-muted">{messages.reviews.empty}</p> : null}
      <div className="mt-3 space-y-3">
        {items?.map((r) => (
          <article key={r.id}>
            <p className="text-sm font-semibold text-accent">
              {r.author.firstName} {r.author.lastName} {r.author.certified ? "✓" : ""}
            </p>
            <p className="text-sm text-ink">{r.body}</p>
          </article>
        ))}
      </div>
      {canReview ? (
        <div className="mt-4 space-y-2">
          <p className="text-xs text-muted">{messages.reviews.ratingHint}</p>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={messages.reviews.bodyPlaceholder}
            className="min-h-24 w-full rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-3 text-sm text-ink"
          />
          <button
            type="button"
            disabled={busy || !body.trim()}
            onClick={() => void submit()}
            className="w-full rounded-pill bg-accent py-3 text-sm font-semibold text-white disabled:opacity-40"
          >
            {messages.reviews.send}
          </button>
        </div>
      ) : reason === "TOO_EARLY" ? (
        <p className="mt-3 text-sm text-muted">{messages.reviews.notYet}</p>
      ) : reason === "ALREADY" || sent ? (
        <p className="mt-3 text-sm text-muted">{sent ? messages.reviews.sent : messages.reviews.already}</p>
      ) : null}
    </section>
  );
}
