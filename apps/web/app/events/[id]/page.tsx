"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Avatar, CertifiedMark } from "@/components/Avatar";
import { EventCard } from "@/components/EventCard";
import { MapThumb } from "@/components/MapThumb";
import { MessageIcon } from "@/components/Icons";
import { CardSkeleton, ErrorBanner, PrimaryButton, SecondaryButton } from "@/components/ui";
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
  if (!event) return <CardSkeleton />;

  return (
    <div className="space-y-4 px-4 py-4">
      <EventCard event={event} onChanged={setEvent} />
      <div className="overflow-hidden rounded-card shadow-xs">
        <MapThumb city={event.city} zone={event.zone} className="h-40 w-full border-0" />
        <p className="type-caption bg-surface px-4 py-2.5 text-muted">
          {messages.world.approximate} · {event.city}
          {event.zone ? ` - ${event.zone}` : ""}
          {event.venue ? ` · ${event.venue}` : ""}
        </p>
      </div>
      {event.description ? <p className="type-body leading-6 text-ink">{event.description}</p> : null}
      {event.people?.length ? (
        <section className="rounded-card bg-surface p-4 shadow-card">
          <p className="type-heading text-ink">{messages.world.peopleLinked}</p>
          <div className="mt-3 space-y-2.5">
            {event.people.map((p) => (
              <Link key={p.id} href={`/u/${p.username}`} className="flex items-center gap-3">
                <Avatar src={p.avatarUrl} firstName={p.firstName} lastName={p.lastName} size="sm" />
                <span className="type-body-sm flex-1 text-ink">
                  {p.firstName} {p.lastName} {p.certified ? <CertifiedMark /> : null}
                </span>
                <span className="type-caption text-muted">{p.status}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
      <EventReviews eventId={event.id} />
      {event.isHost ? (
        <PrimaryButton onClick={() => router.push(`/events/${event.id}/manage`)}>
          {messages.booking.manageEvent}
        </PrimaryButton>
      ) : null}
      {event.canChatGroup ? (
        <SecondaryButton
          onClick={async () => {
            const conv = await api<{ id: string }>("/conversations/event", {
              method: "POST",
              body: JSON.stringify({ eventId: event.id }),
            });
            router.push(`/messages/${conv.id}`);
          }}
        >
          <span className="inline-flex items-center justify-center gap-2">
            <MessageIcon size={15} />
            {messages.chat.groupFromEvent}
          </span>
        </SecondaryButton>
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
      <p className="type-heading text-ink">{messages.reviews.title}</p>
      {items && items.length === 0 ? <p className="type-body-sm mt-2 text-muted">{messages.reviews.empty}</p> : null}
      <div className="mt-3 space-y-3">
        {items?.map((r) => (
          <article key={r.id}>
            <p className="type-body-sm flex items-center gap-1 font-semibold text-accent">
              {r.author.firstName} {r.author.lastName} {r.author.certified ? <CertifiedMark /> : null}
            </p>
            <p className="type-body-sm text-ink">{r.body}</p>
          </article>
        ))}
      </div>
      {canReview ? (
        <div className="mt-4 space-y-3">
          <p className="type-caption text-muted">{messages.reviews.ratingHint}</p>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={messages.reviews.bodyPlaceholder}
            className="type-body min-h-24 w-full rounded-xl border border-border bg-surface p-3.5 text-ink transition placeholder:text-subtle focus:border-accent"
          />
          <PrimaryButton disabled={busy || !body.trim()} onClick={() => void submit()}>
            {messages.reviews.send}
          </PrimaryButton>
        </div>
      ) : reason === "TOO_EARLY" ? (
        <p className="type-body-sm mt-3 text-muted">{messages.reviews.notYet}</p>
      ) : reason === "ALREADY" || sent ? (
        <p className="type-body-sm mt-3 text-muted">{sent ? messages.reviews.sent : messages.reviews.already}</p>
      ) : null}
    </section>
  );
}
