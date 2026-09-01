"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ErrorBanner, PrimaryButton, Skeleton } from "@/components/ui";
import { api, ApiError, type EventCard, type ReservationItem } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

export default function Page() {
  return (
    <AppShell>
      <BookSheet />
    </AppShell>
  );
}

function BookSheet() {
  const { id } = useParams<{ id: string }>();
  const { messages } = useI18n();
  const router = useRouter();
  const [event, setEvent] = useState<EventCard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api<EventCard>(`/events/${id}`)
      .then(setEvent)
      .catch(() => setError(messages.common.error));
  }, [id, messages.common.error]);

  async function book() {
    setLoading(true);
    setError(null);
    try {
      const res = await api<ReservationItem>("/reservations", {
        method: "POST",
        body: JSON.stringify({ eventId: id, includeSelf: true }),
      });
      if (res.needsPayment) {
        router.replace(`/events/${id}/pay?reservationId=${res.id}`);
      } else {
        const ticketId = res.tickets[0]?.id;
        router.replace(ticketId ? `/tickets/${ticketId}` : "/tickets");
      }
    } catch (e) {
      if (e instanceof ApiError && e.code === "EVENT_FULL") setError(messages.booking.full);
      else if (e instanceof ApiError && e.code === "ALREADY_IN") router.replace("/tickets");
      else setError(messages.common.error);
    } finally {
      setLoading(false);
    }
  }

  if (!event && !error) return <Skeleton className="mx-4 mt-4 h-64" />;
  if (error && !event) return <ErrorBanner message={error} />;

  const amount = event ? event.priceXaf : 0;

  return (
    <div className="px-4 py-6">
      <h1 className="text-lg font-semibold">{messages.booking.reserve}</h1>
      <p className="mt-1 text-sm text-muted">{event?.title}</p>
      <div className="mt-4 rounded-card bg-surface p-4 shadow-card">
        <p className="font-semibold">{messages.booking.bookSelf}</p>
        <p className="mt-2 text-sm text-muted">
          {amount > 0 ? messages.booking.amount.replace("{amount}", String(amount)) : messages.world.free}
        </p>
      </div>
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      <div className="mt-6">
        <PrimaryButton loading={loading} onClick={() => void book()}>
          {amount > 0 ? messages.booking.pay : messages.booking.reserve}
        </PrimaryButton>
      </div>
    </div>
  );
}
