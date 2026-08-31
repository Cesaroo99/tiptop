"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { EmptyState, ScreenHeader } from "@/components/ui";
import { api, ApiError, type InvitationItem, type ReservationItem, type TicketItem } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import Link from "next/link";

export default function Page() {
  const { messages } = useI18n();
  const router = useRouter();
  const [tab, setTab] = useState<"tickets" | "invites" | "reservations">("tickets");
  const [box, setBox] = useState<"received" | "sent">("received");
  const [invites, setInvites] = useState<InvitationItem[]>([]);
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [reservations, setReservations] = useState<ReservationItem[]>([]);
  const [note, setNote] = useState<string | null>(null);

  async function loadInvites(next = box) {
    const data = await api<{ items: InvitationItem[] }>(`/invitations?box=${next}`);
    setInvites(data.items);
  }

  useEffect(() => {
    api<{ items: TicketItem[] }>("/tickets")
      .then((d) => setTickets(d.items))
      .catch(() => setTickets([]));
    api<{ items: ReservationItem[] }>("/reservations")
      .then((d) => setReservations(d.items))
      .catch(() => setReservations([]));
  }, []);

  useEffect(() => {
    void loadInvites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [box]);

  async function act(id: string, action: "accept" | "refuse") {
    try {
      const res = await api<InvitationItem & { reservation?: ReservationItem }>(`/invitations/${id}/${action}`, {
        method: "POST",
      });
      if (res.needsPayment && res.reservation) {
        router.push(`/events/${res.event.id}/pay?reservationId=${res.reservation.id}`);
        return;
      }
      await loadInvites();
    } catch (e) {
      if (e instanceof ApiError && e.code === "HOST_PAYMENT_PENDING") {
        setNote(messages.booking.hostPayPending);
      } else if (e instanceof ApiError && String(e.code).includes("PAYMENT")) {
        setNote(messages.world.paymentLater);
      } else {
        setNote(messages.common.error);
      }
    }
  }

  const statusLabel: Record<string, string> = {
    PENDING: messages.world.pending,
    ACCEPTED: messages.world.accepted,
    REFUSED: messages.world.refused,
    EXPIRED: messages.world.expired,
    CANCELLED: messages.world.refused,
    CONFIRMED: messages.booking.confirmed,
    AWAITING_PAYMENT: messages.booking.awaiting,
    CONSUMED: messages.booking.ticketConsumed,
    PAST: messages.booking.past,
  };

  return (
    <main className="mx-auto min-h-dvh max-w-lg px-4 py-4">
      <ScreenHeader title={messages.menu.tickets} onBack={() => router.back()} />
      <div className="mb-4 flex gap-3 text-sm">
        {(["tickets", "invites", "reservations"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={tab === t ? "border-b-2 border-accent font-semibold text-accent" : "text-muted"}
          >
            {t === "tickets" ? messages.world.tabTickets : t === "invites" ? messages.world.tabInvites : messages.world.tabReservations}
          </button>
        ))}
      </div>
      {tab === "tickets" ? (
        <div className="space-y-3">
          {tickets.length === 0 ? <EmptyState title={messages.world.tabTickets} body={messages.booking.ticketsEmpty} /> : null}
          {tickets.map((t) => (
            <Link key={t.id} href={`/tickets/${t.id}`} className="block rounded-card bg-surface p-4 shadow-card">
              <p className="font-semibold text-accent">{t.event.title}</p>
              <p className="text-xs text-muted">
                {statusLabel[t.status] ?? t.status} · {new Date(t.event.startsAt).toLocaleString()}
              </p>
            </Link>
          ))}
        </div>
      ) : null}
      {tab === "reservations" ? (
        <div className="space-y-3">
          {reservations.length === 0 ? (
            <EmptyState title={messages.world.tabReservations} body={messages.world.reservationsEmpty} />
          ) : null}
          {reservations.map((r) => (
            <article key={r.id} className="rounded-card bg-surface p-4 shadow-card">
              <p className="font-semibold text-accent">{r.event?.title ?? r.eventId}</p>
              <p className="text-xs text-muted">
                {statusLabel[r.status] ?? r.status} · {r.seats} · {r.amountXaf} FCFA
              </p>
              {r.needsPayment ? (
                <Link href={`/events/${r.eventId}/pay?reservationId=${r.id}`} className="mt-2 inline-block text-sm font-semibold text-accent">
                  {messages.booking.pay}
                </Link>
              ) : r.tickets[0] ? (
                <Link href={`/tickets/${r.tickets[0].id}`} className="mt-2 inline-block text-sm text-accent">
                  {messages.booking.seeTicket}
                </Link>
              ) : null}
            </article>
          ))}
        </div>
      ) : null}
      {tab === "invites" ? (
        <div>
          <div className="mb-3 flex gap-2 text-xs">
            <button type="button" onClick={() => setBox("received")} className={`rounded-pill px-3 py-1 ${box === "received" ? "bg-accent text-white" : "bg-[var(--border)]"}`}>
              {messages.world.inviteReceived}
            </button>
            <button type="button" onClick={() => setBox("sent")} className={`rounded-pill px-3 py-1 ${box === "sent" ? "bg-accent text-white" : "bg-[var(--border)]"}`}>
              {messages.world.inviteSentBox}
            </button>
          </div>
          {note ? <p className="mb-3 text-sm text-muted">{note}</p> : null}
          {invites.length === 0 ? <EmptyState title={messages.world.tabInvites} body={messages.world.invitationsEmpty} /> : null}
          <div className="space-y-3">
            {invites.map((inv) => (
              <article key={inv.id} className="rounded-card bg-surface p-4 shadow-card">
                <p className="font-semibold text-accent">{inv.event.title}</p>
                <p className="text-xs text-muted">
                  {inv.inviter.firstName} → {inv.invitee.firstName} · {statusLabel[inv.status] ?? inv.status}
                </p>
                {box === "received" && inv.status === "PENDING" ? (
                  <div className="mt-3 flex gap-2">
                    <button type="button" className="flex-1 rounded-pill bg-accent py-2 text-white" onClick={() => void act(inv.id, "accept")}>
                      {messages.world.accept}
                    </button>
                    <button type="button" className="flex-1 rounded-pill bg-[var(--border)] py-2" onClick={() => void act(inv.id, "refuse")}>
                      {messages.world.refuse}
                    </button>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </main>
  );
}
