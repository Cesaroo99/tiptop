"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { EmptyState, ScreenHeader } from "@/components/ui";
import { api, ApiError, type InvitationItem } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

export default function Page() {
  const { messages } = useI18n();
  const router = useRouter();
  const [tab, setTab] = useState<"tickets" | "invites" | "reservations">("invites");
  const [box, setBox] = useState<"received" | "sent">("received");
  const [items, setItems] = useState<InvitationItem[]>([]);
  const [note, setNote] = useState<string | null>(null);

  async function load(next = box) {
    const data = await api<{ items: InvitationItem[] }>(`/invitations?box=${next}`);
    setItems(data.items);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [box]);

  async function act(id: string, action: "accept" | "refuse") {
    try {
      await api(`/invitations/${id}/${action}`, { method: "POST" });
      await load();
    } catch (e) {
      if (e instanceof ApiError && String(e.code).includes("PAYMENT")) {
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
      {tab === "tickets" ? <EmptyState title={messages.world.tabTickets} body={messages.world.ticketsLater} /> : null}
      {tab === "reservations" ? <EmptyState title={messages.world.tabReservations} body={messages.world.reservationsEmpty} /> : null}
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
          {items.length === 0 ? <EmptyState title={messages.world.tabInvites} body={messages.world.invitationsEmpty} /> : null}
          <div className="space-y-3">
            {items.map((inv) => (
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
