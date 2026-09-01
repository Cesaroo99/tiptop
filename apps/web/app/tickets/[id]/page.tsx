"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ErrorBanner, ScreenHeader } from "@/components/ui";
import { api, type TicketItem } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const { messages } = useI18n();
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
      <div className="rounded-card bg-surface p-5 text-center shadow-card">
        <p className="font-semibold text-accent">{ticket.event.title}</p>
        <p className="mt-1 text-xs text-muted">
          {new Date(ticket.event.startsAt).toLocaleString()} · {ticket.event.city}
        </p>
        {consumed ? (
          <div className="mt-6 rounded-2xl bg-[var(--border)] px-4 py-10 text-sm text-muted">{messages.booking.ticketQrInactive}</div>
        ) : ticket.qrActive && ticket.qr ? (
          <QrPattern value={ticket.qr} />
        ) : (
          <p className="mt-6 text-sm text-muted">{messages.booking.ticketQrLater}</p>
        )}
        {ticket.qr ? (
          <p className="mt-4 break-all font-mono text-[11px] text-muted">{ticket.qr}</p>
        ) : null}
        <p className="mt-3 text-xs text-muted">{messages.booking.ticketQrHint}</p>
        <Link href={`/events/${ticket.event.id}`} className="mt-4 inline-block text-sm text-accent">
          {ticket.event.title}
        </Link>
      </div>
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
