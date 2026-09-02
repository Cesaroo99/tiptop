"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CalendarIcon, PinIcon } from "@/components/Icons";
import { Logo } from "@/components/Logo";
import { ErrorBanner, ScreenHeader } from "@/components/ui";
import { api, type TicketItem } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { formatEventWhen } from "@/lib/time";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const { locale, messages } = useI18n();
  const router = useRouter();
  const [ticket, setTicket] = useState<TicketItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<TicketItem>(`/tickets/${id}`)
      .then(setTicket)
      .catch(() => setError(messages.common.error));
  }, [id, messages.common.error]);

  if (error) {
    return (
      <main className="mx-auto min-h-dvh max-w-lg px-4 py-4">
        <ScreenHeader title={messages.world.tabTickets} onBack={() => router.back()} />
        <ErrorBanner message={error} />
      </main>
    );
  }
  if (!ticket) return <p className="p-4 text-sm text-muted">{messages.common.loading}</p>;

  const consumed = ticket.status === "CONSUMED";

  return (
    <main className="mx-auto min-h-dvh max-w-lg px-4 py-4">
      <ScreenHeader title={consumed ? messages.booking.ticketConsumed : messages.booking.ticketActive} onBack={() => router.back()} />
      <div className={`overflow-hidden rounded-card bg-surface shadow-elevated ${consumed ? "opacity-70 grayscale" : ""}`}>
        <div className="bg-gradient-to-br from-accent to-accent-active px-6 py-5 text-center">
          <div className="flex items-center justify-center gap-2">
            <Logo size={26} withWordmark={false} />
            <span className="type-h4 text-white">TipTop</span>
          </div>
          <span className="type-label mt-2 inline-block text-white/80">
            {consumed ? messages.booking.ticketConsumed : messages.booking.ticketActive}
          </span>
        </div>
        <div className="px-6 py-6 text-center">
          <p className="type-h3 text-ink">{ticket.event.title}</p>
          <p className="type-body-sm mt-2 inline-flex items-center gap-1.5 text-muted">
            <CalendarIcon size={14} />
            {formatEventWhen(ticket.event.startsAt, locale)}
          </p>
          <p className="type-body-sm mt-1 inline-flex items-center gap-1.5 text-muted">
            <PinIcon size={14} />
            {ticket.event.city}
            {ticket.event.zone ? ` - ${ticket.event.zone}` : ""}
          </p>
          <p className="type-caption mt-2 text-muted">
            {ticket.holder.firstName} {ticket.holder.lastName}
          </p>

          <div className="ticket-divider" />

          {consumed ? (
            <div className="rounded-lg bg-surface-sunken px-4 py-10 type-body-sm text-muted">{messages.booking.ticketQrInactive}</div>
          ) : ticket.qrActive && ticket.qr ? (
            <QrPattern value={ticket.qr} />
          ) : (
            <p className="type-body-sm text-muted">{messages.booking.ticketQrLater}</p>
          )}
          {ticket.qr ? <p className="mt-4 break-all font-mono text-[11px] text-muted">{ticket.qr}</p> : null}
          <p className="type-caption mt-3 text-muted">{messages.booking.ticketQrHint}</p>
        </div>
      </div>
      <Link href={`/events/${ticket.event.id}`} className="type-body-sm mt-4 block text-center font-semibold text-accent">
        {ticket.event.title}
      </Link>
      {consumed ? (
        <Link href={`/events/${ticket.event.id}`} className="type-body-sm mt-2 block text-center font-semibold text-accent">
          {messages.reviews.write}
        </Link>
      ) : null}
    </main>
  );
}

function QrPattern({ value }: { value: string }) {
  const size = 21;
  const cells: boolean[] = [];
  for (let i = 0; i < size * size; i++) {
    const c = value.charCodeAt(i % value.length) + i * 7;
    cells.push(c % 3 !== 0);
  }
  return (
    <div className="mx-auto mt-6 grid w-56 grid-cols-[repeat(21,minmax(0,1fr))] gap-px rounded-2xl bg-white p-3">
      {cells.map((on, i) => (
        <div key={i} className={on ? "aspect-square bg-black" : "aspect-square bg-white"} />
      ))}
    </div>
  );
}
