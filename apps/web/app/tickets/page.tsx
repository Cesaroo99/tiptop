"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { CalendarIcon } from "@/components/Icons";
import { Chip, EmptyState, ScreenHeader } from "@/components/ui";
import { api, ApiError, type InvitationItem, type ReservationItem, type TicketItem } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import Link from "next/link";

export default function Page() {
  return (
    <Suspense>
      <TicketsPage />
    </Suspense>
  );
}

function TicketsPage() {
  const { messages } = useI18n();
  const router = useRouter();
  const params = useSearchParams();
  const initialTab = params.get("tab");
  const [tab, setTab] = useState<"tickets" | "invites" | "reservations">(
    initialTab === "invites" || initialTab === "reservations" ? initialTab : "tickets",
  );
  const [box, setBox] = useState<"received" | "sent">("received");
  const [invites, setInvites] = useState<InvitationItem[]>([]);
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [reservations, setReservations] = useState<ReservationItem[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const [pendingReviews, setPendingReviews] = useState<Array<{ eventId: string; title: string }>>([]);

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
    api<{ items: Array<{ eventId: string; title: string }> }>("/reviews/pending")
      .then((d) => setPendingReviews(d.items))
      .catch(() => setPendingReviews([]));
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
      {pendingReviews.length ? (
        <div className="mb-4 rounded-card bg-warning-soft p-4 shadow-xs">
          <p className="type-body-sm mb-2 font-semibold text-warning">{messages.reviews.pending}</p>
          {pendingReviews.map((p) => (
            <Link key={p.eventId} href={`/events/${p.eventId}`} className="type-body-sm block py-1 text-ink">
              {p.title} — {messages.reviews.write}
            </Link>
          ))}
        </div>
      ) : null}
      <div className="mb-4 flex gap-2">
        {(["tickets", "invites", "reservations"] as const).map((t) => (
          <Chip key={t} active={tab === t} onClick={() => setTab(t)}>
            {t === "tickets" ? messages.world.tabTickets : t === "invites" ? messages.world.tabInvites : messages.world.tabReservations}
          </Chip>
        ))}
      </div>
      {tab === "tickets" ? (
        <div className="space-y-3">
          {tickets.length === 0 ? <EmptyState title={messages.world.tabTickets} body={messages.booking.ticketsEmpty} icon={<CalendarIcon size={22} />} /> : null}
          {tickets.map((t) => (
            <Link key={t.id} href={`/tickets/${t.id}`} className="ticket-stub tap-scale block overflow-hidden rounded-card bg-surface p-4 shadow-card transition hover:shadow-elevated">
              <p className="type-heading text-ink">{t.event.title}</p>
              <p className="type-caption mt-1 text-muted">
                {t.holder.firstName === "César" ? "Moi" : `${t.holder.firstName} ${t.holder.lastName}`}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <Chip tone={t.status === "CONSUMED" ? "neutral" : "success"}>{statusLabel[t.status] ?? t.status}</Chip>
                <span className="type-caption text-muted">{new Date(t.event.startsAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}</span>
              </div>
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
              <p className="type-heading text-ink">{r.event?.title ?? r.eventId}</p>
              <p className="type-caption mt-1 text-muted">
                {statusLabel[r.status] ?? r.status} · {r.seats} · {r.amountXaf} FCFA
              </p>
              {r.needsPayment ? (
                <Link href={`/events/${r.eventId}/pay?reservationId=${r.id}`} className="type-body-sm mt-2 inline-block font-semibold text-accent">
                  {messages.booking.pay}
                </Link>
              ) : r.tickets[0] ? (
                <Link href={`/tickets/${r.tickets[0].id}`} className="type-body-sm mt-2 inline-block font-semibold text-accent">
                  {messages.booking.seeTicket}
                </Link>
              ) : null}
            </article>
          ))}
        </div>
      ) : null}
      {tab === "invites" ? (
        <div>
          <div className="mb-3 flex gap-2">
            <Chip active={box === "received"} onClick={() => setBox("received")}>
              {messages.world.inviteReceived}
            </Chip>
            <Chip active={box === "sent"} onClick={() => setBox("sent")}>
              {messages.world.inviteSentBox}
            </Chip>
          </div>
          {note ? <p className="type-body-sm mb-3 font-semibold text-accent">{note}</p> : null}
          {invites.length === 0 ? <EmptyState title={messages.world.tabInvites} body={messages.world.invitationsEmpty} /> : null}
          <div className="space-y-3">
            {invites.map((inv) => (
              <article key={inv.id} className="rounded-card bg-surface p-4 shadow-card">
                <p className="type-heading text-ink">{inv.event.title}</p>
                <p className="type-caption mt-1 text-muted">
                  {inv.inviter.firstName} → {inv.invitee.firstName} · {statusLabel[inv.status] ?? inv.status}
                </p>
                {box === "received" && inv.status === "PENDING" ? (
                  <div className="mt-3 flex gap-2">
                    <button type="button" className="tap-scale type-button flex-1 rounded-pill bg-accent py-2.5 text-on-primary transition hover:bg-accent-hover" onClick={() => void act(inv.id, "accept")}>
                      {messages.world.accept}
                    </button>
                    <button type="button" className="tap-scale type-button flex-1 rounded-pill border border-border bg-surface py-2.5 text-ink transition hover:bg-surface-sunken" onClick={() => void act(inv.id, "refuse")}>
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
