"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Avatar, CertifiedMark } from "@/components/Avatar";
import { EventCard } from "@/components/EventCard";
import { MapThumb } from "@/components/MapThumb";
import { MessageIcon, PlayIcon } from "@/components/Icons";
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
      <EventMoods eventId={event.id} />
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

type EventMood = {
  id: string;
  body: string;
  imageUrl: string | null;
  videoUrl: string | null;
  activity: string | null;
  active: boolean;
  author: { id: string; firstName: string; lastName: string; avatarUrl: string | null };
};

/** Boucle contenu social ↔ monde réel (#4-6, #46) : ce que les gens vivent/ont vécu ici. */
function EventMoods({ eventId }: { eventId: string }) {
  const { messages } = useI18n();
  const [items, setItems] = useState<EventMood[] | null>(null);

  useEffect(() => {
    api<{ items: EventMood[] }>(`/events/${eventId}/moods`)
      .then((d) => setItems(d.items))
      .catch(() => setItems([]));
  }, [eventId]);

  if (items === null) return null;
  if (items.length === 0) return null;

  return (
    <section>
      <p className="type-heading mb-2 text-ink">{messages.world.eventMoodsTitle}</p>
      <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
        {items.map((m) => (
          <Link
            key={m.id}
            href={`/mood?start=${m.id}`}
            className="tap-scale w-32 shrink-0 overflow-hidden rounded-card bg-surface shadow-xs transition hover:shadow-sm"
          >
            <div className="relative h-40 bg-gradient-to-br from-accent/15 to-yellow/15">
              {m.videoUrl ? (
                <video src={m.videoUrl} muted loop playsInline preload="metadata" className="h-full w-full object-cover" />
              ) : m.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.imageUrl} alt="" className="h-full w-full object-cover" />
              ) : null}
              {m.videoUrl ? (
                <span className="absolute right-1.5 top-1.5 rounded-full bg-black/55 p-1 text-white">
                  <PlayIcon size={10} />
                </span>
              ) : null}
              {!m.active ? (
                <span className="type-caption absolute left-1.5 top-1.5 rounded-full bg-black/55 px-1.5 py-0.5 text-white">
                  {messages.world.endedBadge}
                </span>
              ) : null}
            </div>
            <p className="type-caption truncate p-1.5 text-ink">{m.author.firstName}</p>
          </Link>
        ))}
      </div>
    </section>
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
